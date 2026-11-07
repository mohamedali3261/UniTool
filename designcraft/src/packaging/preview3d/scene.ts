import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { PreviewQuality } from "./quality";
import type { CartonSize } from "../geometry";
import type { cartonAtlas } from "./atlas";
import { buildCarton, type CartonFinish } from "./mesh";

export type View =
  | "perspective"
  | "front"
  | "right"
  | "back"
  | "left"
  | "top"
  | "bottom";

export type CartonLighting = "studio" | "warm" | "daylight" | "dramatic";
export type InteractionMode = "orbit" | "pan";

const PERSP_YAW = Math.atan2(1, 1.25);
const PERSP_PITCH = Math.asin(0.55 / Math.hypot(1, 0.55, 1.25));

const VIEW_ANGLES: Record<View, [yaw: number, pitch: number]> = {
  perspective: [PERSP_YAW, PERSP_PITCH],
  front: [0, 0],
  right: [Math.PI / 2, 0],
  back: [Math.PI, 0],
  left: [-Math.PI / 2, 0],
  top: [0, Math.PI / 2],
  bottom: [0, -Math.PI / 2],
};

export function createCartonPreview(
  host: HTMLDivElement,
  atlas: Awaited<ReturnType<typeof cartonAtlas>>,
  size: CartonSize,
  quality: PreviewQuality = "high",
  onDragStateChange?: (dragging: boolean) => void,
) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10000);
  const renderer = new THREE.WebGLRenderer({
    antialias: !(typeof navigator !== "undefined" && navigator.webdriver === true),
    alpha: true,
    powerPreference: "low-power",
  });
  const gl = renderer.getContext();
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const unmasked = dbg
    ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "")
    : String(gl.getParameter(gl.RENDERER) || "");
  const isHardwareGpu =
    /nvidia|geforce|radeon|amd|apple|adreno|mali|arc|iris|uhd graphics/i.test(
      unmasked,
    );
  const isSoftwareGl =
    /swiftshader|subzero|llvmpipe|software|mesa offscreen|basic render/i.test(
      unmasked,
    ) ||
    (typeof navigator !== "undefined" &&
      navigator.webdriver === true &&
      !isHardwareGpu);

  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = !isSoftwareGl;
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
  renderer.domElement.style.touchAction = "none";
  host.appendChild(renderer.domElement);

  const texture = new THREE.CanvasTexture(atlas.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (isSoftwareGl) {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
  } else {
    texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  }
  const model = buildCarton(size, texture, {
    width: atlas.image.width / atlas.pixelsPerMm,
    height: atlas.image.height / atlas.pixelsPerMm,
  });
  scene.add(model.root);

  let environment: THREE.WebGLRenderTarget | null = null;
  if (!isSoftwareGl) {
    const room = new RoomEnvironment(),
      pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    room.dispose();
    pmrem.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.25;
  }

  const hemi = new THREE.HemisphereLight(
    0xf5f8ff,
    0x938674,
    isSoftwareGl ? 0.95 : 0.75,
  );
  scene.add(hemi);

  const extent = Math.max(
    size.height + size.depth * 2 + size.tuck * 2,
    size.width * 2 + size.depth * 2 + size.glue,
  );
  const key = new THREE.DirectionalLight(0xfff5e7, 1.7);
  key.position.set(0.8, 1.2, 1).multiplyScalar(extent * 2);
  key.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    key.shadow.mapSize.setScalar(quality === "high" ? 2048 : 1024);
  }
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

  // Precision horizon-stable 360° spherical-turntable camera with smooth velocity damping
  const reducedMotion = () =>
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  let yaw = PERSP_YAW;
  let pitch = PERSP_PITCH;
  let distance = extent * 2.2;
  let minDistance = Math.max(4, extent * 0.12);
  let maxDistance = Math.max(2000, extent * 24);
  const target = new THREE.Vector3(0, 0, 0);

  let vYaw = 0;
  let vPitch = 0;
  let vZoom = 0;
  let vPanX = 0;
  let vPanY = 0;

  let interactionMode: InteractionMode = "orbit";
  let currentLighting: CartonLighting = "studio";
  let autoRotate = false;
  let isDragging = false;
  let frame: number | null = null;
  let lastTickTime = 0;
  let lastW = 0;
  let lastH = 0;
  let disposed = false;

  const setDragging = (next: boolean) => {
    if (isDragging === next) return;
    isDragging = next;
    host.dataset.dragging = next ? "true" : "false";
    onDragStateChange?.(next);
  };

  const syncCamera = () => {
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    distance = THREE.MathUtils.clamp(distance, minDistance, maxDistance);
    camera.position.set(
      target.x + distance * cosP * sinY,
      target.y + distance * sinP,
      target.z + distance * cosP * cosY,
    );
    camera.up.set(-sinP * sinY, cosP, -sinP * cosY);
    camera.lookAt(target);
  };

  const renderNow = () => {
    if (disposed) return;
    syncCamera();
    renderer.render(scene, camera);
  };

  const hasVelocity = () =>
    Math.abs(vYaw) > 1e-4 ||
    Math.abs(vPitch) > 1e-4 ||
    Math.abs(vZoom) > 1e-4 ||
    Math.abs(vPanX) > 1e-3 ||
    Math.abs(vPanY) > 1e-3;

  const panByWorld = (dxWorld: number, dyWorld: number) => {
    const sinP = Math.sin(pitch);
    const cosP = Math.cos(pitch);
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    target.x += dxWorld * cosY + dyWorld * (-sinP * sinY);
    target.y += dyWorld * cosP;
    target.z += dxWorld * -sinY + dyWorld * (-sinP * cosY);
  };

  const worldPerPixel = () => {
    const h = Math.max(1, host.clientHeight || 420);
    return (
      (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) / h
    );
  };

  const tick = (now: number) => {
    frame = null;
    if (disposed) return;
    const rawDt = lastTickTime
      ? Math.min(64, Math.max(4, now - lastTickTime))
      : 16.67;
    lastTickTime = now;
    const dtFrames = rawDt / 16.667;

    if (!isDragging) {
      if (autoRotate) {
        yaw += (rawDt / 1000) * 0.62;
      }
      if (reducedMotion() || isSoftwareGl) {
        vYaw = vPitch = vZoom = vPanX = vPanY = 0;
      } else {
        if (Math.abs(vYaw) > 1e-4 || Math.abs(vPitch) > 1e-4) {
          yaw += vYaw * dtFrames;
          pitch += vPitch * dtFrames;
          const decay = Math.pow(0.86, dtFrames);
          vYaw *= decay;
          vPitch *= decay;
        } else {
          vYaw = vPitch = 0;
        }
        if (Math.abs(vPanX) > 1e-3 || Math.abs(vPanY) > 1e-3) {
          panByWorld(vPanX * dtFrames, vPanY * dtFrames);
          const decay = Math.pow(0.84, dtFrames);
          vPanX *= decay;
          vPanY *= decay;
        } else {
          vPanX = vPanY = 0;
        }
      }
    }

    if (Math.abs(vZoom) > 1e-4) {
      if (reducedMotion() || isSoftwareGl) {
        distance = THREE.MathUtils.clamp(
          distance * Math.exp(vZoom),
          minDistance,
          maxDistance,
        );
        vZoom = 0;
      } else {
        const step = vZoom * Math.min(1, 0.28 * dtFrames);
        distance = THREE.MathUtils.clamp(
          distance * Math.exp(step),
          minDistance,
          maxDistance,
        );
        vZoom -= step;
        if (Math.abs(vZoom) < 1e-4) vZoom = 0;
      }
    }

    renderNow();

    if (autoRotate || hasVelocity()) {
      frame = requestAnimationFrame(tick);
    } else {
      lastTickTime = 0;
    }
  };

  const ensureLoop = () => {
    if (frame === null && !disposed) {
      lastTickTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const computeBoundsMetrics = () => {
    model.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model.root),
      center = box.getCenter(new THREE.Vector3()),
      span = box.getSize(new THREE.Vector3());
    const radius = Math.max(1, span.length() / 2),
      vertical = THREE.MathUtils.degToRad(camera.fov) / 2,
      horizontal = Math.atan(Math.tan(vertical) * Math.max(camera.aspect, 0.2)),
      fitDist = (radius / Math.sin(Math.min(vertical, horizontal))) * 1.08;
    camera.near = Math.max(0.01, fitDist / 1000);
    camera.far = fitDist + radius * 100;
    camera.updateProjectionMatrix();
    minDistance = radius * 0.15;
    maxDistance = fitDist * 10;
    return { center, fitDist };
  };

  const fit = (view: View | "current" = "perspective", immediate = true) => {
    const { center, fitDist } = computeBoundsMetrics();
    vYaw = vPitch = vZoom = vPanX = vPanY = 0;
    target.copy(center);
    distance = fitDist;
    if (view !== "current") {
      [yaw, pitch] = VIEW_ANGLES[view];
    }
    if (immediate) renderNow();
    else ensureLoop();
  };

  const resize = () => {
    const w = Math.max(1, host.clientWidth),
      h = Math.max(1, host.clientHeight);
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    const mobile = window.innerWidth < 768,
      desired = isSoftwareGl
        ? 1
        : quality === "high"
          ? Math.max(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
          : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(
      Math.min(
        isSoftwareGl ? 1 : 2.5,
        desired,
        Math.sqrt(
          (isSoftwareGl ? 1_000_000 : mobile ? 2_500_000 : 4_000_000) / (w * h),
        ),
      ),
    );
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit("current", false);
  };

  const applyDragDelta = (dx: number, dy: number, forcePan: boolean) => {
    const h = Math.max(220, host.clientHeight || 420);
    if (forcePan || interactionMode === "pan") {
      const wpp = worldPerPixel();
      const wx = -dx * wpp;
      const wy = dy * wpp;
      panByWorld(wx, wy);
      vPanX = vPanX * 0.45 + wx * 0.55;
      vPanY = vPanY * 0.45 + wy * 0.55;
    } else {
      const speed = (Math.PI * 1.7) / h;
      const hemiSign = Math.cos(pitch) >= 0 ? 1 : -1;
      const dYaw = -dx * speed * hemiSign;
      const dPitch = dy * speed;
      yaw += dYaw;
      pitch += dPitch;
      vYaw = vYaw * 0.45 + dYaw * 0.55;
      vPitch = vPitch * 0.45 + dPitch * 0.55;
    }
    if (isSoftwareGl || reducedMotion()) {
      vYaw = vPitch = vPanX = vPanY = 0;
      renderNow();
    } else {
      ensureLoop();
    }
  };

  // Mouse & Pen pointer drag
  let activePointerId: number | null = null;
  let lastPtrX = 0;
  let lastPtrY = 0;
  let ptrPan = false;
  let lastMoveStamp = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    e.preventDefault();
    renderer.domElement.focus({ preventScroll: true });
    activePointerId = e.pointerId;
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    lastMoveStamp = performance.now();
    ptrPan = e.button === 1 || e.button === 2 || e.shiftKey;
    vYaw = vPitch = vPanX = vPanY = 0;
    setDragging(true);
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic event */
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || e.pointerId !== activePointerId) return;
    const dx = e.clientX - lastPtrX;
    const dy = e.clientY - lastPtrY;
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    lastMoveStamp = performance.now();
    if (dx === 0 && dy === 0) return;
    applyDragDelta(dx, dy, ptrPan || e.shiftKey);
  };

  const endPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch" || e.pointerId !== activePointerId) return;
    try {
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
    activePointerId = null;
    if (performance.now() - lastMoveStamp > 90) {
      vYaw = vPitch = vPanX = vPanY = 0;
    }
    setDragging(false);
    if (autoRotate || hasVelocity()) ensureLoop();
  };

  const onContextMenu = (e: Event) => e.preventDefault();
  const onDblClick = () => fit("perspective");

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const norm =
      e.deltaMode === 1
        ? e.deltaY * 24
        : e.deltaMode === 2
          ? e.deltaY * 240
          : e.deltaY;
    const zoomDelta = THREE.MathUtils.clamp(norm * 0.0012, -0.35, 0.35);
    if (reducedMotion()) {
      distance = THREE.MathUtils.clamp(
        distance * Math.exp(zoomDelta),
        minDistance,
        maxDistance,
      );
      renderNow();
    } else {
      vZoom = THREE.MathUtils.clamp(vZoom + zoomDelta, -0.8, 0.8);
      ensureLoop();
    }
  };

  // Touch events (1-finger orbit/pan + 2-finger pinch-zoom & pan)
  let touchPrevX = 0;
  let touchPrevY = 0;
  let touchPrevSpread = 0;
  let lastTouchStamp = 0;

  const touchMetrics = (touches: TouchList) => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY, spread: 0 };
    }
    const x = (touches[0].clientX + touches[1].clientX) * 0.5;
    const y = (touches[0].clientY + touches[1].clientY) * 0.5;
    const spread = Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
    return { x, y, spread };
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const m = touchMetrics(e.touches);
    touchPrevX = m.x;
    touchPrevY = m.y;
    touchPrevSpread = m.spread;
    lastTouchStamp = performance.now();
    vYaw = vPitch = vPanX = vPanY = 0;
    setDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const m = touchMetrics(e.touches);
    const dx = m.x - touchPrevX;
    const dy = m.y - touchPrevY;
    lastTouchStamp = performance.now();

    if (e.touches.length >= 2) {
      if (touchPrevSpread > 8 && m.spread > 8) {
        distance = THREE.MathUtils.clamp(
          distance * (touchPrevSpread / m.spread),
          minDistance,
          maxDistance,
        );
      }
      if (dx !== 0 || dy !== 0) {
        applyDragDelta(dx, dy, true);
      } else {
        renderNow();
      }
    } else if (dx !== 0 || dy !== 0) {
      applyDragDelta(dx, dy, false);
    }

    touchPrevX = m.x;
    touchPrevY = m.y;
    touchPrevSpread = m.spread;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const m = touchMetrics(e.touches);
      touchPrevX = m.x;
      touchPrevY = m.y;
      touchPrevSpread = m.spread;
      return;
    }
    if (performance.now() - lastTouchStamp > 90) {
      vYaw = vPitch = vPanX = vPanY = 0;
    }
    setDragging(false);
    if (autoRotate || hasVelocity()) ensureLoop();
  };

  const keydown = (event: KeyboardEvent) => {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "=",
        "-",
        "Home",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Home") {
      fit("perspective");
      return;
    }
    const step = Math.PI / 12;
    if (event.key === "+" || event.key === "=") {
      distance = THREE.MathUtils.clamp(distance * 0.9, minDistance, maxDistance);
    } else if (event.key === "-") {
      distance = THREE.MathUtils.clamp(distance * 1.1, minDistance, maxDistance);
    } else if (event.key === "ArrowLeft") {
      yaw += step;
    } else if (event.key === "ArrowRight") {
      yaw -= step;
    } else if (event.key === "ArrowUp") {
      pitch += step;
    } else if (event.key === "ArrowDown") {
      pitch -= step;
    }
    renderNow();
  };

  const loss = (event: Event) => {
    event.preventDefault();
    host.dispatchEvent(new CustomEvent("carton-webgl-lost"));
  };

  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", onPointerDown);
  dom.addEventListener("pointermove", onPointerMove);
  dom.addEventListener("pointerup", endPointer);
  dom.addEventListener("pointercancel", endPointer);
  dom.addEventListener("contextmenu", onContextMenu);
  dom.addEventListener("dblclick", onDblClick);
  dom.addEventListener("wheel", onWheel, { passive: false });
  dom.addEventListener("touchstart", onTouchStart, { passive: false });
  dom.addEventListener("touchmove", onTouchMove, { passive: false });
  dom.addEventListener("touchend", onTouchEnd);
  dom.addEventListener("touchcancel", onTouchEnd);
  dom.addEventListener("webglcontextlost", loss);
  dom.addEventListener("keydown", keydown);

  host.dataset.mode = interactionMode;
  host.dataset.dragging = "false";
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  fit("perspective", false);

  return {
    setFold: (value: number) => {
      if (!model.setFold(value)) return;
      renderer.shadowMap.needsUpdate = true;
      const { center, fitDist } = computeBoundsMetrics();
      target.copy(center);
      if (value <= 0.001 || value >= 0.999) {
        distance = fitDist;
      } else {
        distance = THREE.MathUtils.lerp(distance, fitDist, 0.25);
      }
      ensureLoop();
    },
    view: (view?: View | "current") => fit(view ?? "perspective", true),
    resize,
    zoomBy: (factor: number) => {
      if (reducedMotion()) {
        distance = THREE.MathUtils.clamp(
          distance * factor,
          minDistance,
          maxDistance,
        );
        renderNow();
      } else {
        vZoom = THREE.MathUtils.clamp(vZoom + Math.log(factor), -0.8, 0.8);
        ensureLoop();
      }
    },
    setInteractionMode: (mode: InteractionMode) => {
      interactionMode = mode;
      host.dataset.mode = mode;
    },
    setAutoRotate: (enabled: boolean) => {
      autoRotate = enabled;
      if (enabled) ensureLoop();
    },
    setEdgesVisible: (visible: boolean) => {
      if (model.setEdgesVisible(visible)) ensureLoop();
    },
    setLighting: (preset: CartonLighting) => {
      if (preset === currentLighting) return;
      currentLighting = preset;
      if (preset === "warm") {
        hemi.color.setHex(0xfff4e2);
        hemi.groundColor.setHex(0xbba68b);
        hemi.intensity = 0.88;
        key.color.setHex(0xffe1b5);
        key.intensity = 2.05;
        key.position.set(1.1, 1.3, 0.95).multiplyScalar(extent * 2);
        fill.color.setHex(0xf6dec1);
        fill.intensity = 0.55;
        scene.environmentIntensity = 0.32;
      } else if (preset === "daylight") {
        hemi.color.setHex(0xffffff);
        hemi.groundColor.setHex(0xd6e0e6);
        hemi.intensity = 1.15;
        key.color.setHex(0xffffff);
        key.intensity = 1.95;
        key.position.set(0.7, 1.4, 1.15).multiplyScalar(extent * 2);
        fill.color.setHex(0xeef6ff);
        fill.intensity = 0.88;
        scene.environmentIntensity = 0.36;
      } else if (preset === "dramatic") {
        hemi.color.setHex(0xe8eff8);
        hemi.groundColor.setHex(0x6c737c);
        hemi.intensity = 0.45;
        key.color.setHex(0xfff2dc);
        key.intensity = 2.4;
        key.position.set(1.35, 1.25, 0.7).multiplyScalar(extent * 2);
        fill.color.setHex(0x9ec5ff);
        fill.intensity = 0.32;
        scene.environmentIntensity = 0.14;
      } else {
        hemi.color.setHex(0xf5f8ff);
        hemi.groundColor.setHex(0x938674);
        hemi.intensity = 0.75;
        key.color.setHex(0xfff5e7);
        key.intensity = 1.7;
        key.position.set(0.8, 1.2, 1).multiplyScalar(extent * 2);
        fill.color.setHex(0xdfeaff);
        fill.intensity = 0.6;
        scene.environmentIntensity = 0.25;
      }
      renderer.shadowMap.needsUpdate = true;
      ensureLoop();
    },
    setFinish: (finish: CartonFinish) => {
      if (model.setFinish(finish)) ensureLoop();
    },
    snapshotDataUrl: () => {
      renderNow();
      return renderer.domElement.toDataURL("image/png");
    },
    dispose: () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", endPointer);
      dom.removeEventListener("pointercancel", endPointer);
      dom.removeEventListener("contextmenu", onContextMenu);
      dom.removeEventListener("dblclick", onDblClick);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove", onTouchMove);
      dom.removeEventListener("touchend", onTouchEnd);
      dom.removeEventListener("touchcancel", onTouchEnd);
      dom.removeEventListener("webglcontextlost", loss);
      dom.removeEventListener("keydown", keydown);
      model.dispose();
      texture.dispose();
      key.shadow.dispose();
      environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      dom.remove();
    },
  };
}
