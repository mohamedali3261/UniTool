import { deformTeeGeometry } from "../core/teeStyles";
import { parseGarmentGlb, glbBuffer, disposeGlb } from "../core/glb";
import { teeSurfaceDepth } from "../core/flatTee";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeBackdrop } from "../core/staging";
import { garmentMesh } from "../core/garment";
import { drawArtwork } from "../core/artwork";
import {
  surfaceDepth,
  configureFabricMaterial,
  type Appearance,
} from "../core/fabric";
import { printParts, type Project, type Side, type Layer } from "../core/model";
export interface PreviewHandle {
  resetView: () => void;
  focusArtwork: () => void;
  setCameraView: (view: "front" | "quarter" | "side" | "back") => void;
  exportImage: (size: number, transparent: boolean) => Promise<Blob>;
}
export const Preview3D = forwardRef<
  PreviewHandle,
  {
    project: Project;
    side: Side;
    spin: boolean;
    ar: boolean;
    onError: (s: string) => void;
  }
>(function Preview3D({ project, side, spin, ar, onError }, ref) {
  const host = useRef<HTMLDivElement>(null),
    runtime = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      light: THREE.DirectionalLight;
      refresh: () => void;
      fit: () => void;
      fitDistance: () => number;
    } | null>(null);
  const garment = useRef<THREE.Group | null>(null);
  const framed = useRef("");
  const printed = useRef(
    new Map<Side, { group: THREE.Group; layers: Layer[]; color: string }>(),
  );
  const lastTextureUpdate = useRef(0);
  const modelPending = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const [modelRevision, setModelRevision] = useState(0);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useImperativeHandle(
    ref,
    () => ({
      setCameraView: (view) => {
        const r = runtime.current;
        if (!r) return;
        const positions = {
          front: [0.0, 0.25, 6.0],
          quarter: [3.4, 0.3, 4.5],
          side: [6.0, 0.25, 0.3],
          back: [0, 0.25, -6.0],
        };
        r.camera.position.fromArray(positions[view]);
        r.camera.position
          .sub(new THREE.Vector3(0, 0.36, 0))
          .normalize()
          .multiplyScalar(r.fitDistance())
          .add(new THREE.Vector3(0, 0.36, 0));
        r.controls.target.set(0, 0.36, 0);
        r.fit();
        r.controls.update();
        r.refresh();
      },
      focusArtwork: () => {
        const r = runtime.current;
        if (!r) return;
        r.controls.target.set(0, 0, 0);
        r.camera.position
          .sub(r.controls.target)
          .normalize()
          .multiplyScalar(r.fitDistance() * 0.55)
          .add(r.controls.target);
        r.controls.update();
        r.refresh();
      },
      resetView: () => {
        const r = runtime.current;
        if (!r) return;
        const left = side === "leftSleeve" || side === "hoodLeft",
          right = side === "rightSleeve" || side === "hoodRight";
        r.camera.position.set(
          left ? -4 : right ? 4 : 0.3,
          0.25,
          side === "back" ? -6.0 : left || right ? 4.7 : 6.0,
        );
        r.controls.target.set(0, 0.36, 0);
        r.fit();
        r.controls.update();
        r.refresh();
      },
      exportImage: async (size, transparent) => {
        await modelPending.current;
        let latest: Promise<unknown>;
        do {
          latest = pending.current;
          await latest;
        } while (latest !== pending.current);
        const r = runtime.current;
        if (!r)
          throw new Error(
            ar
              ? "معاينة 3D غير متاحة على هذا الجهاز"
              : "3D is unavailable on this device",
          );
        const old = r.renderer.getSize(new THREE.Vector2()),
          aspect = r.camera.aspect,
          bg = r.scene.background,
          pixelRatio = r.renderer.getPixelRatio();
        try {
          r.renderer.setPixelRatio(1);
          r.renderer.setSize(size, size, false);
          r.camera.aspect = 1;
          r.camera.updateProjectionMatrix();
          if (transparent) r.scene.background = null;
          r.renderer.render(r.scene, r.camera);
          return await new Promise<Blob>((resolve, reject) =>
            r.renderer.domElement.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
              "image/png",
            ),
          );
        } finally {
          r.scene.background = bg;
          r.camera.aspect = aspect;
          r.camera.updateProjectionMatrix();
          r.renderer.setPixelRatio(pixelRatio);
          r.renderer.setSize(old.x, old.y, false);
          r.refresh();
        }
      },
    }),
    [ar, side],
  );
  useEffect(() => {
    const div = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    div.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0.3, 0.2, 6.0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.36, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.3;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.8;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777b72, 2.0));
    const light = new THREE.DirectionalLight(0xffffff, 2.7);
    light.position.set(-3, 5, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.radius = 5;
    light.shadow.normalBias = 0.005;
    light.shadow.bias = -0.00015;
    light.shadow.camera.left = -2.6;
    light.shadow.camera.right = 2.6;
    light.shadow.camera.top = 3;
    light.shadow.camera.bottom = -2.3;
    light.shadow.camera.far = 20;
    light.shadow.camera.updateProjectionMatrix();
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xffffff, 1.5);
    rim.position.set(4, 2, -4);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.38;
    floor.receiveShadow = true;
    scene.add(floor);
    const refresh = () => renderer.render(scene, camera);
    controls.addEventListener("change", refresh);
    const fitDistance = () => {
      const box = garment.current
        ? new THREE.Box3()
            .setFromObject(garment.current)
            .getSize(new THREE.Vector3())
        : new THREE.Vector3(3.0, 3.35, 0.7);
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(
        5.7,
        (box.y / (2 * tangent)) * 1.13,
        (box.x / (2 * tangent * Math.max(0.25, camera.aspect))) * 1.13,
      );
    };
    const fit = () => {
      const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();
      camera.position
        .copy(controls.target)
        .addScaledVector(direction, fitDistance());
      controls.update();
      refresh();
    };
    runtime.current = {
      renderer,
      scene,
      camera,
      controls,
      light,
      refresh,
      fit,
      fitDistance,
    };
    const ro = new ResizeObserver(() => {
      const w = div.clientWidth,
        h = div.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit();
    });
    ro.observe(div);
    let frame = 0;
    function tick() {
      frame = requestAnimationFrame(tick);
      controls.update();
    }
    tick();
    setReady(true);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    const r = runtime.current;
    if (!r || !ready) return;
    const q = project.appearance.previewQuality ?? "auto";
    const ratio =
      q === "auto"
        ? Math.min(devicePixelRatio, 1)
        : Math.min(devicePixelRatio, 2) *
          (q === "half" ? 0.5 : q === "quarter" ? 0.25 : 1);
    r.renderer.setPixelRatio(ratio);
    r.renderer.setSize(
      host.current!.clientWidth,
      host.current!.clientHeight,
      false,
    );
    r.refresh();
  }, [project.appearance.previewQuality, ready]);
  useEffect(() => {
    if (runtime.current) runtime.current.controls.autoRotate = spin;
  }, [spin, ready]);
  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    const left = side === "leftSleeve" || side === "hoodLeft",
      right = side === "rightSleeve" || side === "hoodRight";
    r.camera.position.set(
      left ? -4 : right ? 4 : 0.3,
      0.25,
      side === "back" ? -6.0 : left || right ? 4.7 : 6.0,
    );
    r.controls.target.set(0, 0.36, 0);
    r.fit();
    r.controls.update();
  }, [side, ready]);
  useEffect(() => {
    const r = runtime.current;
    if (!r || !ready) return;
    const group = project.customModel
      ? new THREE.Group()
      : garmentMesh(project.product, project.color, project.appearance);
    modelPending.current = Promise.resolve();
    let disposed = false;
    if (project.customModel) {
      const work = parseGarmentGlb(glbBuffer(project.customModel))
        .then((model) => {
          if (disposed) {
            disposeGlb(model);
            return;
          }
          group.add(model);
          model.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          r.fit();
          setModelRevision((n) => n + 1);
          r.refresh();
        })
        .catch((e) => {
          if (!disposed) {
            group.add(
              garmentMesh(project.product, project.color, project.appearance),
            );
            r.fit();
            r.refresh();
            onError(String(e));
          }
        });
      modelPending.current = work;
    }
    garment.current = group;
    r.scene.add(group);
    const frameKey = `${project.product}-${project.appearance.fit}-${project.appearance.teeStyle}-${project.appearance.hanger}`;
    if (framed.current !== frameKey) {
      framed.current = frameKey;
      r.fit();
    }
    r.light.intensity = project.appearance.lightPower;
    const angle = (project.appearance.lightAngle * Math.PI) / 180;
    r.light.position.set(Math.sin(angle) * 5, 4, Math.cos(angle) * 5);

    return () => {
      r.scene.remove(group);
      disposed = true;
      garment.current = null;
      const materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(m);
            if (m.map) textures.add(m.map);
            if (m.bumpMap) textures.add(m.bumpMap);
          }
        }
      });
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [
    project.product,
    project.customModel,
    project.color,
    project.appearance.wrinkles,
    project.appearance.texture,
    project.appearance.roughness,
    project.appearance.pose,
    project.appearance.fit,
    project.appearance.teeStyle,
    project.appearance.hanger,
    project.appearance.gradient,
    project.appearance.material,
    project.appearance.knitSize,
    project.appearance.brightness,
    ready,
  ]);
  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    const angle = (project.appearance.lightAngle * Math.PI) / 180;
    r.light.position.set(Math.sin(angle) * 5, 4, Math.cos(angle) * 5);
    r.light.intensity = project.appearance.lightPower;
    r.refresh();
  }, [project.appearance.lightAngle, project.appearance.lightPower, ready]);
  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    const background =
      project.appearance.backdrop !== "solid"
        ? makeBackdrop(project.background, project.appearance.backdrop)
        : new THREE.Color(project.background);
    r.scene.background = background;
    r.refresh();
    return () => {
      if (background instanceof THREE.Texture) background.dispose();
    };
  }, [project.background, project.appearance.backdrop, ready]);

  useEffect(() => {
    const r = runtime.current,
      group = garment.current;
    if (!r || !group || !ready) return;
    let cancelled = false,
      timer = 0;
    const renderTextures = () =>
      Promise.all(
        printParts.map(async (face) => {
          await modelPending.current;
          if (cancelled) return;
          const previous = printed.current.get(face);
          if (
            previous?.group === group &&
            previous.layers === project.sides[face] &&
            previous.color === project.color
          )
            return;
          const canvas = await drawArtwork(project.sides[face]);
          if (cancelled) return;
          printed.current.set(face, {
            group,
            layers: project.sides[face],
            color: project.color,
          });
          if (project.customModel || !["front", "back"].includes(face)) {
            const target = group.getObjectByName(face) as
              THREE.Mesh | undefined;
            if (!target) return;
            const c = document.createElement("canvas");
            c.width = c.height = 1024;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(canvas, 0, 0);
            const texture = new THREE.CanvasTexture(c);
            texture.colorSpace = THREE.SRGBColorSpace;
            if (project.customModel) texture.flipY = false;
            const mat = target.userData.printMaterial
              ? (target.material as THREE.MeshPhysicalMaterial)
              : (target.material as THREE.MeshPhysicalMaterial).clone();
            configureFabricMaterial(mat, project.color, project.appearance);
            mat.map?.dispose();
            mat.color.set("white");
            mat.map = texture;
            mat.needsUpdate = true;
            target.material = mat;
            target.userData.printMaterial = true;
            return;
          }
          const old = group.getObjectByName("print-" + face) as
            THREE.Mesh | undefined;
          if (old) {
            const mat = old.material as THREE.MeshStandardMaterial;
            if (mat.map) {
              mat.map.image = canvas;
              mat.map.needsUpdate = true;
            }
            return;
          }
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = r.renderer.capabilities.getMaxAnisotropy();
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            roughness: 1,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            toneMapped: false,
          });
          const plane = new THREE.PlaneGeometry(1.25, 1.25, 48, 48),
            p = plane.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const x = p.getX(i),
              y = p.getY(i);
            let z =
              project.product === "tote"
                ? 0.182
                : (project.product === "tee"
                    ? teeSurfaceDepth(
                        face === "back" ? -x : x,
                        y,
                        project.appearance.wrinkles,
                      )
                    : surfaceDepth(x, y, project.appearance.wrinkles)) + 0.012;
            if (project.product === "hoodie" && face === "front" && y < -0.48) {
              const pocketWidth =
                0.35 + 0.21 * Math.min(1, ((-0.48 - y) / 0.54) * 2);
              if (Math.abs(x) < pocketWidth) z += 0.045;
            }
            p.setZ(i, z);
          }
          plane.computeVertexNormals();
          if (project.product === "tee" && project.appearance.teeStyle) {
            // Back artwork is rotated after deformation: mirror world Z for the asymmetric V neckline.
            if (face === "back") {
              for (let i = 0; i < p.count; i++) p.setZ(i, -p.getZ(i));
            }
            deformTeeGeometry(plane, project.appearance.teeStyle);
            if (face === "back") {
              for (let i = 0; i < p.count; i++) p.setZ(i, -p.getZ(i));
              plane.computeVertexNormals();
            }
          }
          const print = new THREE.Mesh(plane, material);
          print.name = "print-" + face;
          if (face === "back") print.rotation.y = Math.PI;
          group.add(print);
        }),
      );
    let settle: () => void = () => {};
    const work = new Promise<void>((resolve, reject) => {
      settle = resolve;
      timer = window.setTimeout(
        () => {
          renderTextures().then(() => resolve(), reject);
        },
        Math.max(0, 80 - (performance.now() - lastTextureUpdate.current)),
      );
    });
    pending.current = work.then(() => {
      if (!cancelled) lastTextureUpdate.current = performance.now();
      if (!cancelled) r.refresh();
    });
    pending.current.catch((e) => {
      if (!cancelled) onError(String(e));
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      settle();
    };
  }, [
    modelRevision,
    project.sides,
    project.product,
    project.customModel,
    project.color,
    project.appearance.wrinkles,
    project.appearance.texture,
    project.appearance.roughness,
    project.appearance.pose,
    project.appearance.fit,
    project.appearance.teeStyle,
    project.appearance.hanger,
    project.appearance.gradient,
    project.appearance.material,
    project.appearance.knitSize,
    project.appearance.brightness,
    ready,
    onError,
  ]);

  return (
    <div
      className="ps-three"
      ref={host}
      aria-label={
        ar ? "مجسم ثلاثي الأبعاد — اسحب للدوران" : "3D product — drag to rotate"
      }
    >
      {failed && (
        <div className="ps-webgl-error">
          {ar
            ? "جهازك لا يدعم WebGL. محرر 2D وتصدير التصميم متاحان."
            : "WebGL is unavailable. Use the 2D editor and artwork export."}
        </div>
      )}
    </div>
  );
});
