import * as THREE from "three";
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
) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive carton model / نموذج العلبة التفاعلي",
  );
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const texture = new THREE.CanvasTexture(atlas.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const model = buildCarton(size, texture, {
    width: atlas.image.width / atlas.pixelsPerMm,
    height: atlas.image.height / atlas.pixelsPerMm,
  });
  scene.add(model.root);
  scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x8a806c, 2));
  const key = new THREE.DirectionalLight(0xfff6e7, 3);
  key.position.set(150, 240, 220);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9eaff, 1.5);
  fill.position.set(-200, 70, -160);
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
      fit("current");
    },
    view: fit,
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
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
