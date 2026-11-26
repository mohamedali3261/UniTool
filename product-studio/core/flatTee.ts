import { deformTeeGeometry } from "./teeStyles";
import * as THREE from "three";
import {
  fabricMaterial,
  configureFabricMaterial,
  type Appearance,
} from "./fabric";
/** Original flat-hanging shirt silhouette. The sleeves and body share a continuous surface. */
export function flatTeeShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.31, 1.2);
  s.quadraticCurveTo(0, 0.91, 0.31, 1.2);
  s.lineTo(0.8, 1.08);
  s.quadraticCurveTo(1.14, 0.91, 1.43, 0.52);
  s.lineTo(1.12, 0.25);
  s.quadraticCurveTo(0.93, 0.43, 0.79, 0.62);
  s.lineTo(0.8, -1.18);
  s.quadraticCurveTo(0, -1.25, -0.8, -1.18);
  s.lineTo(-0.79, 0.62);
  s.quadraticCurveTo(-0.93, 0.43, -1.12, 0.25);
  s.lineTo(-1.43, 0.52);
  s.quadraticCurveTo(-1.14, 0.91, -0.8, 1.08);
  s.closePath();
  return s;
}
const outline = flatTeeShape();
const openEdges = new Set([0, 3, 6, 9]); // neckline, right cuff, lower hem, left cuff
const seamSegments: { a: THREE.Vector2; b: THREE.Vector2; curve: number }[] =
  [];
outline.curves.forEach((curve, index) => {
  if (openEdges.has(index)) return;
  const points = curve.getPoints(14);
  for (let i = 0; i < points.length - 1; i++)
    seamSegments.push({ a: points[i], b: points[i + 1], curve: index });
});
const contour = outline.getPoints(14);
function seamDistance(x: number, y: number) {
  let distance = 100;
  const distances = new Map<number, number>();
  for (const { a, b, curve } of seamSegments) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    const d = Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
    distance = Math.min(distance, d);
    distances.set(curve, Math.min(distances.get(curve) ?? 100, d));
  }
  let total = 0,
    weight = 0;
  for (const d of distances.values()) {
    const w = Math.exp(-(d - distance) / 0.055);
    total += d * w;
    weight += w;
  }
  return THREE.MathUtils.lerp(
    distance,
    total / weight,
    THREE.MathUtils.smoothstep(distance, 0.015, 0.065),
  );
}
export function backNeckLift(x: number, y: number) {
  return Math.abs(x) < 0.31
    ? 0.1 * (1 - (x / 0.31) ** 2) * THREE.MathUtils.smoothstep(y, 0.85, 1.055)
    : 0;
}
export function sleeveUV(x: number, y: number) {
  const dx = Math.abs(x) - 0.76,
    dy = y - 0.88;
  return new THREE.Vector2(
    0.5 + (dx * 0.625 + dy * 0.78) / 0.65,
    1 - (dx * 0.78 - dy * 0.625) / 0.85,
  );
}

function distanceToEdge(x: number, y: number) {
  let distance = 100;
  for (let i = 0; i < contour.length - 1; i++) {
    const a = contour[i],
      b = contour[i + 1],
      dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    distance = Math.min(
      distance,
      Math.hypot(x - a.x - dx * t, y - a.y - dy * t),
    );
  }
  return distance;
}
export function teeSurfaceDepth(x: number, y: number, wrinkles: number) {
  const d = distanceToEdge(x, y),
    fade = Math.min(1, d / 0.12);
  // Long, low-frequency hanging folds, plus soft diagonal folds near the underarms.
  const vertical =
      0.016 * Math.sin(x * 16 + y * 1.7) + 0.009 * Math.sin(x * 29 - y * 2.1),
    hem = 0.012 * Math.sin(x * 20) * Math.exp(-(((y + 1.13) / 0.28) ** 2));
  const arms =
    0.015 *
    Math.sin(y * 22 + Math.abs(x) * 9) *
    Math.min(1, (Math.abs(x) / 0.8) ** 4) *
    Math.exp(-(((y - 0.38) / 0.7) ** 2));
  const inflated =
    0.065 +
    0.12 * Math.exp(-((x / 0.83) ** 6)) * (0.8 + 0.2 * Math.cos(y * 1.5)) +
    0.035 *
      Math.exp(
        -(((Math.abs(x) - 1.03) / 0.4) ** 2) - ((y - 0.63) / 0.55) ** 2,
      ) +
    (vertical + hem + arms) * wrinkles * fade;
  // Front and back meet only along sewn seams; opening edges retain their separation.
  const t = Math.min(1, Math.max(0, seamDistance(x, y) - 0.00001) / 0.22);
  return inflated * Math.sqrt(Math.max(0, 2 * t - t * t));
}
export function flatTeeMesh(color: string, a: Appearance) {
  const group = new THREE.Group();
  group.name = "flat-hanging-tee";
  const fabric = fabricMaterial(color, a),
    rib = fabricMaterial(color, a, true);
  fabric.side = THREE.FrontSide;
  const lining = fabric.clone();
  configureFabricMaterial(lining, color, a);
  lining.side = THREE.BackSide;
  const basis = new THREE.ShapeGeometry(flatTeeShape(), 14).toNonIndexed(),
    p = basis.attributes.position;
  type V = [number, number];
  const faces: V[][] = [];
  function split(t: V[], depth = 0) {
    const lengths = t.map((v, i) =>
        Math.hypot(v[0] - t[(i + 1) % 3][0], v[1] - t[(i + 1) % 3][1]),
      ),
      longest = Math.max(...lengths);
    const nearSeam = t.some((v) => seamDistance(v[0], v[1]) < 0.06);
    if (longest < (nearSeam ? 0.038 : 0.085) || depth > 16) {
      faces.push(t);
      return;
    }
    const i = lengths.indexOf(longest),
      j = (i + 1) % 3,
      k = (i + 2) % 3,
      m: V = [(t[i][0] + t[j][0]) / 2, (t[i][1] + t[j][1]) / 2];
    split([t[i], m, t[k]], depth + 1);
    split([m, t[j], t[k]], depth + 1);
  }
  for (let i = 0; i < p.count; i += 3)
    split([
      [p.getX(i), p.getY(i)],
      [p.getX(i + 1), p.getY(i + 1)],
      [p.getX(i + 2), p.getY(i + 2)],
    ]);
  basis.dispose();
  const buckets: Record<
    string,
    { positions: number[]; uv: number[]; normals: number[] }
  > = {
    torso: { positions: [], uv: [], normals: [] },
    leftSleeve: { positions: [], uv: [], normals: [] },
    rightSleeve: { positions: [], uv: [], normals: [] },
    leftSleeve_back: { positions: [], uv: [], normals: [] },
    rightSleeve_back: { positions: [], uv: [], normals: [] },
  };
  for (const t of faces) {
    const cx = t.reduce((s, v) => s + v[0] / 3, 0),
      cy = t.reduce((s, v) => s + v[1] / 3, 0),
      name =
        Math.abs(cx) > 0.79 && cy > 0.21
          ? cx < 0
            ? "leftSleeve"
            : "rightSleeve"
          : "torso",
      bucket = buckets[name];
    for (const side of [1, -1])
      for (const [x, y] of side === 1 ? t : [...t].reverse()) {
        const bucket =
          side === -1 && name !== "torso"
            ? buckets[name + "_back"]
            : buckets[name];
        const z = teeSurfaceDepth(x, y, a.wrinkles),
          eps = 0.001,
          dzdx =
            (teeSurfaceDepth(x + eps, y, a.wrinkles) -
              teeSurfaceDepth(x - eps, y, a.wrinkles)) /
            (eps * 2),
          dzdy =
            (teeSurfaceDepth(x, y + eps, a.wrinkles) -
              teeSurfaceDepth(x, y - eps, a.wrinkles)) /
            (eps * 2);
        const liftX =
          side === -1
            ? (backNeckLift(x + eps, y) - backNeckLift(x - eps, y)) / (2 * eps)
            : 0;
        const liftY =
          side === -1
            ? (backNeckLift(x, y + eps) - backNeckLift(x, y - eps)) / (2 * eps)
            : 0;
        const normal = new THREE.Vector3(
          -dzdx * (1 + liftY) + dzdy * liftX,
          -dzdy,
          side * (1 + liftY),
        ).normalize();
        // At a sewn boundary both panels share one outward normal. Sampling
        // the unsigned depth across that boundary would incorrectly face +/-Z.
        if (seamDistance(x, y) < 0.00002) {
          let best = Infinity;
          for (const segment of seamSegments) {
            const edge = segment.b.clone().sub(segment.a);
            const t = Math.max(
              0,
              Math.min(
                1,
                new THREE.Vector2(x, y).sub(segment.a).dot(edge) /
                  edge.lengthSq(),
              ),
            );
            const d = segment.a
              .clone()
              .addScaledVector(edge, t)
              .distanceTo(new THREE.Vector2(x, y));
            if (d < best) {
              best = d;
              normal.set(-edge.y, edge.x, 0).normalize();
            }
          }
        }
        bucket.positions.push(
          x,
          side === -1 ? y + backNeckLift(x, y) : y,
          z * side,
        );
        bucket.normals.push(normal.x, normal.y, normal.z);
        const uv =
          name === "torso"
            ? new THREE.Vector2((x + 1.5) / 3, (y + 1.25) / 2.5)
            : sleeveUV(x, y);
        bucket.uv.push(uv.x, uv.y);
      }
  }
  for (const [name, b] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(b.positions, 3),
    );
    g.setAttribute("normal", new THREE.Float32BufferAttribute(b.normals, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    const m = new THREE.Mesh(g, fabric);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    const inner = new THREE.Mesh(g.clone(), lining);
    inner.name = name + "-lining";
    inner.receiveShadow = true;
    group.add(inner);
  }
  // No cap polygons: hem, cuffs and neck must remain open when viewed from below.
  function seam(
    points: THREE.Vector3[],
    radius: number,
    material: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        Math.max(40, points.length * 3),
        radius,
        6,
        false,
      ),
      material,
    );
    mesh.name = "stitched-seam";
    group.add(mesh);
  }
  // Collars follow the actual front and back shell boundaries; no panel bridges the neck opening.
  const neck = Array.from({ length: 45 }, (_, i) => {
    const p = outline.curves[0].getPoint(i / 44);
    return new THREE.Vector3(p.x, p.y, teeSurfaceDepth(p.x, p.y, a.wrinkles));
  });
  seam(neck, 0.009, rib);
  seam(
    neck.map((p) => new THREE.Vector3(p.x, p.y + backNeckLift(p.x, p.y), -p.z)),
    0.009,
    rib,
  );
  // Narrow rib-knit neck binding follows both open boundaries, never caps the neck.
  for (const sign of [1, -1]) {
    const band = new THREE.PlaneGeometry(1, 1, 64, 4),
      pos = band.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5,
        v = pos.getY(i) + 0.5,
        p = outline.curves[0].getPoint(u);
      const x = p.x * (1 + v * 0.065),
        y = p.y - v * 0.039;
      pos.setXYZ(
        i,
        x,
        y + (sign < 0 ? backNeckLift(x, y) : 0),
        sign * (teeSurfaceDepth(x, y, a.wrinkles) + 0.0025),
      );
    }
    band.computeVertexNormals();
    const binding = new THREE.Mesh(band, rib);
    binding.material.side = THREE.DoubleSide;
    binding.name = "ribbed-neck-binding";
    binding.castShadow = true;
    group.add(binding);
  }
  // Fine shoulder topstitching is sewn on the cloth surface, not floating tubes.
  for (const index of [1, 11])
    for (const sign of [1, -1]) {
      const curve = outline.curves[index];
      seam(
        Array.from({ length: 25 }, (_, i) => {
          const p = curve.getPoint(i / 24),
            x = p.x * 0.994,
            y = p.y - 0.012;
          return new THREE.Vector3(
            x,
            y,
            sign * (teeSurfaceDepth(x, y, a.wrinkles) + 0.0015),
          );
        }),
        0.0018,
        fabric,
      );
    }
  // Thin turned-over sleeve hems, rather than disks across each cuff.
  for (const curveIndex of [3, 9])
    for (const sign of [1, -1]) {
      const points = Array.from({ length: 25 }, (_, i) => {
        const p = outline.curves[curveIndex].getPoint(i / 24);
        return new THREE.Vector3(
          p.x,
          p.y,
          sign * (teeSurfaceDepth(p.x, p.y, a.wrinkles) + 0.002),
        );
      });
      seam(points, 0.004, fabric);
    }
  for (const y of [-1.175, -1.153])
    for (const sign of [-1, 1])
      seam(
        Array.from({ length: 45 }, (_, i) => {
          const x = -0.78 + (i / 44) * 1.56;
          return new THREE.Vector3(
            x,
            y,
            sign * (teeSurfaceDepth(x, y, a.wrinkles) + 0.004),
          );
        }),
        0.003,
        fabric,
      );
  if (a.teeStyle && a.teeStyle !== "classic")
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) deformTeeGeometry(o.geometry, a.teeStyle!);
    });
  group.userData.teeStyle = a.teeStyle ?? "classic";
  if (a.fit === "oversized") {
    group.scale.x = 1.12;
    group.scale.y = 1.04;
  }
  return group;
}
