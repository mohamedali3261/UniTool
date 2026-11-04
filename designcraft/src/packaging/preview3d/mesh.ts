import * as THREE from "three";
import { cartonAssembly, piecePose, type CartonPiece } from "./assembly";
import type { CartonSize } from "../geometry";
export function pieceGeometry(
  piece: CartonPiece,
  atlas: { width: number; height: number },
  thickness: number,
) {
  let points = piece.polygon.map(([x, y]) => new THREE.Vector2(x, y));
  if (THREE.ShapeUtils.isClockWise(points)) points = points.reverse();
  const triangles = THREE.ShapeUtils.triangulateShape(points, []),
    n = points.length;
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (const z of [0, -thickness])
    for (const p of points) {
      positions.push(p.x, p.y, z);
      uv.push(
        (piece.paperOrigin[0] + p.x) / atlas.width,
        1 - (piece.paperOrigin[1] - p.y) / atlas.height,
      );
    }
  triangles.forEach((t) => indices.push(...t));
  const frontCount = indices.length;
  triangles.forEach(([a, b, c]) => indices.push(c + n, b + n, a + n));
  const backCount = indices.length - frontCount;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      base = positions.length / 3,
      a = points[i],
      b = points[j];
    positions.push(
      a.x,
      a.y,
      0,
      a.x,
      a.y,
      -thickness,
      b.x,
      b.y,
      0,
      b.x,
      b.y,
      -thickness,
    );
    uv.push(0, 0, 0, 1, 1, 0, 1, 1);
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.addGroup(0, frontCount, 0);
  geometry.addGroup(frontCount, backCount, 1);
  geometry.addGroup(
    frontCount + backCount,
    indices.length - frontCount - backCount,
    2,
  );
  geometry.computeVertexNormals();
  return geometry;
}
export function buildCarton(
  size: CartonSize,
  texture: THREE.Texture,
  atlas: { width: number; height: number },
  thickness = 0.35,
) {
  const root = new THREE.Group(),
    pieces = cartonAssembly(size),
    groups = new Map<string, THREE.Group>();
  const materials = [
    new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.68,
      clearcoat: 0,
      clearcoatRoughness: 0.35,
      metalness: 0,
    }),
    new THREE.MeshStandardMaterial({ color: 0xeee9dc, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xbfb49d, roughness: 1 }),
  ];
  // Deterministic micro-grain height map; no download or persisted material image.
  const noise = new Uint8Array(128 * 128 * 4);
  let seed = 137;
  for (let i = 0; i < noise.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 118 + (seed >>> 27);
    noise[i] = noise[i + 1] = noise[i + 2] = value;
    noise[i + 3] = 255;
  }
  const grain = new THREE.DataTexture(noise, 128, 128, THREE.RGBAFormat);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(atlas.width / 8, atlas.height / 8);
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.generateMipmaps = true;
  grain.needsUpdate = true;
  const printed = materials[0] as THREE.MeshPhysicalMaterial;
  printed.bumpMap = grain;
  printed.bumpScale = 0.025;
  const geometries: THREE.BufferGeometry[] = [];
  for (const piece of pieces) {
    const group = new THREE.Group();
    group.name = piece.id;
    groups.set(piece.id, group);
    (piece.parent ? groups.get(piece.parent)! : root).add(group);
    const geometry = pieceGeometry(piece, atlas, thickness);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.name = piece.id + "-paper";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  const setFold = (progress: number) =>
    pieces.forEach((piece) => {
      const pose = piecePose(piece, progress, thickness),
        group = groups.get(piece.id)!;
      group.position.set(...pose.position);
      group.rotation.set(0, 0, 0);
      group.rotation[piece.axis] = pose.rotation;
    });
  setFold(1);
  return {
    root,
    pieces,
    groups,
    setFold,
    setFinish: (finish: "matte" | "satin") => {
      printed.roughness = finish === "satin" ? 0.36 : 0.68;
      printed.clearcoat = finish === "satin" ? 0.32 : 0;
      printed.needsUpdate = true;
    },
    dispose: () => {
      grain.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
