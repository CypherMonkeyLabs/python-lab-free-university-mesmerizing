/* Level 3, Workshop: meshing gears (each gear is a function) and rising sparks. */
import { label, rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

function gear(T, radius, teeth, color, depth = 0.34) {
  const g = new T.Group();
  const mat = new T.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45, flatShading: true });
  const body = new T.Mesh(new T.CylinderGeometry(radius, radius, depth, 28), mat); body.rotation.x = Math.PI / 2; g.add(body);
  const hub = new T.Mesh(new T.CylinderGeometry(radius * 0.28, radius * 0.28, depth * 1.6, 14), new T.MeshStandardMaterial({ color: "#2b2b36", metalness: 0.7, roughness: 0.4 })); hub.rotation.x = Math.PI / 2; g.add(hub);
  const tw = (Math.PI * 2 * radius) / teeth * 0.5;
  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2;
    const t = new T.Mesh(new T.BoxGeometry(tw, radius * 0.24, depth), mat);
    t.position.set(Math.cos(a) * (radius + radius * 0.08), Math.sin(a) * (radius + radius * 0.08), 0); t.rotation.z = a - Math.PI / 2; g.add(t);
  }
  g.userData = { teeth };
  return g;
}

export default function build(T, { accent, q, full, aspect }) {
  const r = rnd(3);
  const scene = new T.Scene();
  scene.background = new T.Color("#1a0f05");
  scene.fog = new T.Fog("#1a0f05", 10, 28);
  const cam = new T.PerspectiveCamera(48, aspect, 0.1, 80);
  cam.position.set(0, 0.8, 9);
  scene.add(new T.AmbientLight("#ffe2c0", 0.7));
  const key = new T.DirectionalLight("#fff0dd", 2.2); key.position.set(3, 5, 6); scene.add(key);
  const warm = new T.PointLight(accent, 40, 20); warm.position.set(-3, 2, 4); scene.add(warm);
  let aurora = null;
  if (full) { aurora = makeAurora(T, accent); scene.add(aurora.mesh); }

  const bench = new T.Mesh(new T.BoxGeometry(22, 0.5, 8), new T.MeshLambertMaterial({ color: "#3a2410" })); bench.position.set(0, -3.4, -1); scene.add(bench);
  const specs = [
    { r: 1.5, n: 16, x: -3.4, y: -0.4, c: accent, name: "def" },
    { r: 0.95, n: 10, x: 0, y: 0.15, c: "#8fb3c9", name: "return" },
    { r: 1.2, n: 13, x: 2.4, y: -1.1, c: "#ffd7a0", name: "scope" },
  ];
  // Place gears so that centre distance = sum of radii + tooth height (meshing).
  specs[1].x = specs[0].x + Math.hypot(1, 0.55) * 0 + (specs[0].r + specs[1].r) * 1.08 * Math.cos(0.22); specs[1].y = specs[0].y + (specs[0].r + specs[1].r) * 1.08 * Math.sin(0.22);
  specs[2].x = specs[1].x + (specs[1].r + specs[2].r) * 1.08 * Math.cos(-0.5); specs[2].y = specs[1].y + (specs[1].r + specs[2].r) * 1.08 * Math.sin(-0.5);
  const gears = specs.map((s, i) => {
    const g = gear(T, s.r, s.n, s.c); g.position.set(s.x, s.y, 0); g.rotation.z = i % 2 ? Math.PI / s.n : 0; scene.add(g);
    const l = label(T, s.name, "#ffb36b"); l.position.set(s.x, s.y + s.r + 0.7, 0.6); scene.add(l);
    return g;
  });
  const sc = Math.round(70 * q) + 12;
  const sp = new Float32Array(sc * 3); const vel = new Float32Array(sc);
  for (let i = 0; i < sc; i += 1) { sp[i * 3] = (r() - 0.5) * 8; sp[i * 3 + 1] = -2.6 + r() * 5; sp[i * 3 + 2] = r() * 2; vel[i] = 0.4 + r(); }
  const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(sp, 3));
  scene.add(new T.Points(sg, new T.PointsMaterial({ color: "#ffb347", size: 0.08, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false })));
  const speed = 0.5;
  return {
    scene, camera: cam,
    update(t, dt, px, py) {
      gears.forEach((g, i) => { g.rotation.z += dt * speed * (i % 2 ? -1 : 1) * (16 / specs[i].n); });
      for (let i = 0; i < sc; i += 1) { sp[i * 3 + 1] += dt * vel[i] * 0.8; sp[i * 3] += Math.sin(t + i) * 0.003; if (sp[i * 3 + 1] > 2.8) sp[i * 3 + 1] = -2.6; }
      sg.attributes.position.needsUpdate = true;
      warm.intensity = 36 + Math.sin(t * 5) * 4;
      cam.position.x += (px * 1.4 - cam.position.x) * 0.05; cam.position.y += (0.8 + py * 0.6 - cam.position.y) * 0.05; cam.lookAt(0, -0.3, 0);
      aurora?.update(t);
    },
  };
}
