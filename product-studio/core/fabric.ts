import type { TeeStyle } from "./teeStyles";
import { gradientPositions, type FabricType, type Gradient } from "./materials";
import * as THREE from "three";
export interface Appearance {
  teeStyle?: TeeStyle;
  previewQuality?: "auto" | "full" | "half" | "quarter";
  material?: FabricType;
  knitSize?: number;
  brightness?: number;
  gradient?: Gradient;
  wrinkles: number;
  texture: number;
  roughness: number;
  lightPower: number;
  lightAngle: number;
  pose: "relaxed" | "pockets";
  fit: "regular" | "oversized";
  hanger: boolean;
  backdrop: "studio" | "solid" | "window" | "blinds" | "beam" | "arch";
}
export const defaultAppearance: Appearance = {
  previewQuality: "auto",
  material: "cotton",
  knitSize: 1,
  brightness: 1,
  wrinkles: 0.65,
  texture: 0.55,
  roughness: 0.92,
  lightPower: 2.7,
  lightAngle: -40,
  pose: "pockets",
  fit: "regular",
  hanger: false,
  backdrop: "studio",
};
/** Shared by the torso and the print mesh, so artwork follows the same folds. */
export function torsoWidth(y: number) {
  if (y > 0.95)
    return THREE.MathUtils.lerp(0.84, 0.31, Math.min(1, (y - 0.95) / 0.31));
  return (
    0.76 +
    0.07 * Math.exp(-(((y - 0.55) / 0.6) ** 2)) -
    0.025 * Math.exp(-(((y + 0.8) / 0.3) ** 2))
  );
}
export function fold(x: number, y: number, amount: number) {
  x = Math.abs(x);
  const edge = Math.min(1, (Math.abs(x) / 0.77) ** 3);
  const waist = Math.exp(-(((y + 1.03) / 0.25) ** 2));
  return (
    amount *
    (0.018 * Math.sin(y * 24 + x * 9) * edge +
      0.013 * Math.sin(y * 39 - Math.abs(x) * 11) * edge +
      0.026 * Math.sin(x * 27 + y * 6) * waist +
      0.009 * Math.sin(y * 10 + x * 4))
  );
}
export function surfaceDepth(x: number, y: number, amount = 0.65) {
  const w = torsoWidth(y),
    depth = 0.34 + 0.035 * Math.cos((y + 0.1) * 2);
  return Math.sqrt(Math.max(0, 1 - (x / w) ** 2)) * depth + fold(x, y, amount);
}
export function fabricMaterial(
  color: string,
  appearance: Appearance,
  rib = false,
) {
  const size = 128,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const v = Math.round(
        128 +
          28 *
            Math.sin(x * (rib ? 1.5 : Math.PI)) *
            Math.cos((y * Math.PI) / 2) +
          12 * (noise - Math.floor(noise)),
      );
      const material = appearance.material ?? "cotton";
      const weave =
        material === "rib"
          ? Math.sin((x * Math.PI) / 3) * 35
          : material === "waffle"
            ? Math.sin((x * Math.PI) / 8) * Math.sin((y * Math.PI) / 8) * 45
            : material === "mesh"
              ? ((x % 12) - 6) ** 2 + ((y % 12) - 6) ** 2 < 12
                ? -75
                : 10
              : material === "pique"
                ? Math.sin(x * 0.8) * Math.cos(y * 0.8) * 30
                : material === "interlock"
                  ? Math.sin((x + y) * 1.2) * 18
                  : material === "sport"
                    ? Math.cos(x * 0.5 + y * 1.8) * 16
                    : material === "fleece"
                      ? (noise - Math.floor(noise)) * 45
                      : material === "blend"
                        ? Math.sin(x * 2 + y) * 8
                        : 0;
      const i = (y * size + x) * 4;
      data[i] =
        data[i + 1] =
        data[i + 2] =
          Math.max(0, Math.min(255, v + weave));
      data[i + 3] = 255;
    }
  const map = new THREE.DataTexture(data, size, size);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(
    (rib ? 12 : 30) / (appearance.knitSize ?? 1),
    (rib ? 2 : 30) / (appearance.knitSize ?? 1),
  );
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 8;
  map.needsUpdate = true;
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: appearance.roughness,
    metalness: 0,
    bumpMap: map,
    bumpScale: appearance.texture * 0.0025,
    sheen: 0.3,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color("white"), 0.15),
    side: THREE.DoubleSide,
  });
  configureFabricMaterial(material, color, appearance);
  return material;
}
export function configureFabricMaterial(
  material: THREE.MeshStandardMaterial,
  color: string,
  a: Appearance,
) {
  const gradient = a.gradient,
    colors = gradient?.colors ?? [color, color];
  material.onBeforeCompile = (shader) => {
    shader.uniforms.studioColors = {
      value: Array.from(
        { length: 5 },
        (_, i) => new THREE.Color(colors[Math.min(i, colors.length - 1)]),
      ),
    };
    shader.uniforms.studioColorCount = { value: colors.length };
    const ps = gradient ? gradientPositions(gradient) : [0, 1];
    shader.uniforms.studioPositions = {
      value: Array.from(
        { length: 5 },
        (_, i) => ps[Math.min(i, ps.length - 1)],
      ),
    };
    shader.uniforms.studioBrightness = { value: a.brightness ?? 1 };
    shader.uniforms.studioAngle = {
      value: ((gradient?.angle ?? 90) * Math.PI) / 180,
    };
    shader.vertexShader =
      "varying vec2 vStudioPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvStudioPosition = (modelMatrix * vec4(transformed,1.0)).xy;",
    );
    shader.fragmentShader =
      "varying vec2 vStudioPosition; uniform vec3 studioColors[5]; uniform float studioPositions[5]; uniform int studioColorCount; uniform float studioBrightness; uniform float studioAngle;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
    float studioT=clamp(dot(vStudioPosition,vec2(cos(studioAngle),sin(studioAngle)))/2.6+0.5,0.0,1.0);
    vec3 studioBase=studioColors[0];
    for(int i=0;i<4;i++){if(i<studioColorCount-1 && studioT>=studioPositions[i]) studioBase=mix(studioColors[i],studioColors[i+1],clamp((studioT-studioPositions[i])/max(0.00001,studioPositions[i+1]-studioPositions[i]),0.0,1.0));}
    studioBase*=studioBrightness;
    #ifdef USE_MAP
      vec4 studioArt=texture2D(map,vMapUv);
      diffuseColor.rgb=mix(studioBase,studioArt.rgb,studioArt.a);diffuseColor.a=opacity;
    #else
      diffuseColor.rgb=studioBase;
    #endif
  `,
    );
  };
  material.customProgramCacheKey = () => "studio-fabric-v2";
  material.needsUpdate = true;
}
export function surfaceGeometry(
  rows: number,
  cols: number,
  point: (u: number, v: number) => THREE.Vector3,
) {
  const p: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= cols; x++) {
      const v = point(x / cols, y / rows);
      p.push(v.x, v.y, v.z);
      uv.push(x / cols, 1 - y / rows);
    }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * (cols + 1) + x;
      indices.push(i, i + cols + 1, i + 1, i + 1, i + cols + 1, i + cols + 2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
