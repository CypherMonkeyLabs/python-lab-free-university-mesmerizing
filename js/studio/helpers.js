/* Small helpers shared by the scene modules. */
export function label(T, text, color = "#ffffff", w = 256, h = 96) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.font = "700 44px 'IBM Plex Mono', monospace";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "rgba(10,14,30,.72)";
  const tw = Math.min(w - 8, x.measureText(text).width + 40);
  x.beginPath(); x.roundRect((w - tw) / 2, 14, tw, h - 28, 22); x.fill();
  x.fillStyle = color; x.fillText(text, w / 2, h / 2 + 2);
  const tex = new T.CanvasTexture(c);
  const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(1.5, 0.56, 1);
  return sp;
}
export const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
export function disposeTree(root) {
  root.traverse((o) => {
    o.geometry?.dispose?.();
    const m = o.material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => { mm.map?.dispose?.(); mm.dispose?.(); });
  });
}
