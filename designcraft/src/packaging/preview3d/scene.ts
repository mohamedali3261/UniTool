import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { PreviewQuality } from "./quality";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import type { CartonSize } from "../geometry";
import type { cartonAtlas } from "./atlas";
import { buildCarton } from "./mesh";
export type View =
  "perspective" | "front" | "right" | "back" | "left" | "top" | "bottom";
export function createCartonPreview(
  host: HTMLDivElement,
  atlas: Awaited<ReturnType<typeof cartonAtlas>>,
  size: CartonSize,
  quality: PreviewQuality = "high",
) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive carton model / نموذج العلبة التفاعلي",
  );
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const texture = new THREE.CanvasTexture(atlas.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const model = buildCarton(size, texture, {
    width: atlas.image.width / atlas.pixelsPerMm,
    height: atlas.image.height / atlas.pixelsPerMm,
  });
  scene.add(model.root);
  const room = new RoomEnvironment(),
    pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 });
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.25;
  scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x938674, 0.75));
  const extent = Math.max(
    size.height + size.depth * 2 + size.tuck * 2,
    size.width * 2 + size.depth * 2 + size.glue,
  );
  const key = new THREE.DirectionalLight(0xfff5e7, 1.7);
  key.position.set(0.8, 1.2, 1).multiplyScalar(extent * 2);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(quality === "high" ? 2048 : 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -extent;
  key.shadow.camera.right = key.shadow.camera.top = extent;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = extent * 8;
  key.shadow.bias = -0.00002;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfeaff, 0.6);
  fill.position.set(-1, 0.4, -0.8).multiplyScalar(extent * 2);
  scene.add(fill);
  const controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 3;
  controls.zoomSpeed = 1.15;
  controls.panSpeed = 0.65; // Direct, non-inertial input keeps presets exact and respects reduced-motion by default.
  controls.staticMoving = true;
  let frame: number | null = null,
    disposed = false;
  const draw = () => {
    frame = null;
    if (disposed) return;
    controls.update();
    renderer.render(scene, camera);
  };
  const request = () => {
    if (!disposed && frame === null) frame = requestAnimationFrame(draw);
  };
  controls.addEventListener("change", request);
  // Trackball input mutates its internal vectors; update() must be scheduled on input,
  // not only on 'change' (which is emitted by update itself). No idle animation loop.
  const input = (event: Event) => {
    if (
      event.type !== "pointermove" ||
      (event as PointerEvent).buttons ||
      (event as PointerEvent).pointerType === "touch"
    )
      request();
  };
  controls.addEventListener("start", request);
  controls.addEventListener("end", request);
  const events = ["pointerdown", "pointermove", "pointerup", "wheel"];
  events.forEach((name) =>
    renderer.domElement.addEventListener(name, input, { passive: true }),
  );
  const fit = (view: View | "current" = "perspective") => {
    model.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model.root),
      center = box.getCenter(new THREE.Vector3()),
      span = box.getSize(new THREE.Vector3());
    const directions: Record<View, number[]> = {
      perspective: [1, 0.55, 1.25],
      front: [0, 0, 1],
      right: [1, 0, 0],
      back: [0, 0, -1],
      left: [-1, 0, 0],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
    };
    const direction =
      view === "current"
        ? camera.position.clone().sub(controls.target)
        : new THREE.Vector3(...(directions[view] as [number, number, number]));
    if (direction.lengthSq() < 1e-8) direction.set(1, 0.55, 1.25);
    direction.normalize();
    // Bounding sphere fit respects both portrait and landscape viewports, even for the unfolded net.
    const radius = Math.max(1, span.length() / 2),
      vertical = THREE.MathUtils.degToRad(camera.fov) / 2,
      horizontal = Math.atan(Math.tan(vertical) * camera.aspect),
      distance = (radius / Math.sin(Math.min(vertical, horizontal))) * 1.08;
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(direction, distance);
    if (view !== "current") camera.up.set(0, 1, 0);
    if (view === "top") camera.up.set(0, 0, -1);
    if (view === "bottom") camera.up.set(0, 0, 1);
    camera.near = Math.max(0.01, distance / 1000);
    camera.far = distance + radius * 100;
    camera.updateProjectionMatrix();
    controls.minDistance = radius * 0.15;
    controls.maxDistance = distance * 10;
    camera.lookAt(center);
    controls.update();
    request();
  };
  const resize = () => {
    const w = Math.max(1, host.clientWidth),
      h = Math.max(1, host.clientHeight);
    const mobile = window.innerWidth < 768,
      desired =
        quality === "high"
          ? Math.max(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
          : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(
      Math.min(
        2.5,
        desired,
        Math.sqrt((mobile ? 2_500_000 : 4_000_000) / (w * h)),
      ),
    );
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.handleResize();
    fit("current");
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const loss = (event: Event) => {
    event.preventDefault();
    host.dispatchEvent(new CustomEvent("carton-webgl-lost"));
  };
  renderer.domElement.addEventListener("webglcontextlost", loss);
  const keydown = (event: KeyboardEvent) => {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "-",
        "Home",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Home") {
      fit();
      return;
    }
    const offset = camera.position.clone().sub(controls.target);
    if (event.key === "+" || event.key === "-")
      offset.multiplyScalar(event.key === "+" ? 0.9 : 1.1);
    else {
      const axis =
        event.key === "ArrowLeft" || event.key === "ArrowRight"
          ? camera.up.clone().normalize()
          : new THREE.Vector3()
              .crossVectors(
                camera.getWorldDirection(new THREE.Vector3()),
                camera.up,
              )
              .normalize();
      offset.applyAxisAngle(
        axis,
        ((event.key === "ArrowLeft" || event.key === "ArrowUp" ? 1 : -1) *
          Math.PI) /
          12,
      );
    }
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    request();
  };
  renderer.domElement.addEventListener("keydown", keydown);
  return {
    setFold: (value: number) => {
      model.setFold(value);
      renderer.shadowMap.needsUpdate = true;
      fit("current");
    },
    view: fit,
    setFinish: (finish: "matte" | "satin") => {
      model.setFinish(finish);
      request();
    },
    dispose: () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener("change", request);
      controls.removeEventListener("start", request);
      controls.removeEventListener("end", request);
      events.forEach((name) =>
        renderer.domElement.removeEventListener(name, input),
      );
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", loss);
      renderer.domElement.removeEventListener("keydown", keydown);
      model.dispose();
      texture.dispose();
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
