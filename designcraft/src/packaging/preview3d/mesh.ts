import * as THREE from "three";
import { cartonAssembly, piecePose, type CartonPiece } from "./assembly";
import type { CartonSize } from "../geometry";

export type CartonFinish = "matte" | "satin" | "glossy" | "kraft";

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
  const printed = new THREE.MeshPhysicalMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.68,
    clearcoat: 0,
    clearcoatRoughness: 0.35,
    metalness: 0,
  });
  const interior = new THREE.MeshStandardMaterial({
    color: 0xeee9dc,
    roughness: 1,
  });
  const cutEdge = new THREE.MeshStandardMaterial({
    color: 0xbfb49d,
    roughness: 1,
  });
  const materials = [printed, interior, cutEdge];

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
  printed.bumpMap = grain;
  printed.bumpScale = 0.025;

  let edgeMaterial: THREE.LineBasicMaterial | null = null;
  const geometries: THREE.BufferGeometry[] = [];
  const pieceGeos: Array<{ group: THREE.Group; geometry: THREE.BufferGeometry }> = [];
  const edgeLines: THREE.LineSegments[] = [];
  let currentFinish: CartonFinish = "matte";

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
    pieceGeos.push({ group, geometry });
  }

  let currentFold = -1;
  const setFold = (progress: number) => {
    if (progress === currentFold) return false;
    currentFold = progress;
    pieces.forEach((piece) => {
      const pose = piecePose(piece, progress, thickness),
        group = groups.get(piece.id)!;
      group.position.set(...pose.position);
      group.rotation.set(0, 0, 0);
      group.rotation[piece.axis] = pose.rotation;
    });
    return true;
  };
  setFold(1);

  return {
    root,
    pieces,
    groups,
    setFold,
    setFinish: (finish: CartonFinish) => {
      if (finish === currentFinish) return false;
      currentFinish = finish;
      if (finish === "satin") {
        printed.color.setHex(0xffffff);
        printed.roughness = 0.36;
        printed.clearcoat = 0.32;
        printed.clearcoatRoughness = 0.28;
        printed.bumpScale = 0.018;
        interior.color.setHex(0xeee9dc);
        cutEdge.color.setHex(0xbfb49d);
      } else if (finish === "glossy") {
        printed.color.setHex(0xffffff);
        printed.roughness = 0.16;
        printed.clearcoat = 0.88;
        printed.clearcoatRoughness = 0.08;
        printed.bumpScale = 0.008;
        interior.color.setHex(0xf3efe6);
        cutEdge.color.setHex(0xc8beaa);
      } else if (finish === "kraft") {
        printed.color.setHex(0xf3e2c7);
        printed.roughness = 0.86;
        printed.clearcoat = 0;
        printed.clearcoatRoughness = 0.5;
        printed.bumpScale = 0.042;
        interior.color.setHex(0xd4ba92);
        cutEdge.color.setHex(0xb3946a);
      } else {
        printed.color.setHex(0xffffff);
        printed.roughness = 0.68;
        printed.clearcoat = 0;
        printed.clearcoatRoughness = 0.35;
        printed.bumpScale = 0.025;
        interior.color.setHex(0xeee9dc);
        cutEdge.color.setHex(0xbfb49d);
      }
      printed.needsUpdate = true;
      interior.needsUpdate = true;
      cutEdge.needsUpdate = true;
      return true;
    },
    setEdgesVisible: (visible: boolean) => {
      if (!visible && edgeLines.length === 0) return false;
      if (visible && edgeLines.length === 0) {
        edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x24795e,
          transparent: true,
          opacity: 0.72,
          depthTest: true,
        });
        for (const { group, geometry } of pieceGeos) {
          const edgeGeo = new THREE.EdgesGeometry(geometry, 20);
          geometries.push(edgeGeo);
          const lines = new THREE.LineSegments(edgeGeo, edgeMaterial);
          lines.name = group.name + "-edges";
          lines.renderOrder = 2;
          edgeLines.push(lines);
          group.add(lines);
        }
        return true;
      }
      let changed = false;
      edgeLines.forEach((line) => {
        if (line.visible !== visible) {
          line.visible = visible;
          changed = true;
        }
      });
      return changed;
    },
    dispose: () => {
      grain.dispose();
      edgeMaterial?.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
