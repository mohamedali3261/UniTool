import * as THREE from "three";
export const teeStyles = [
  {
    id: "classic",
    ar: "كلاسيك — رقبة دائرية",
    en: "Classic crew neck",
    detail: "قصة مستقيمة وكم قصير",
    description: "Straight body · short sleeves",
  },
  {
    id: "boxy",
    ar: "بوكسي — عريض وقصير",
    en: "Boxy cropped",
    detail: "جسم أعرض وطول أقصر وكم واسع",
    description: "Wide body · shorter hem · roomy sleeves",
  },
  {
    id: "slim",
    ar: "سليم فيت",
    en: "Slim fit",
    detail: "خصر محدد وأكمام أقرب للجسم",
    description: "Shaped waist · fitted sleeves",
  },
  {
    id: "longline",
    ar: "لونج لاين — طويل",
    en: "Longline",
    detail: "جسم أطول وذيل منحني",
    description: "Extended body · curved hem",
  },
  {
    id: "drop",
    ar: "دروب شولدر",
    en: "Drop shoulder",
    detail: "كتف ساقط وكم أطول وأوسع",
    description: "Dropped shoulders · wide longer sleeves",
  },
  {
    id: "vneck",
    ar: "رقبة V",
    en: "V-neck",
    detail: "فتحة أمامية V وياقة خلفية مرتفعة",
    description: "V front opening · raised back neck",
  },
  {
    id: "longsleeve",
    ar: "تيشيرت كم طويل",
    en: "Long sleeve tee",
    detail: "أكمام طويلة مفتوحة بدون أساور سويت شيرت",
    description: "Full length sleeves · open turned hems",
  },
] as const;
export type TeeStyle = (typeof teeStyles)[number]["id"];
/** Continuous coordinate deformation shared by cloth, lining, seams and print. UVs stay unchanged. */
export function teePoint(
  x: number,
  y: number,
  z: number,
  style: TeeStyle = "classic",
) {
  const arm = THREE.MathUtils.smoothstep(Math.abs(x), 0.77, 1.4);
  let xx = x,
    yy = y,
    zz = z;
  if (style === "boxy") {
    xx = x * 1.16;
    yy = 1.08 + (y - 1.08) * 0.86;
    zz = z * 1.12;
  }
  if (style === "slim") {
    xx = x * (0.92 - 0.095 * Math.exp(-(((y + 0.25) / 0.7) ** 2)));
    zz = z * 0.9;
  }
  if (style === "longline") {
    yy =
      1.08 +
      (y - 1.08) * 1.18 -
      0.055 *
        Math.max(0, 1 - (x / 0.8) ** 2) *
        THREE.MathUtils.smoothstep(-y, 0.7, 1.2);
  }
  if (style === "drop") {
    xx = x * (1.1 + arm * 0.09);
    yy = y - arm * 0.21;
    zz = z * (1 + arm * 0.18);
  }
  if (style === "longsleeve") {
    xx = x + Math.sign(x) * arm * 0.42;
    yy = y - arm * 1.18;
    zz = z * (1 - arm * 0.08);
  }
  if (style === "vneck") {
    // Original front neck: y=1.055+1.509*x². Lift the corners and lower the centre into a V.
    const t = Math.min(1, Math.abs(x) / 0.31),
      old = 1.055 + 0.145 * t * t,
      target = 0.84 + 0.36 * t;
    const neckWeight =
      (1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.3, 0.36)) *
      THREE.MathUtils.smoothstep(y, 0.65, 1.04);
    const front = THREE.MathUtils.smoothstep(z, -0.03, 0.03);
    yy += (target - old) * neckWeight * front;
  }
  return new THREE.Vector3(xx, yy, zz);
}
export function deformTeeGeometry(g: THREE.BufferGeometry, style: TeeStyle) {
  if (style === "classic") return;
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal"),
    eps = 0.0001;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      v = teePoint(x, y, z, style);
    if (n) {
      const dx = teePoint(x + eps, y, z, style)
          .sub(v)
          .divideScalar(eps),
        dy = teePoint(x, y + eps, z, style)
          .sub(v)
          .divideScalar(eps),
        dz = teePoint(x, y, z + eps, style)
          .sub(v)
          .divideScalar(eps);
      const jac = new THREE.Matrix3()
        .set(dx.x, dy.x, dz.x, dx.y, dy.y, dz.y, dx.z, dy.z, dz.z)
        .invert()
        .transpose();
      const normal = new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i))
        .applyMatrix3(jac)
        .normalize();
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  if (n) n.needsUpdate = true;
  g.computeBoundingBox();
  g.computeBoundingSphere();
}
