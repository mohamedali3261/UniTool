import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, RefreshCw, FlipHorizontal2, Sparkles } from 'lucide-react';

export type CardFinish = 'satin' | 'glossy' | 'matte';

interface DesignCard3DStageProps {
  previewUrl: string;
  width: number;
  height: number;
  title: string;
  isAr: boolean;
}

function createRoundedCardShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const cr = Math.min(r, hw * 0.45, hh * 0.45);

  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.lineTo(hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.lineTo(-hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return shape;
}

function createCardBackTexture(wPx: number, hPx: number, title: string): THREE.CanvasTexture {
  const cw = Math.max(256, Math.min(1024, Math.round(wPx)));
  const ch = Math.max(256, Math.min(1024, Math.round(hPx)));
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d')!;

  // Fine warm cardstock paper base
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, '#f7f6f2');
  grad.addColorStop(0.5, '#efede6');
  grad.addColorStop(1, '#e5e2d9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // Subtle paper weave / dot grid
  ctx.fillStyle = 'rgba(36, 121, 94, 0.065)';
  const step = Math.max(14, Math.round(Math.min(cw, ch) / 28));
  for (let y = step; y < ch; y += step) {
    for (let x = step; x < cw; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle inner frame border
  const pad = Math.round(Math.min(cw, ch) * 0.065);
  ctx.strokeStyle = 'rgba(36, 121, 94, 0.22)';
  ctx.lineWidth = Math.max(1.5, Math.min(cw, ch) * 0.004);
  ctx.strokeRect(pad, pad, cw - pad * 2, ch - pad * 2);

  // Center subtle emblem
  const cx = cw / 2;
  const cy = ch / 2;
  const r = Math.max(18, Math.min(cw, ch) * 0.075);
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.35, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(36, 121, 94, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(36, 121, 94, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#24795e';
  ctx.font = `700 ${Math.max(11, Math.round(r * 0.52))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3D', cx, cy - r * 0.35);

  const safeTitle = (title || 'UniTool Design').slice(0, 32);
  ctx.fillStyle = 'rgba(36, 61, 49, 0.58)';
  ctx.font = `600 ${Math.max(10, Math.round(Math.min(cw, ch) * 0.028))}px system-ui, sans-serif`;
  ctx.fillText(safeTitle, cx, cy + r * 1.05);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 64, 6, 128, 64, 120);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.12)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.scale(1, 0.5);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return new THREE.CanvasTexture(c);
}

export const DesignCard3DStage: React.FC<DesignCard3DStageProps> = ({
  previewUrl,
  width,
  height,
  title,
  isAr,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [finish, setFinish] = useState<CardFinish>('satin');
  const [showingBack, setShowingBack] = useState(false);
  const [webglMode, setWebglMode] = useState<'webgl' | 'css3d'>('webgl');
  const [cssPose, setCssPose] = useState({ yawDeg: -14, pitchDeg: 8, scale: 1 });

  const controlsRef = useRef<{
    setAutoSpin: (v: boolean) => void;
    flipSide: () => void;
    resetView: () => void;
    setFinish: (f: CardFinish) => void;
    setDoubleSided: (v: boolean) => void;
  } | null>(null);

  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const maxEdge = Math.max(safeW, safeH);
  const normW = Math.max(0.32, (safeW / maxEdge) * 2.15);
  const normH = Math.max(0.32, (safeH / maxEdge) * 2.15);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !previewUrl) return;

    // Probe WebGL support first; fall back cleanly to interactive CSS 3D if unavailable
    const probe = document.createElement('canvas');
    const probeGl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!probeGl) {
      setWebglMode('css3d');
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver === true;
      renderer = new THREE.WebGLRenderer({
        antialias: !isAutomated,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      setWebglMode('css3d');
      return;
    }

    setWebglMode('webgl');
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const unmasked = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const isSoftwareGl =
      /swiftshader|subzero|llvmpipe|software|mesa offscreen|basic render/i.test(unmasked) ||
      (typeof navigator !== 'undefined' && navigator.webdriver === true);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(2, window.devicePixelRatio || 1));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('data-testid', 'design-card-3d-canvas');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50);

    // Studio 3-point lighting for realistic surface sheen across 360°
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa5a0, 1.05);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.75);
    keyLight.position.set(2.6, 3.2, 3.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe4f1ff, 0.72);
    fillLight.position.set(-3.0, 1.4, 2.5);
    scene.add(fillLight);

    const backKeyLight = new THREE.DirectionalLight(0xfff6e8, 1.45);
    backKeyLight.position.set(-2.2, 2.6, -3.6);
    scene.add(backKeyLight);

    // Cardstock dimensions & rounded beveled body
    const cornerR = Math.min(normW, normH) * 0.036;
    const thickness = 0.026;
    const bevel = 0.0035;
    const cardShape = createRoundedCardShape(normW, normH, cornerR);
    const bodyGeom = new THREE.ExtrudeGeometry(cardShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: isSoftwareGl ? 1 : 3,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: isSoftwareGl ? 6 : 14,
    });
    bodyGeom.center();

    // Front & Back crisp planar faces with rounded alpha mask via ShapeGeometry
    const faceShape = createRoundedCardShape(normW, normH, cornerR);
    const frontGeom = new THREE.ShapeGeometry(faceShape, isSoftwareGl ? 6 : 14);
    // Normalize ShapeGeometry UVs from [-normW/2..normW/2, -normH/2..normH/2] to [0..1, 0..1]
    const posAttr = frontGeom.attributes.position;
    const uvArray = new Float32Array(posAttr.count * 2);
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      uvArray[i * 2] = (x + normW / 2) / normW;
      uvArray[i * 2 + 1] = (y + normH / 2) / normH;
    }
    frontGeom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    const backGeom = frontGeom.clone();

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xebe8e0,
      roughness: 0.72,
      metalness: 0.02,
    });

    const frontMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.34,
      metalness: 0.03,
      clearcoat: 0.38,
      clearcoatRoughness: 0.26,
    });

    const paperBackTex = createCardBackTexture(safeW, safeH, title);
    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: paperBackTex,
      roughness: 0.58,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
    });

    let frontTex: THREE.Texture | null = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      frontTex = new THREE.Texture(img);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      if (isSoftwareGl) {
        frontTex.generateMipmaps = false;
        frontTex.minFilter = THREE.LinearFilter;
      } else {
        frontTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      }
      frontTex.needsUpdate = true;
      frontMat.map = frontTex;
      frontMat.needsUpdate = true;
      if (useDoubleSided) {
        backMat.map = frontTex;
        backMat.needsUpdate = true;
      }
      renderNow();
    };
    img.src = previewUrl;

    const cardGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(bodyGeom, edgeMat);
    const frontZ = thickness / 2 + bevel + 0.0008;
    const frontMesh = new THREE.Mesh(frontGeom, frontMat);
    frontMesh.position.z = frontZ;

    const backMesh = new THREE.Mesh(backGeom, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -frontZ;

    cardGroup.add(bodyMesh, frontMesh, backMesh);
    scene.add(cardGroup);

    // Floating soft contact shadow below the card
    const shadowTex = createContactShadowTexture();
    const shadowGeom = new THREE.PlaneGeometry(normW * 1.25, Math.max(0.45, normW * 0.42));
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -normH / 2 - 0.22;
    scene.add(shadowMesh);

    // Camera & 360° spherical orbit state
    let yaw = -0.24;
    let pitch = 0.12;
    let targetYaw: number | null = null;
    let targetPitch: number | null = null;
    let vYaw = 0;
    let vPitch = 0;
    let zoomFactor = 1;
    let baseDist = 3.8;
    let spinActive = false;
    let useDoubleSided = false;
    let isDragging = false;
    let disposed = false;
    let rafId: number | null = null;
    let lastTime = 0;

    const applyFinishPreset = (f: CardFinish) => {
      if (f === 'glossy') {
        frontMat.roughness = 0.14;
        frontMat.clearcoat = 0.88;
        frontMat.clearcoatRoughness = 0.1;
      } else if (f === 'matte') {
        frontMat.roughness = 0.72;
        frontMat.clearcoat = 0.04;
        frontMat.clearcoatRoughness = 0.6;
      } else {
        frontMat.roughness = 0.34;
        frontMat.clearcoat = 0.38;
        frontMat.clearcoatRoughness = 0.26;
      }
      frontMat.needsUpdate = true;
      renderNow();
    };

    const computeFitDistance = (aspect: number) => {
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.4, aspect));
      const radiusW = (normW * 0.58) / Math.tan(hFov / 2);
      const radiusH = ((normH + 0.36) * 0.58) / Math.tan(vFov / 2);
      return Math.max(2.3, radiusW, radiusH);
    };

    const syncSceneTransform = () => {
      // Unclamped 360° card rotation: rotate cardGroup directly for intuitive tactile inspection!
      cardGroup.rotation.order = 'YXZ';
      cardGroup.rotation.y = yaw;
      cardGroup.rotation.x = pitch;

      // Subtle shadow scale response as card spins edge-on
      const edgeFactor = 0.65 + 0.35 * Math.abs(Math.cos(yaw));
      shadowMesh.scale.x = edgeFactor;
      shadowMat.opacity = 0.45 + 0.28 * Math.abs(Math.cos(pitch));

      camera.position.set(0, 0, baseDist * zoomFactor);
      camera.lookAt(0, 0, 0);

      const normAngle = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const backVisible = normAngle > Math.PI * 0.5 && normAngle < Math.PI * 1.5;
      host.dataset.yawDeg = String(Math.round(THREE.MathUtils.radToDeg(yaw)));
      host.dataset.pitchDeg = String(Math.round(THREE.MathUtils.radToDeg(pitch)));
      setShowingBack(backVisible);
    };

    const renderNow = () => {
      if (disposed) return;
      syncSceneTransform();
      renderer.render(scene, camera);
    };

    const hasMotion = () =>
      spinActive ||
      targetYaw !== null ||
      targetPitch !== null ||
      Math.abs(vYaw) > 1e-4 ||
      Math.abs(vPitch) > 1e-4;

    const tick = (now: number) => {
      rafId = null;
      if (disposed) return;
      const dt = lastTime ? Math.min(50, Math.max(4, now - lastTime)) : 16.67;
      lastTime = now;
      const frames = dt / 16.667;

      if (!isDragging) {
        if (targetYaw !== null && targetPitch !== null) {
          if (isSoftwareGl) {
            yaw = targetYaw;
            pitch = targetPitch;
            targetYaw = null;
            targetPitch = null;
          } else {
            yaw += (targetYaw - yaw) * Math.min(1, 0.22 * frames);
            pitch += (targetPitch - pitch) * Math.min(1, 0.22 * frames);
            if (Math.abs(targetYaw - yaw) < 0.004 && Math.abs(targetPitch - pitch) < 0.004) {
              yaw = targetYaw;
              pitch = targetPitch;
              targetYaw = null;
              targetPitch = null;
            }
          }
        } else if (spinActive) {
          yaw += (dt / 1000) * 0.85;
        } else if (!isSoftwareGl) {
          yaw += vYaw * frames;
          pitch += vPitch * frames;
          const decay = Math.pow(0.88, frames);
          vYaw *= decay;
          vPitch *= decay;
          if (Math.abs(vYaw) < 1e-4) vYaw = 0;
          if (Math.abs(vPitch) < 1e-4) vPitch = 0;
        } else {
          vYaw = 0;
          vPitch = 0;
        }
      }

      renderNow();
      if (hasMotion()) {
        rafId = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
      }
    };

    const ensureLoop = () => {
      if (rafId === null && !disposed) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      if (disposed) return;
      const w = Math.max(120, host.clientWidth || 320);
      const h = Math.max(120, host.clientHeight || 280);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseDist = computeFitDistance(w / h);
      renderer.setSize(w, h, false);
      renderNow();
    };

    // Pointer & Multi-touch 360° rotation + pinch/wheel zoom
    let activePtr: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let pinchDist: number | null = null;
    let pinchStartZoom = 1;

    const applyDelta = (dx: number, dy: number) => {
      targetYaw = null;
      targetPitch = null;
      const h = Math.max(180, host.clientHeight || 320);
      const speed = (Math.PI * 1.9) / h;
      const dY = dx * speed;
      const dP = dy * speed;
      yaw += dY;
      pitch += dP;
      vYaw = vYaw * 0.45 + dY * 0.55;
      vPitch = vPitch * 0.45 + dP * 0.55;
      if (isSoftwareGl) {
        vYaw = 0;
        vPitch = 0;
        renderNow();
      } else {
        renderNow();
      }
    };

    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      e.preventDefault();
      activePtr = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      vYaw = 0;
      vPitch = 0;
      targetYaw = null;
      targetPitch = null;
      isDragging = true;
      host.dataset.dragging = 'true';
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic event */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerId !== activePtr) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (dx === 0 && dy === 0) return;
      applyDelta(dx, dy);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerId !== activePtr) return;
      activePtr = null;
      isDragging = false;
      host.dataset.dragging = 'false';
      try {
        if (dom.hasPointerCapture(e.pointerId)) dom.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (hasMotion()) ensureLoop();
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      targetYaw = null;
      targetPitch = null;
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        pinchDist = Math.hypot(dx, dy);
        pinchStartZoom = zoomFactor;
        isDragging = false;
      } else if (e.touches.length === 1) {
        pinchDist = null;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        vYaw = 0;
        vPitch = 0;
        isDragging = true;
        host.dataset.dragging = 'true';
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchDist) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const nextDist = Math.max(10, Math.hypot(dx, dy));
        zoomFactor = THREE.MathUtils.clamp(pinchStartZoom * (pinchDist / nextDist), 0.48, 2.2);
        renderNow();
      } else if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        if (dx !== 0 || dy !== 0) applyDelta(dx, dy);
      }
    };

    const onTouchEnd = () => {
      pinchDist = null;
      isDragging = false;
      host.dataset.dragging = 'false';
      if (hasMotion()) ensureLoop();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.max(-120, Math.min(120, e.deltaY));
      zoomFactor = THREE.MathUtils.clamp(zoomFactor * Math.exp(delta * 0.0014), 0.48, 2.2);
      renderNow();
    };

    const onDblClick = () => {
      vYaw = 0;
      vPitch = 0;
      zoomFactor = 1;
      targetYaw = -0.24;
      targetPitch = 0.12;
      ensureLoop();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', onTouchEnd);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('dblclick', onDblClick);

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    controlsRef.current = {
      setAutoSpin: (v: boolean) => {
        spinActive = v;
        if (v) {
          targetYaw = null;
          targetPitch = null;
          ensureLoop();
        }
      },
      flipSide: () => {
        spinActive = false;
        setAutoSpin(false);
        const normAngle = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const currentlyBack = normAngle > Math.PI * 0.5 && normAngle < Math.PI * 1.5;
        targetYaw = currentlyBack ? 0 : Math.PI;
        targetPitch = 0;
        ensureLoop();
      },
      resetView: () => {
        spinActive = false;
        setAutoSpin(false);
        vYaw = 0;
        vPitch = 0;
        zoomFactor = 1;
        targetYaw = -0.24;
        targetPitch = 0.12;
        ensureLoop();
      },
      setFinish: (f: CardFinish) => applyFinishPreset(f),
      setDoubleSided: (v: boolean) => {
        useDoubleSided = v;
        backMat.map = v && frontTex ? frontTex : paperBackTex;
        backMat.roughness = v ? frontMat.roughness : 0.58;
        backMat.needsUpdate = true;
        renderNow();
      },
    };

    return () => {
      disposed = true;
      controlsRef.current = null;
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('dblclick', onDblClick);
      bodyGeom.dispose();
      frontGeom.dispose();
      backGeom.dispose();
      shadowGeom.dispose();
      edgeMat.dispose();
      frontMat.dispose();
      backMat.dispose();
      shadowMat.dispose();
      paperBackTex.dispose();
      shadowTex.dispose();
      frontTex?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      dom.remove();
    };
  }, [previewUrl, normW, normH, safeW, safeH, title]);

  // CSS 3D fallback drag handlers (used only when WebGL is unavailable)
  const cssDragRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const handleCssPointerDown = useCallback((e: React.PointerEvent) => {
    if (webglMode !== 'css3d') return;
    cssDragRef.current = { x: e.clientX, y: e.clientY, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [webglMode]);

  const handleCssPointerMove = useCallback((e: React.PointerEvent) => {
    if (webglMode !== 'css3d' || !cssDragRef.current.active) return;
    const dx = e.clientX - cssDragRef.current.x;
    const dy = e.clientY - cssDragRef.current.y;
    cssDragRef.current.x = e.clientX;
    cssDragRef.current.y = e.clientY;
    setCssPose((prev) => ({
      ...prev,
      yawDeg: prev.yawDeg + dx * 0.65,
      pitchDeg: prev.pitchDeg - dy * 0.65,
    }));
  }, [webglMode]);

  const handleCssPointerUp = useCallback(() => {
    cssDragRef.current.active = false;
  }, []);

  const toggleSpin = () => {
    const next = !autoSpin;
    setAutoSpin(next);
    controlsRef.current?.setAutoSpin(next);
  };

  const handleFlip = () => {
    if (webglMode === 'css3d') {
      setCssPose((prev) => ({
        ...prev,
        yawDeg: Math.abs(prev.yawDeg % 360) > 90 && Math.abs(prev.yawDeg % 360) < 270 ? 0 : 180,
        pitchDeg: 0,
      }));
      setShowingBack((b) => !b);
      return;
    }
    controlsRef.current?.flipSide();
  };

  const handleReset = () => {
    if (webglMode === 'css3d') {
      setCssPose({ yawDeg: -14, pitchDeg: 8, scale: 1 });
      setShowingBack(false);
      return;
    }
    controlsRef.current?.resetView();
  };

  const cycleFinish = () => {
    const order: CardFinish[] = ['satin', 'glossy', 'matte'];
    const next = order[(order.indexOf(finish) + 1) % order.length];
    setFinish(next);
    controlsRef.current?.setFinish(next);
  };

  const toggleDoubleSided = () => {
    const next = !doubleSided;
    setDoubleSided(next);
    controlsRef.current?.setDoubleSided(next);
  };

  const finishLabel =
    finish === 'glossy'
      ? isAr ? 'لامع' : 'Glossy'
      : finish === 'matte'
        ? isAr ? 'مطفي' : 'Matte'
        : isAr ? 'ساتان' : 'Satin';

  return (
    <div className="dc-card3d-stage-wrap relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* Interactive 360° 3D Viewport */}
      <div
        ref={hostRef}
        data-testid="design-card-3d-stage"
        data-mode={webglMode}
        data-yaw-deg={webglMode === 'css3d' ? String(Math.round(cssPose.yawDeg)) : undefined}
        onPointerDown={handleCssPointerDown}
        onPointerMove={handleCssPointerMove}
        onPointerUp={handleCssPointerUp}
        onPointerCancel={handleCssPointerUp}
        className="flex-1 min-h-0 w-full relative flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {webglMode === 'css3d' && (
          <div
            className="w-full h-full flex items-center justify-center p-6"
            style={{ perspective: '1100px' }}
          >
            <div
              data-testid="design-card-css3d"
              className="relative transition-transform duration-75"
              style={{
                width: `${Math.round((normW / 2.15) * 260)}px`,
                height: `${Math.round((normH / 2.15) * 260)}px`,
                transformStyle: 'preserve-3d',
                transform: `scale(${cssPose.scale}) rotateX(${cssPose.pitchDeg}deg) rotateY(${cssPose.yawDeg}deg)`,
              }}
            >
              <img
                src={previewUrl}
                alt={title}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-2xl border border-white/25"
                style={{ backfaceVisibility: 'hidden' }}
              />
              <div
                className="absolute inset-0 w-full h-full rounded-xl shadow-2xl border border-stone-300 bg-[#efede6] flex items-center justify-center overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {doubleSided ? (
                  <img src={previewUrl} alt={title} draggable={false} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#24795e] opacity-70">{title || '3D Card'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subtle 360° Hint Pill */}
        <div className="pointer-events-none absolute top-2.5 inset-x-3 flex items-center justify-between text-[10px] font-semibold">
          <span className="dc-card3d-badge px-2 py-0.5 rounded-full backdrop-blur-md">
            {isAr ? 'اسحب للتحريك 360°' : 'Drag to rotate 360°'}
          </span>
          <span className="dc-card3d-badge px-2 py-0.5 rounded-full backdrop-blur-md">
            {showingBack ? (isAr ? 'الظهر' : 'Back') : (isAr ? 'الوجه الأمامي' : 'Front')}
          </span>
        </div>
      </div>

      {/* Compact Floating 3D Card Controls Bar */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="dc-card3d-controls shrink-0 px-2.5 py-2 flex items-center justify-center flex-wrap gap-1.5 border-t"
      >
        <button
          type="button"
          onClick={toggleSpin}
          aria-pressed={autoSpin}
          className={`dc-card3d-btn ${autoSpin ? 'is-active' : ''}`}
          title={isAr ? 'دوران تلقائي 360°' : 'Auto-rotate 360°'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoSpin ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'دوران 360°' : '360° Spin'}</span>
        </button>

        <button
          type="button"
          onClick={handleFlip}
          className="dc-card3d-btn"
          title={isAr ? 'قلب الكارت (الوجه / الظهر)' : 'Flip card (Front / Back)'}
        >
          <FlipHorizontal2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'قلب الوجه' : 'Flip'}</span>
        </button>

        <button
          type="button"
          onClick={toggleDoubleSided}
          aria-pressed={doubleSided}
          className={`dc-card3d-btn ${doubleSided ? 'is-active' : ''}`}
          title={isAr ? 'طباعة التصميم على الوجهين' : 'Print design on both sides'}
        >
          <span>{isAr ? 'وجهين' : '2-Sided'}</span>
        </button>

        <button
          type="button"
          onClick={cycleFinish}
          className="dc-card3d-btn"
          title={isAr ? 'تغيير ملمس الكارت والإضاءة' : 'Cycle card finish'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{finishLabel}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="dc-card3d-btn"
          title={isAr ? 'إعادة ضبط الزاوية' : 'Reset angle'}
          aria-label={isAr ? 'إعادة ضبط الزاوية' : 'Reset angle'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
