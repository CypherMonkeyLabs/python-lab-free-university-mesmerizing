/* Level 2, Crossroads: light paths branch from a hub; pulses choose a branch (if / elif / else). */
import { label, rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

export default function build(T, { accent, q, full, aspect }) {
  const r = rnd(5);
  const scene = new T.Scene();
  scene.background = new T.Color("#171205");
  scene.fog = new T.Fog("#171205", 8, 26);
  const cam = new T.PerspectiveCamera(50, aspect, 0.1, 80);
  cam.position.set(0, 4.2, 8.5);
  scene.add(new T.HemisphereLight("#fff0c0", "#2a1f08", 0.9));
  const pl = new T.PointLight(accent, 30, 18); pl.position.set(0, 2.5, 0); scene.add(pl);
  let aurora = null;
  if (full) { aurora = makeAurora(T, accent); scene.add(aurora.mesh); }

  const floor = new T.Mesh(new T.PlaneGeometry(40, 30), new T.MeshLambertMaterial({ color: "#2b2410" }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; scene.add(floor);
  const pts = []; const step = 1.2;
  for (let i = -16; i <= 16; i += 1) { pts.push(i * step, 0, -18, i * step, 0, 12); }
  for (let i = -15; i <= 10; i += 1) { pts.push(-20, 0, i * step, 20, 0, i * step); }
  const gg = new T.BufferGeometry(); gg.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
  scene.add(new T.LineSegments(gg, new T.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.12 })));

  const hub = new T.Mesh(new T.RingGeometry(0.9, 1.15, 40), new T.MeshBasicMaterial({ color: accent, side: T.DoubleSide, transparent: true, opacity: 0.9 }));
  hub.rotation.x = -Math.PI / 2; hub.position.y = 0.02; scene.add(hub);
  const bez = (a, b, c, t) => new T.Vector3(
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], 0.05,
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]);
  const defs = [
    { a: [0, 1], b: [0, -1.5], c: [-6, -6], tag: "if", col: accent },
    { a: [0, 1], b: [0, -2.5], c: [0, -8], tag: "elif", col: "#ffe9a8" },
    { a: [0, 1], b: [0, -1.5], c: [6, -6], tag: "else", col: "#ffffff" },
  ];
  const stem = new T.Mesh(new T.BoxGeometry(0.4, 0.05, 6), new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }));
  stem.position.set(0, 0.04, 4); scene.add(stem);
  const pulses = [];
  const seg = Math.round(36 * q) + 12;
  defs.forEach((d, bi) => {
    const p = []; for (let i = 0; i <= seg; i += 1) { const v = bez(d.a, d.b, d.c, i / seg); p.push(v.x, v.y, v.z); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
    scene.add(new T.Line(g, new T.LineBasicMaterial({ color: d.col })));
    const wide = new T.Line(g.clone(), new T.LineBasicMaterial({ color: d.col, transparent: true, opacity: 0.35 })); wide.position.y = 0.01; wide.position.x = 0.07; scene.add(wide);
    const tag = label(T, d.tag, "#ffd166"); tag.scale.set(2.2, 0.82, 1); tag.position.set(d.c[0], 1.0, d.c[1]); scene.add(tag);
    for (let k = 0; k < Math.round(3 * q) + 1; k += 1) {
      const m = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), new T.MeshBasicMaterial({ color: d.col }));
      scene.add(m); pulses.push({ m, d, ph: k / (Math.round(3 * q) + 1) + bi * 0.17 });
    }
  });
  const sign = new T.Group();
  const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.4, 8), new T.MeshLambertMaterial({ color: "#8a6a33" })); pole.position.y = 1.2; sign.add(pole);
  [-1, 1].forEach((s, i) => { const a = new T.Mesh(new T.BoxGeometry(1.2, 0.3, 0.06), new T.MeshLambertMaterial({ color: accent })); a.position.set(s * 0.55, 2.05 - i * 0.45, 0); a.rotation.z = s * -0.12; sign.add(a); });
  sign.position.set(1.8, 0, 1.2); scene.add(sign);

  return {
    scene, camera: cam,
    update(t, dt, px, py) {
      pulses.forEach((p) => { const u = (t * 0.22 + p.ph) % 1; const v = bez(p.d.a, p.d.b, p.d.c, u); p.m.position.copy(v); p.m.scale.setScalar(0.6 + Math.sin(u * 3.14) * 0.8); });
      hub.scale.setScalar(1 + Math.sin(t * 2) * 0.05); hub.rotation.z = t * 0.3;
      sign.rotation.y = Math.sin(t * 0.6) * 0.08;
      cam.position.x += (px * 2 - cam.position.x) * 0.05; cam.position.y += (4.2 + py * 0.8 - cam.position.y) * 0.05; cam.lookAt(0, 0.4, -2);
      aurora?.update(t);
    },
  };
}
