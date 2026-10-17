/* Level 1, Tidepool: bubbles that carry value types rise through a pool. */
import { label, rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

export default function build(T, { accent, q, full, aspect }) {
  const r = rnd(11);
  const scene = new T.Scene();
  scene.background = new T.Color("#0a3a4d");
  scene.fog = new T.Fog("#0a3a4d", 6, 22);
  const cam = new T.PerspectiveCamera(50, aspect, 0.1, 80);
  cam.position.set(0, 0.5, 8);
  scene.add(new T.HemisphereLight("#d8f8ff", "#14607a", 2.4));
  const key = new T.DirectionalLight("#ffffff", 1.1); key.position.set(-3, 6, 6); scene.add(key);
  let aurora = null;
  if (full) { aurora = makeAurora(T, accent); scene.add(aurora.mesh); }

  const wSeg = Math.round(40 * q) + 8;
  const water = new T.Mesh(new T.PlaneGeometry(26, 8, wSeg, 12), new T.MeshLambertMaterial({ color: "#1488a5", transparent: true, opacity: 0.55, flatShading: true }));
  water.rotation.x = -Math.PI / 2.4; water.position.set(0, -2.1, -2);
  scene.add(water);
  const base = water.geometry.attributes.position.array.slice();
  const wp = water.geometry.attributes.position;
  const sand = new T.Mesh(new T.PlaneGeometry(30, 14, 1, 1), new T.MeshLambertMaterial({ color: "#c9b68a" }));
  sand.rotation.x = -Math.PI / 2; sand.position.y = -3; scene.add(sand);
  for (let i = 0; i < Math.round(14 * q) + 3; i += 1) {
    const p = new T.Mesh(new T.IcosahedronGeometry(0.2 + r() * 0.25, 0), new T.MeshLambertMaterial({ color: i % 4 === 0 ? accent : "#8aa5a8", flatShading: true }));
    p.position.set((r() - 0.5) * 14, -2.8, (r() - 0.5) * 8); scene.add(p);
  }
  const types = ["int", "str", "float", "bool", "None", "list"];
  const bubbles = [];
  const n = Math.round(14 * q) + 4;
  for (let i = 0; i < n; i += 1) {
    const g = new T.Group();
    const rad = 0.28 + r() * 0.5;
    g.add(new T.Mesh(new T.SphereGeometry(rad, 16, 12), new T.MeshLambertMaterial({ color: i % 2 ? accent : "#bff6ff", transparent: true, opacity: 0.42 })));
    if (i < types.length) { const l = label(T, types[i], "#bff6ff"); l.material.opacity = 1; l.scale.set(2, 0.75, 1); l.position.z = rad + 0.01; g.add(l); }
    g.userData = { x: (r() - 0.5) * 11, y: -2.5 + r() * 6, z: -r() * 5, sp: 0.25 + r() * 0.4, ph: r() * 6.28 };
    scene.add(g); bubbles.push(g);
  }
  return {
    scene, camera: cam,
    update(t, dt, px, py) {
      bubbles.forEach((g) => {
        const u = g.userData; u.y += dt * u.sp; if (u.y > 3.8) u.y = -2.6;
        g.position.set(u.x + Math.sin(t * 0.8 + u.ph) * 0.3, u.y, u.z);
      });
      for (let i = 0; i < wp.count; i += 1) wp.setZ(i, base[i * 3 + 2] + Math.sin(base[i * 3] * 0.9 + t * 1.3) * 0.18 + Math.cos(base[i * 3 + 1] * 1.4 + t) * 0.1);
      wp.needsUpdate = true;
      cam.position.x += (px * 1.2 - cam.position.x) * 0.05; cam.position.y += (0.5 + py * 0.5 - cam.position.y) * 0.05; cam.lookAt(0, 0, 0);
      aurora?.update(t);
    },
  };
}
