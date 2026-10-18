/* Shared builder for Levels 4-10. Each kind is a small interactive scene, not the lobby aurora. */
import { label, rnd } from "../helpers.js";
import { makeAurora } from "../aurora.js";

function mesh(T, geo, color, metal) {
  const mat = metal
    ? new T.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.4, flatShading: true })
    : new T.MeshLambertMaterial({ color, flatShading: true });
  return new T.Mesh(geo, mat);
}

function lights(T, scene, accent, sky, ground) {
  scene.add(new T.HemisphereLight(sky, ground, 0.85));
  const sun = new T.DirectionalLight("#fff6e8", 1.3);
  sun.position.set(4, 7, 5);
  scene.add(sun);
  const glow = new T.PointLight(accent, 18, 16);
  glow.position.set(-2, 2, 3);
  scene.add(glow);
  return glow;
}

export function buildWorld(T, { accent, q, full, aspect }, spec) {
  const r = rnd(spec.seed);
  const scene = new T.Scene();
  scene.background = new T.Color(spec.bg);
  scene.fog = new T.Fog(spec.bg, 11, 28);
  const cam = new T.PerspectiveCamera(48, aspect, 0.1, 80);
  cam.position.set(0, 1.2, 8);
  const glow = lights(T, scene, accent, spec.sky, spec.ground);
  let aurora = null;
  if (full) {
    aurora = makeAurora(T, accent);
    scene.add(aurora.mesh);
  }
  const hero = new T.Group();
  scene.add(hero);
  const movers = spec.build(T, { accent, q, r, mesh, hero, scene });
  return {
    scene,
    camera: cam,
    update(t, dt, px, py, input) {
      const pulse = input && input.pulse ? input.pulse : 0;
      const taps = input && input.taps ? input.taps : 0;
      hero.scale.setScalar(1 + pulse * 0.12);
      glow.intensity = 18 + pulse * 30;
      movers(t, dt, pulse, taps);
      cam.position.x += (px * 1.3 - cam.position.x) * 0.05;
      cam.position.y += (1.2 + py * 0.55 - cam.position.y) * 0.05;
      cam.lookAt(0, 0.3, 0);
      aurora?.update(t);
    },
  };
}

export const kinds = {
  shelves(T, { accent, q, r, mesh, hero, scene }) {
    const floor = mesh(T, new T.BoxGeometry(14, 0.3, 8), "#6b4a2e");
    floor.position.y = -1.5;
    hero.add(floor);
    const books = [];
    const tones = [accent, "#f6e27a", "#9ad7ff", "#ff9ec5", "#b8f2c8"];
    for (let col = 0; col < 5; col += 1) {
      const stack = new T.Group();
      const n = 3 + (col % 3);
      for (let i = 0; i < n; i += 1) {
        const book = mesh(T, new T.BoxGeometry(0.28, 0.9, 0.55), tones[(col + i) % tones.length]);
        book.position.set(0, i * 0.18, 0);
        book.rotation.z = (i - 1) * 0.08;
        stack.add(book);
      }
      stack.position.set(-3.2 + col * 1.6, -0.9, -1.2);
      hero.add(stack);
      books.push(stack);
    }
    ["list", "dict", "set"].forEach((word, i) => {
      const tag = label(T, word, accent);
      tag.position.set(-2.2 + i * 2.2, 1.5, 0);
      scene.add(tag);
    });
    const card = mesh(T, new T.BoxGeometry(0.9, 0.55, 0.04), "#fff8e8");
    card.position.set(2.4, 0.4, 1.2);
    hero.add(card);
    return (t) => {
      card.position.y = 0.45 + Math.sin(t * 1.4) * 0.18;
      card.rotation.y = Math.sin(t * 0.7) * 0.4;
      books.forEach((stack, i) => { stack.rotation.y = Math.sin(t * 0.6 + i) * 0.06; });
    };
  },
  forge(T, { accent, q, r, mesh, hero, scene }) {
    const anvil = mesh(T, new T.BoxGeometry(2.2, 0.45, 0.9), "#4a4e57", true);
    anvil.position.y = -0.2;
    hero.add(anvil);
    const horn = mesh(T, new T.ConeGeometry(0.28, 1.1, 8), "#6a707c", true);
    horn.rotation.z = -Math.PI / 2;
    horn.position.set(1.4, -0.05, 0);
    hero.add(horn);
    const base = mesh(T, new T.CylinderGeometry(0.35, 0.5, 1.2, 8), "#3a2418");
    base.position.y = -1.0;
    hero.add(base);
    const sparks = [];
    for (let i = 0; i < Math.round(18 * q) + 8; i += 1) {
      const s = mesh(T, new T.SphereGeometry(0.05, 6, 6), i % 2 ? accent : "#ffd166");
      s.userData = { p: r() * 6.28, s: 0.6 + r() };
      hero.add(s);
      sparks.push(s);
    }
    const tag = label(T, "class", accent);
    tag.position.set(-1.6, 1.6, 0);
    scene.add(tag);
    return (t, dt, pulse) => {
      sparks.forEach((s) => {
        const u = (t * s.userData.s + s.userData.p) % 1;
        s.position.set(Math.sin(s.userData.p) * 0.8, -0.1 + u * (2.2 + pulse), Math.cos(s.userData.p) * 0.5);
      });
    };
  },
  conveyor(T, { accent, q, r, mesh, hero, scene }) {
    const belt = mesh(T, new T.BoxGeometry(9, 0.18, 1.4), "#355c5a");
    belt.position.y = -0.6;
    hero.add(belt);
    const boxes = [];
    const tones = [accent, "#fbbf24", "#fb7185", "#a78bfa"];
    for (let i = 0; i < 5; i += 1) {
      const box = mesh(T, new T.BoxGeometry(0.7, 0.55, 0.7), tones[i % tones.length]);
      box.userData = { off: i / 5 };
      hero.add(box);
      boxes.push(box);
    }
    ["path", "re", "args"].forEach((word, i) => {
      const tag = label(T, word, "#08343a");
      tag.position.set(-2.4 + i * 2.4, 1.4, 0.2);
      scene.add(tag);
    });
    return (t, dt, pulse) => {
      const speed = 0.12 + pulse * 0.25;
      boxes.forEach((box) => {
        const u = (box.userData.off + t * speed) % 1;
        box.position.set(-4 + u * 8, -0.15, 0);
      });
    };
  },
  observatory(T, { accent, q, r, mesh, hero, scene }) {
    const tube = mesh(T, new T.CylinderGeometry(0.38, 0.48, 3.2, 16), "#d5e4ff", true);
    tube.rotation.z = Math.PI / 2.6;
    tube.position.set(0.4, 0.4, 0);
    hero.add(tube);
    const lens = mesh(T, new T.SphereGeometry(0.42, 16, 12), accent);
    lens.position.set(1.7, 1.15, 0);
    hero.add(lens);
    const stand = mesh(T, new T.CylinderGeometry(0.12, 0.2, 1.6, 8), "#8aa0c8");
    stand.position.y = -0.7;
    hero.add(stand);
    const count = Math.round(80 * q) + 30;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (r() - 0.5) * 14;
      pos[i * 3 + 1] = r() * 4 - 0.5;
      pos[i * 3 + 2] = -r() * 6;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const stars = new T.Points(geo, new T.PointsMaterial({ color: "#fff6c8", size: 0.07, transparent: true, opacity: 0.9 }));
    scene.add(stars);
    const tag = label(T, "yield", accent);
    tag.position.set(-2.2, 1.6, 0.4);
    scene.add(tag);
    return (t, dt, pulse) => {
      stars.rotation.y = t * 0.05;
      lens.scale.setScalar(1 + pulse * 0.35 + Math.sin(t * 2) * 0.04);
    };
  },
  turbines(T, { accent, q, r, mesh, hero, scene }) {
    const fans = [];
    for (let i = 0; i < 3; i += 1) {
      const g = new T.Group();
      const shaft = mesh(T, new T.CylinderGeometry(0.12, 0.12, 0.5, 10), "#9aa3b5", true);
      shaft.rotation.x = Math.PI / 2;
      g.add(shaft);
      const ring = mesh(T, new T.TorusGeometry(0.85, 0.08, 8, 24), i === 1 ? accent : "#f9a8d4");
      g.add(ring);
      for (let b = 0; b < 4; b += 1) {
        const blade = mesh(T, new T.BoxGeometry(0.18, 0.7, 0.06), "#ffe4f1");
        const a = (b / 4) * Math.PI * 2;
        blade.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0);
        blade.rotation.z = a;
        g.add(blade);
      }
      g.position.set(-2.3 + i * 2.3, 0.2, -0.4 * i);
      hero.add(g);
      fans.push(g);
    }
    const tag = label(T, "async", accent);
    tag.position.set(0, 1.8, 0.6);
    scene.add(tag);
    return (t, dt, pulse) => {
      fans.forEach((g, i) => { g.rotation.z += dt * (0.8 + i * 0.35 + pulse * 2) * (i === 1 ? -1 : 1); });
    };
  },
  scrolls(T, { accent, q, r, mesh, hero, scene }) {
    const pages = [];
    const words = ["PEP 8", "data", "len"];
    words.forEach((word, i) => {
      const page = new T.Group();
      const sheet = mesh(T, new T.BoxGeometry(1.5, 2.0, 0.05), i === 1 ? "#fff8ea" : "#f3efe2");
      page.add(sheet);
      const tag = label(T, word, "#3a2e16");
      tag.position.set(0, 0, 0.1);
      tag.scale.set(0.8, 0.8, 0.8);
      page.add(tag);
      page.position.set(-2.2 + i * 2.2, 0.2, 0);
      page.userData = { i };
      hero.add(page);
      pages.push(page);
    });
    const rail = mesh(T, new T.BoxGeometry(8, 0.15, 0.4), accent);
    rail.position.y = -1.3;
    hero.add(rail);
    return (t, dt, pulse, taps) => {
      pages.forEach((page) => {
        const i = page.userData.i;
        page.rotation.y = Math.sin(t * 0.7 + i + taps) * (0.35 + pulse);
        page.position.y = 0.2 + Math.sin(t * 0.9 + i) * 0.12;
      });
    };
  },
  reactor(T, { accent, q, r, mesh, hero, scene }) {
    const core = mesh(T, new T.IcosahedronGeometry(0.95, 0), accent);
    hero.add(core);
    const shell = mesh(T, new T.IcosahedronGeometry(1.45, 0), "#ffffff");
    shell.material.wireframe = true;
    hero.add(shell);
    const orbs = [];
    ["py", "json", "math"].forEach((word, i) => {
      const g = new T.Group();
      const orb = mesh(T, new T.SphereGeometry(0.28, 12, 10), ["#ffd166", "#7ee08a", "#8ab4ff"][i]);
      g.add(orb);
      const tag = label(T, word, "#10233a");
      tag.position.y = 0.55;
      g.add(tag);
      g.userData = { a: (i / 3) * Math.PI * 2 };
      scene.add(g);
      orbs.push(g);
    });
    return (t, dt, pulse) => {
      core.rotation.y += dt * 0.4;
      core.rotation.x = Math.sin(t * 0.5) * 0.2;
      shell.rotation.y -= dt * 0.25;
      const scale = 1 + pulse * 0.25 + Math.sin(t * 2) * 0.03;
      core.scale.setScalar(scale);
      orbs.forEach((g) => {
        const a = g.userData.a + t * 0.45;
        g.position.set(Math.cos(a) * 2.6, Math.sin(t * 0.8 + a) * 0.35, Math.sin(a) * 2.6);
      });
    };
  },
};

export function makeLevel(kind, seed, bg, sky, ground) {
  return function build(T, opts) {
    const spec = kinds[kind];
    if (!spec) throw new Error(`Unknown scene kind: ${kind}`);
    return buildWorld(T, opts, { seed, bg, sky, ground, build: spec });
  };
}
