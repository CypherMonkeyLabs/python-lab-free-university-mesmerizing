/* Shared fallback scene for Levels 4-10 and the lobby: aurora + turning wireframe core, tinted by the level accent. */
import { rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

export default function build(T, { accent, q, aspect, n = 0 }) {
  const r = rnd(13 + n);
  const scene = new T.Scene();
  scene.background = new T.Color("#0a0c1c");
  const cam = new T.PerspectiveCamera(50, aspect, 0.1, 80);
  cam.position.set(0, 0.4, 7);
  const aurora = makeAurora(T, accent, 22); scene.add(aurora.mesh);
  scene.add(new T.AmbientLight("#ffffff", 0.6));
  const core = new T.Group();
  const kinds = [T.IcosahedronGeometry, T.OctahedronGeometry, T.DodecahedronGeometry, T.TetrahedronGeometry];
  const Shape = kinds[n % kinds.length];
  core.add(new T.Mesh(new Shape(1.5, 1), new T.MeshBasicMaterial({ color: accent, wireframe: true })));
  core.add(new T.Mesh(new Shape(0.8, 0), new T.MeshBasicMaterial({ color: "#ffffff", wireframe: true, transparent: true, opacity: 0.8 })));
  const ring = new T.Mesh(new T.TorusGeometry(2.4, 0.02, 6, Math.round(64 * q) + 16), new T.MeshBasicMaterial({ color: accent })); ring.rotation.x = Math.PI / 2.3; core.add(ring);
  const ring2 = ring.clone(); ring2.rotation.set(Math.PI / 3, 0.6, 0); ring2.scale.setScalar(1.2); core.add(ring2);
  scene.add(core);
  const c = Math.round(160 * q) + 30; const p = new Float32Array(c * 3);
  for (let i = 0; i < c; i += 1) { const a = r() * 6.28, d = 2.6 + r() * 3.5; p[i * 3] = Math.cos(a) * d; p[i * 3 + 1] = (r() - 0.5) * 4; p[i * 3 + 2] = Math.sin(a) * d - 1; }
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(p, 3));
  const pts = new T.Points(g, new T.PointsMaterial({ color: accent, size: 0.06, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(pts);
  return {
    scene, camera: cam,
    update(t, dt, px, py, input) {
      const pulse = input && input.pulse ? input.pulse : 0;
      core.rotation.y += dt * (0.35 + pulse);
      core.rotation.x = Math.sin(t * 0.3) * 0.25;
      core.scale.setScalar(1 + pulse * 0.12);
      pts.rotation.y -= dt * 0.05;
      cam.position.x += (px * 1.2 - cam.position.x) * 0.05; cam.position.y += (0.4 + py * 0.5 - cam.position.y) * 0.05; cam.lookAt(0, 0, 0);
      aurora.update(t);
    },
  };
}
