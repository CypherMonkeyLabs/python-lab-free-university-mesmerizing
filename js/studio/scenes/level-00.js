/* Level 0, Hatchling Meadow: a meadow of floating `print` stones, seedlings and fireflies. */
import { label, rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

export default function build(T, { accent, q, full, aspect }) {
  const r = rnd(7);
  const scene = new T.Scene();
  scene.background = new T.Color("#0b1d1a");
  scene.fog = new T.Fog("#0b1d1a", 9, 26);
  const cam = new T.PerspectiveCamera(50, aspect, 0.1, 80);
  cam.position.set(0, 1.4, 8);
  scene.add(new T.HemisphereLight("#cfffe0", "#1b3a2a", 1.0));
  const sun = new T.DirectionalLight("#fff3c0", 1.4); sun.position.set(4, 8, 5); scene.add(sun);
  let aurora = null;
  if (full) { aurora = makeAurora(T, accent); scene.add(aurora.mesh); }

  const seg = Math.round(34 * q) + 6;
  const ground = new T.Mesh(new T.PlaneGeometry(40, 30, seg, seg), new T.MeshLambertMaterial({ color: "#2f7d4a", flatShading: true }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.6;
  const gp = ground.geometry.attributes.position;
  for (let i = 0; i < gp.count; i += 1) gp.setZ(i, Math.sin(gp.getX(i) * 0.5) * 0.35 + Math.cos(gp.getY(i) * 0.4) * 0.3);
  ground.geometry.computeVertexNormals(); scene.add(ground);

  const stones = [];
  const words = ["print()", '"hi"', "42", "# note", "x = 1", "True"];
  const n = Math.round(9 * q) + 2;
  for (let i = 0; i < n; i += 1) {
    const g = new T.Group();
    const m = new T.Mesh(new T.DodecahedronGeometry(0.34 + r() * 0.2), new T.MeshLambertMaterial({ color: i % 3 === 0 ? accent : "#d9efe0", flatShading: true }));
    g.add(m);
    if (i < words.length) { const l = label(T, words[i], "#7ee08a"); l.position.y = 0.85; g.add(l); }
    g.position.set((r() - 0.5) * 12, 0.2 + r() * 2.2, -r() * 7);
    g.userData = { y: g.position.y, ph: r() * 6.28, sp: 0.5 + r() * 0.6 };
    scene.add(g); stones.push(g);
  }
  const seeds = new T.Group();
  for (let i = 0; i < 7; i += 1) {
    const s = new T.Group();
    s.add(new T.Mesh(new T.ConeGeometry(0.08, 0.7, 5), new T.MeshLambertMaterial({ color: "#49c46a" })));
    const leaf = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshLambertMaterial({ color: accent })); leaf.scale.set(1.5, 0.4, 0.8); leaf.position.set(0.18, 0.28, 0); s.add(leaf);
    s.position.set(-5 + i * 1.7 + r(), -1.45, 1.5 - r() * 2.5); seeds.add(s);
  }
  scene.add(seeds);
  const fc = Math.round(110 * q) + 20;
  const fp = new Float32Array(fc * 3);
  for (let i = 0; i < fc; i += 1) { fp[i * 3] = (r() - 0.5) * 16; fp[i * 3 + 1] = r() * 4 - 1; fp[i * 3 + 2] = -r() * 8 + 2; }
  const fg = new T.BufferGeometry(); fg.setAttribute("position", new T.BufferAttribute(fp, 3));
  const flies = new T.Points(fg, new T.PointsMaterial({ color: "#eaff8a", size: 0.09, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(flies);

  return {
    scene, camera: cam,
    update(t, dt, px, py) {
      stones.forEach((g) => { g.position.y = g.userData.y + Math.sin(t * g.userData.sp + g.userData.ph) * 0.25; g.rotation.y += dt * 0.3; });
      seeds.children.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.2 + i) * 0.12; });
      for (let i = 0; i < fc; i += 1) { fp[i * 3 + 1] += Math.sin(t * 0.8 + i) * 0.002; fp[i * 3] += Math.cos(t * 0.5 + i * 2) * 0.002; }
      fg.attributes.position.needsUpdate = true;
      cam.position.x += (px * 1.4 - cam.position.x) * 0.05; cam.position.y += (1.4 + py * 0.6 - cam.position.y) * 0.05; cam.lookAt(0, 0.3, 0);
      aurora?.update(t);
    },
  };
}
