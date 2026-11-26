import { flatTeeMesh } from "./flatTee";
import * as THREE from "three";
import {
  defaultAppearance,
  surfaceDepth,
  torsoWidth,
  fold,
  fabricMaterial,
  surfaceGeometry,
  type Appearance,
} from "./fabric";
import type { Product } from "./model";
export function bulge(x: number, y: number) {
  return (
    0.13 *
    Math.max(0, 1 - (x / 0.87) ** 2) *
    Math.max(0, 1 - ((y + 0.05) / 1.5) ** 4)
  );
}
/** Original procedural garment silhouettes, in world units, front facing +Z. */
export function garmentShape(product: Product): THREE.Shape {
  const s = new THREE.Shape();
  if (product === "tote") {
    s.moveTo(-0.79, 1.05);
    s.lineTo(0.79, 1.05);
    s.lineTo(0.71, -1.15);
    s.quadraticCurveTo(0, -1.3, -0.71, -1.15);
    s.closePath();
    return s;
  }
  const long = product !== "tee";
  s.moveTo(-0.34, 1.25);
  s.quadraticCurveTo(0, 0.86, 0.34, 1.25);
  s.lineTo(0.82, 1.1);
  s.lineTo(long ? 1.18 : 1.38, long ? -0.75 : 0.42);
  s.lineTo(long ? 0.87 : 1.02, long ? -0.87 : 0.22);
  s.lineTo(0.73, 0.67);
  s.lineTo(0.78, -1.18);
  s.quadraticCurveTo(0, -1.27, -0.78, -1.18);
  s.lineTo(-0.73, 0.67);
  s.lineTo(long ? -0.87 : -1.02, long ? -0.87 : 0.22);
  s.lineTo(long ? -1.18 : -1.38, long ? -0.75 : 0.42);
  s.lineTo(-0.82, 1.1);
  s.closePath();
  return s;
}
export function garmentMesh(
  product: Product,
  color: string,
  appearance: Appearance = defaultAppearance,
): THREE.Group {
  if (String(product) === "tee") return flatTeeMesh(color, appearance);
  const group = new THREE.Group();
  group.name = "volumetric-garment";
  const fabric = fabricMaterial(color, appearance),
    rib = fabricMaterial(color, appearance, true);
  const thread = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.85),
    roughness: 1,
  });
  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material = fabric,
    name = "fabric",
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }
  function seam(
    points: THREE.Vector3[],
    radius = 0.005,
    material: THREE.Material = thread,
  ) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        Math.max(32, points.length * 3),
        radius,
        6,
        false,
      ),
      material,
      "stitching",
    );
  }
  if (product === "tote") {
    const g = new THREE.ExtrudeGeometry(garmentShape(product), {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.055,
    });
    g.translate(0, 0, -0.125);
    mesh(g);
    for (const z of [-0.19, 0.19])
      seam(
        [
          new THREE.Vector3(-0.4, 1, z),
          new THREE.Vector3(-0.4, 1.65, z),
          new THREE.Vector3(0, 1.85, z),
          new THREE.Vector3(0.4, 1.65, z),
          new THREE.Vector3(0.4, 1, z),
        ],
        0.04,
        fabric,
      );
    return group;
  }
  // A closed-around torso rather than a flat extruded silhouette. Open neck and hem.
  mesh(
    surfaceGeometry(100, 112, (u, v) => {
      const t = u * Math.PI * 2,
        y = -1.17 + v * 2.43,
        x = torsoWidth(y) * Math.cos(t),
        f = Math.sin(t);
      const yy =
        y - (v > 0.86 ? 0.16 * ((v - 0.86) / 0.14) * Math.max(0, f) ** 2 : 0);
      return new THREE.Vector3(
        x,
        yy,
        (0.34 + 0.035 * Math.cos((y + 0.1) * 2)) * f +
          Math.sign(f) * fold(x, yy, appearance.wrinkles),
      );
    }),
    fabric,
    "torso",
  );
  const isTee = product === "tee";
  // Ribbed waistband with actual shallow vertical channels.
  mesh(
    surfaceGeometry(10, 144, (u, v) => {
      const t = u * Math.PI * 2,
        r = 1 + (isTee ? 0 : 0.008) * Math.sin(t * 120);
      return new THREE.Vector3(
        0.76 * r * Math.cos(t),
        isTee ? -1.225 + v * 0.065 : -1.3 + v * 0.19,
        0.325 * r * Math.sin(t),
      );
    }),
    isTee ? fabric : rib,
    "waistband",
  );
  for (const y of isTee ? [-1.214, -1.187] : [-1.28, -1.13])
    seam(
      Array.from({ length: 81 }, (_, i) => {
        const t = (i / 80) * Math.PI * 2;
        return new THREE.Vector3(0.762 * Math.cos(t), y, 0.327 * Math.sin(t));
      }),
      0.004,
    );
  for (const sign of [-1, 1]) {
    const short = product === "tee";
    const pockets = appearance.pose === "pockets";
    const path = new THREE.CatmullRomCurve3(
      (short
        ? [
            [0.46, 0.79, -0.09],
            [1, 0.62, 0],
            [1.24, 0.25, 0.02],
          ]
        : pockets
          ? [
              [0.46, 0.79, -0.09],
              [0.99, 0.54, -0.02],
              [1.13, 0.02, 0],
              [1.05, -0.48, 0.15],
              [0.83, -0.83, 0.4],
            ]
          : [
              [0.46, 0.79, -0.09],
              [1, 0.5, 0],
              [1.13, -0.05, 0.02],
              [1.18, -0.58, 0.04],
              [1.15, -1.05, 0.09],
            ]
      ).map(([x, y, z]) => new THREE.Vector3(x * sign, y, z)),
    );
    const frames = path.computeFrenetFrames(96, false);
    mesh(
      surfaceGeometry(96, 56, (u, v) => {
        const i = Math.min(96, Math.round(v * 96)),
          center = path.getPointAt(v),
          angle = u * Math.PI * 2;
        const base =
          (short ? 0.29 - 0.03 * v : 0.315 - 0.12 * v) *
          (0.78 + 0.22 * Math.min(1, v / 0.18));
        const folds =
          appearance.wrinkles *
          (0.012 *
            Math.sin(v * 29 + Math.cos(angle) * 3) *
            Math.sin(v * Math.PI) +
            0.007 * Math.sin(v * 45 + angle * 2));
        return center
          .addScaledVector(frames.normals[i], Math.cos(angle) * (base + folds))
          .addScaledVector(
            frames.binormals[i],
            Math.sin(angle) * (base + folds) * 0.94,
          );
      }),
      fabric,
      sign < 0 ? "leftSleeve" : "rightSleeve",
    );
    const end = path.getPointAt(1),
      tangent = path.getTangentAt(1),
      normal = frames.normals[96],
      binormal = frames.binormals[96];
    const radius = short ? 0.26 : 0.194;
    mesh(
      surfaceGeometry(12, 96, (u, v) => {
        const a = u * Math.PI * 2,
          r = radius * (1 + 0.014 * Math.cos(a * 72));
        return end
          .clone()
          .addScaledVector(tangent, (v - 0.15) * (short ? 0.07 : 0.16))
          .addScaledVector(normal, Math.cos(a) * r)
          .addScaledVector(binormal, Math.sin(a) * r * 0.94);
      }),
      short ? fabric : rib,
      "cuff",
    );
    // Thin inner lip makes cuffs visibly hollow instead of sealed disks.
    seam(
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return end
          .clone()
          .addScaledVector(tangent, short ? 0.058 : 0.136)
          .addScaledVector(normal, Math.cos(a) * radius)
          .addScaledVector(binormal, Math.sin(a) * radius * 0.94);
      }),
      short ? 0.006 : 0.012,
      short ? fabric : rib,
    );
  }
  // Neck opening and seam.
  seam(
    Array.from({ length: 81 }, (_, i) => {
      const t = (i / 80) * Math.PI * 2;
      return new THREE.Vector3(
        0.315 * Math.cos(t),
        1.24 - 0.17 * Math.max(0, Math.sin(t)) ** 2,
        0.34 * Math.sin(t),
      );
    }),
    isTee ? 0.016 : 0.025,
    rib,
  );
  if (product === "hoodie") {
    const hoodPoint = (u: number, v: number) => {
      const theta = v * 2.12,
        phi = (u - 0.5) * 4.18;
      return new THREE.Vector3(
        0.48 * Math.sin(theta) * Math.sin(phi),
        1.26 + 0.43 * Math.cos(theta),
        -0.12 -
          0.42 * Math.sin(theta) * Math.cos(phi) +
          0.015 * appearance.wrinkles * Math.sin(phi * 8 + theta * 14),
      );
    };
    for (const [name, start] of [
      ["hoodLeft", 0],
      ["hoodRight", 0.5],
    ] as const)
      mesh(
        surfaceGeometry(48, 36, (u, v) => hoodPoint(start + u * 0.5, v)),
        fabric,
        name,
      );
    for (const u of [0, 1])
      seam(
        Array.from({ length: 45 }, (_, i) => hoodPoint(u, i / 44)),
        0.022,
        rib,
      );
    seam(
      Array.from({ length: 45 }, (_, i) => hoodPoint(0.5, i / 44)),
      0.004,
    );
    for (const x of [-0.18, 0.18]) {
      seam(
        [
          new THREE.Vector3(x, 1.1, 0.35),
          new THREE.Vector3(x * 0.8, 0.91, 0.4),
          new THREE.Vector3(x * 1.08, 0.59, 0.4),
        ],
        0.012,
        rib,
      );
      const tip = mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.07, 10),
        thread,
        "drawstring-tip",
      );
      tip.position.set(x * 1.08, 0.57, 0.4);
    }
    mesh(
      surfaceGeometry(24, 56, (u, v) => {
        const y = -0.48 - v * 0.54,
          w = 0.35 + 0.21 * Math.min(1, v * 2),
          x = (u - 0.5) * w * 2;
        return new THREE.Vector3(
          x,
          y,
          surfaceDepth(x, y, appearance.wrinkles) +
            0.023 +
            0.018 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI),
        );
      }),
      fabric,
      "kangaroo-pocket",
    );
    for (const sign of [-1, 1])
      seam(
        [
          [-0.48, 0.35],
          [-0.65, 0.48],
          [-0.99, 0.56],
        ].map(
          ([y, x]) =>
            new THREE.Vector3(
              x * sign,
              y,
              surfaceDepth(x * sign, y, appearance.wrinkles) + 0.028,
            ),
        ),
        0.008,
      );
    seam(
      Array.from({ length: 45 }, (_, i) => {
        const x = -0.54 + (i / 44) * 1.08;
        return new THREE.Vector3(
          x,
          -1.01,
          surfaceDepth(x, -1.01, appearance.wrinkles) + 0.029,
        );
      }),
      0.005,
    );
  }
  if (appearance.fit === "oversized") {
    group.scale.x = 1.12;
    group.scale.y = 1.04;
  }
  return group;
}
