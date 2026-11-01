import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  BoxGeometry,
  TorusGeometry,
  HemisphereLight,
  DirectionalLight,
} from "three";
import { dot, label, type C } from "./common";
let state: {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    objects: Mesh[];
  } | null = null,
  failed = false;
export function disposeCreative3D() {
  if (!state) return;
  state.objects.forEach((o) => {
    o.geometry.dispose();
    (o.material as MeshStandardMaterial).dispose();
  });
  state.renderer.dispose();
  state.renderer.forceContextLoss();
  state = null;
}
export function drawThree(c: C, time: number, color: string) {
  if (!state && !failed) {
    try {
      const renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });
      renderer.setSize(640, 360, false);
      renderer.setPixelRatio(1);
      const scene = new Scene(),
        camera = new PerspectiveCamera(40, 16 / 9, 0.1, 100);
      camera.position.z = 10;
      scene.add(new HemisphereLight(0xffffff, 0x293d63, 2.5));
      const light = new DirectionalLight(0xffffff, 3);
      light.position.set(3, 4, 5);
      scene.add(light);
      const geometries = [
        new SphereGeometry(0.9, 24, 16),
        new BoxGeometry(1.5, 1.5, 1.5),
        new TorusGeometry(0.85, 0.28, 16, 40),
      ];
      const objects = geometries.map((geometry, i) => {
        const mesh = new Mesh(
          geometry,
          new MeshStandardMaterial({
            color: i === 1 ? "#9d89ef" : i === 2 ? "#efb76b" : color,
            metalness: 0.25,
            roughness: 0.27,
          }),
        );
        mesh.position.x = (i - 1) * 2.6;
        scene.add(mesh);
        return mesh;
      });
      state = { renderer, scene, camera, objects };
      window.addEventListener("pagehide", disposeCreative3D, { once: true });
    } catch {
      failed = true;
    }
  }
  if (state?.renderer.getContext().isContextLost()) {
    disposeCreative3D();
    failed = true;
  }
  if (state) {
    state.objects.forEach((m, i) => {
      m.rotation.set(
        time * 0.25 + i,
        time * 0.4 + i,
        Math.sin(time * 0.3 + i) * 0.3,
      );
      m.position.y = Math.sin(time * 0.7 + i * 2) * 0.65;
      (m.material as MeshStandardMaterial).color.set(
        i === 1 ? "#9d89ef" : i === 2 ? "#efb76b" : color,
      );
    });
    state.renderer.render(state.scene, state.camera);
    c.drawImage(state.renderer.domElement, 0, 0, 960, 540);
  } else {
    for (let i = 0; i < 3; i++)
      dot(c, 240 + i * 240, 260 + Math.sin(time + i) * 50, 60, color);
    label(c, "WebGL unavailable — 2D fallback", 480, 450, 24);
  }
}
