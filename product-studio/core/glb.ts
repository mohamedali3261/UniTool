import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export function validateGlb(buffer: ArrayBuffer) {
  const v = new DataView(buffer);
  if (
    buffer.byteLength < 20 ||
    buffer.byteLength > 20000000 ||
    v.getUint32(0, true) !== 0x46546c67 ||
    v.getUint32(4, true) !== 2 ||
    v.getUint32(8, true) !== buffer.byteLength
  )
    throw Error("Invalid GLB 2.0 (max 20MB)");
  const len = v.getUint32(12, true);
  if (v.getUint32(16, true) !== 0x4e4f534a || len + 20 > buffer.byteLength)
    throw Error("Invalid GLB JSON");
  const json = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 20, len)).trim(),
  );
  for (const asset of [...(json.buffers ?? []), ...(json.images ?? [])])
    if (asset.uri && !asset.uri.startsWith("data:"))
      throw Error("GLB must embed all resources; external URLs are blocked");
  if (json.extensionsRequired?.length)
    throw Error("Compressed or extension-dependent GLB is not supported");
  const meshes = json.meshes ?? [];
  let vertices = 0;
  for (const m of meshes)
    for (const p of m.primitives ?? [])
      vertices += json.accessors?.[p.attributes?.POSITION]?.count ?? 0;
  if (vertices > 500000) throw Error("GLB exceeds 500,000 vertices");
  return json;
}
export async function parseGarmentGlb(buffer: ArrayBuffer) {
  validateGlb(buffer);
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  const group = gltf.scene;
  const front = group.getObjectByName("front"),
    back = group.getObjectByName("back");
  if (
    !(front instanceof THREE.Mesh) ||
    !(back instanceof THREE.Mesh) ||
    !front.geometry.attributes.uv ||
    !back.geometry.attributes.uv
  )
    throw Error("GLB requires UV meshes named front and back");
  group.traverse((o) => {
    if (o instanceof THREE.Mesh && Array.isArray(o.material))
      throw Error("Use one material per GLB mesh");
  });
  const box = new THREE.Box3().setFromObject(group),
    size = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw Error("Empty GLB");
  group.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(group);
  wrap.scale.setScalar(2.4 / size.y);
  return wrap;
}
export function glbBuffer(data: string) {
  const binary = atob(data.split(",")[1]);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

export function disposeGlb(group: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const material of Array.isArray(o.material)
        ? o.material
        : [o.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
}
