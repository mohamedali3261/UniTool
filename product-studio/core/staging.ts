import * as THREE from "three";
/** Original sculpted hanger, no downloaded third-party models. */
export function makeHanger() {
  const group = new THREE.Group();
  group.name = "display-hanger";
  const material = new THREE.MeshStandardMaterial({
    color: "#eeeae1",
    roughness: 0.56,
  });
  const shape = new THREE.Shape();
  shape.moveTo(-0.98, 0.98);
  shape.quadraticCurveTo(-0.65, 1.19, -0.12, 1.52);
  shape.quadraticCurveTo(0, 1.62, 0.12, 1.52);
  shape.quadraticCurveTo(0.65, 1.19, 0.98, 0.98);
  shape.lineTo(0.91, 0.93);
  shape.quadraticCurveTo(0.45, 1.08, 0, 1.29);
  shape.quadraticCurveTo(-0.45, 1.08, -0.91, 0.93);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -0.075);
  const body = new THREE.Mesh(geometry, material);
  body.castShadow = true;
  group.add(body);
  const hookCurve = new THREE.CatmullRomCurve3(
    [
      [0, 1.48, -0.045],
      [0, 1.73, -0.045],
      [0.12, 1.88, -0.045],
      [0.1, 2.0, -0.045],
      [-0.035, 2.04, -0.045],
      [-0.1, 1.96, -0.045],
    ].map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  const hook = new THREE.Mesh(
    new THREE.TubeGeometry(hookCurve, 36, 0.014, 8, false),
    new THREE.MeshStandardMaterial({
      color: "#d0d4d0",
      metalness: 0.8,
      roughness: 0.24,
    }),
  );
  group.add(hook);
  return group;
}
/** Deterministic soft-focus studio foliage. Generated locally, used only as a backdrop. */
export function makeBackdrop(color: string, style = "studio") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 640;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  const glow = ctx.createRadialGradient(220, 190, 0, 256, 290, 470);
  glow.addColorStop(0, "#c9dfbcaa");
  glow.addColorStop(0.5, "#9fb69755");
  glow.addColorStop(1, "#071e1a55");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 640);
  ctx.filter = "blur(18px)";
  ctx.fillStyle = "#06291d66";
  for (let i = 0; i < 22; i++) {
    const x = (Math.sin(i * 37.13) * 0.5 + 0.5) * 600 - 40,
      y = (Math.cos(i * 13.17) * 0.5 + 0.5) * 650;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i * 1.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 + (i % 3) * 10, 55 + (i % 4) * 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (style !== "studio") {
    ctx.filter = "none";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 640);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 640);
    ctx.save();
    ctx.filter = "blur(6px)";
    ctx.fillStyle = "#071e1a55";
    if (style === "blinds") {
      ctx.translate(260, 300);
      ctx.rotate(-0.4);
      for (let y = -600; y < 700; y += 55) ctx.fillRect(-600, y, 1200, 22);
    } else if (style === "window") {
      ctx.fillRect(0, 0, 512, 80);
      ctx.fillRect(0, 560, 512, 80);
      ctx.fillRect(0, 0, 70, 640);
      ctx.fillRect(440, 0, 72, 640);
      ctx.fillRect(246, 0, 20, 640);
      ctx.fillRect(0, 310, 512, 20);
    } else if (style === "beam") {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(450, 0);
      ctx.lineTo(0, 640);
      ctx.fill();
    } else if (style === "arch") {
      ctx.fillRect(0, 0, 512, 640);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "#c9dfbc99";
      ctx.beginPath();
      ctx.roundRect(110, 100, 290, 600, [145, 145, 0, 0]);
      ctx.fill();
    }
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
