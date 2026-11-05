import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { fabric } from "fabric";
import { buildCarton } from "./mesh";
import { cartonAtlas } from "./atlas";
import { createCartonProject } from "../project";
import { cartonArtwork, type ArtworkOptions } from "../artwork";
import type { CartonSize } from "../geometry";
export type CardSource = {
  key: string;
  size: CartonSize;
  artwork?: ArtworkOptions;
  canvasData?: any;
};
/** One shared, queued WebGL context per gallery. Native artwork, not a stock mockup. */
export function createCardRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setSize(600, 440, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dedbd3");
  const room = new RoomEnvironment(),
    generator = new THREE.PMREMGenerator(renderer),
    environment = generator.fromScene(room, 0.04, 0.1, 100, { size: 64 });
  room.dispose();
  generator.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(30, 600 / 440, 0.1, 20000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa9a08b, 1));
  const key = new THREE.DirectionalLight(0xfff8ed, 2);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.shadow.bias = -0.00005;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdceafa, 0.7);
  scene.add(fill);
  const floorGeometry = new THREE.PlaneGeometry(1, 1),
    floorMaterial = new THREE.ShadowMaterial({ opacity: 0.16 }),
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  let disposed = false,
    queue: Promise<unknown> = Promise.resolve();
  const cache = new Map<string, string>(),
    urls = new Set<string>();
  const render = (
    source: CardSource,
    signal: AbortSignal,
  ): Promise<string | undefined> => {
    if (cache.has(source.key)) return Promise.resolve(cache.get(source.key));
    const task = queue
      .catch(() => {})
      .then(async () => {
        if (disposed || signal.aborted) return;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        if (disposed || signal.aborted) return;
        const project = createCartonProject(source.size, "preview"),
          surface = new fabric.StaticCanvas(null, {
            width: 1,
            height: 1,
            enableRetinaScaling: false,
            renderOnAddRemove: false,
          });
        let atlas: Awaited<ReturnType<typeof cartonAtlas>> | undefined,
          model: ReturnType<typeof buildCarton> | undefined,
          texture: THREE.CanvasTexture | undefined;
        try {
          const json = source.canvasData || {
            ...project.canvasData,
            objects: [
              ...cartonArtwork(source.size, source.artwork!),
              ...project.canvasData.objects,
            ],
          };
          await new Promise<void>((resolve) =>
            surface.loadFromJSON(json, () => resolve()),
          );
          if (disposed || signal.aborted) return;
          atlas = await cartonAtlas(
            surface,
            source.size,
            project.width,
            project.height,
            1024,
            1_000_000,
          );
          if (disposed || signal.aborted) return;
          texture = new THREE.CanvasTexture(atlas.image);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
          model = buildCarton(source.size, texture, {
            width: atlas.image.width / atlas.pixelsPerMm,
            height: atlas.image.height / atlas.pixelsPerMm,
          });
          scene.add(model.root);
          model.setFinish("matte");
          model.root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model.root),
            center = box.getCenter(new THREE.Vector3()),
            span = box.getSize(new THREE.Vector3()),
            radius = span.length() / 2,
            distance = (radius / Math.sin(THREE.MathUtils.degToRad(15))) * 1.07;
          camera.position
            .copy(center)
            .addScaledVector(
              new THREE.Vector3(
                1,
                source.size.construction ? 1.1 : 0.7,
                1.3,
              ).normalize(),
              distance,
            );
          camera.near = Math.max(0.01, radius / 1000);
          camera.far = distance + radius * 20;
          camera.updateProjectionMatrix();
          camera.lookAt(center);
          key.position
            .copy(center)
            .add(new THREE.Vector3(0.8, 1.5, 1.2).multiplyScalar(radius * 4));
          fill.position
            .copy(center)
            .add(new THREE.Vector3(-1, 0.5, -0.6).multiplyScalar(radius * 3));
          key.target.position.copy(center);
          scene.add(key.target);
          key.shadow.camera.left = key.shadow.camera.bottom = -radius * 2;
          key.shadow.camera.right = key.shadow.camera.top = radius * 2;
          key.shadow.camera.far = radius * 12;
          key.shadow.camera.updateProjectionMatrix();
          floor.position.set(center.x, box.min.y - 0.15, center.z);
          floor.scale.set(radius * 10, radius * 10, 1);
          renderer.render(scene, camera);
          const blob = await new Promise<Blob | null>((resolve) =>
            renderer.domElement.toBlob(resolve, "image/webp", 0.92),
          );
          if (!blob || disposed || signal.aborted) return;
          const url = URL.createObjectURL(blob);
          urls.add(url);
          cache.set(source.key, url);
          return url;
        } finally {
          if (model) {
            scene.remove(model.root);
            model.dispose();
          }
          texture?.dispose();
          atlas?.dispose();
          surface.dispose();
        }
      });
    queue = task;
    return task;
  };
  return {
    render,
    dispose: () => {
      disposed = true;
      void queue
        .catch(() => {})
        .then(() => {
          urls.forEach(URL.revokeObjectURL);
          cache.clear();
          floorGeometry.dispose();
          floorMaterial.dispose();
          key.shadow.dispose();
          environment.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
        });
    },
  };
}
