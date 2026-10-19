let mermaidPromise = null;

function resolvedToken(name) {
  const probe = document.getElementById("py-token-probe") || document.body.appendChild(Object.assign(document.createElement("span"), {
    id: "py-token-probe",
  }));
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  probe.style.color = `var(${name})`;
  return getComputedStyle(probe).color;
}

function mermaidTheme() {
  return {
    theme: "base",
    themeVariables: {
      primaryColor: resolvedToken("--surface-2"),
      primaryBorderColor: resolvedToken("--accent-2"),
      primaryTextColor: resolvedToken("--text"),
      lineColor: resolvedToken("--text-muted"),
      fontFamily: "Atkinson Hyperlegible, sans-serif",
    },
  };
}

function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("../vendor/mermaid.min.js", import.meta.url).href;
    script.onload = () => {
      if (window.mermaid) resolve(window.mermaid);
      else reject(new Error("Mermaid did not register"));
    };
    script.onerror = () => reject(new Error("Mermaid file did not load"));
    document.head.appendChild(script);
  }).catch((err) => {
    mermaidPromise = null;
    throw err;
  });
  return mermaidPromise;
}

export async function drawDiagrams(root) {
  drawnRoot = root;
  const hosts = [...root.querySelectorAll(".diagram")];
  if (!hosts.length) return;
  let mermaid;
  try {
    mermaid = await loadMermaid();
    const theme = mermaidTheme();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      fontFamily: "Atkinson Hyperlegible, sans-serif",
      theme: theme.theme,
      themeVariables: theme.themeVariables,
      flowchart: { htmlLabels: false, useMaxWidth: true },
    });
  } catch (err) {
    hosts.forEach((host) => showSource(host, "The diagram file did not start. The source is below."));
    return;
  }
  for (let index = 0; index < hosts.length; index += 1) {
    const figure = hosts[index];
    const source = figure.querySelector(".diagram-source")?.textContent?.trim();
    const target = figure.querySelector(".diagram-host");
    if (!source || !target) continue;
    try {
      const id = `lab-diagram-${Date.now()}-${index}`;
      const rendered = await mermaid.render(id, source);
      target.innerHTML = rendered.svg;
    } catch (err) {
      showSource(figure, "This diagram could not be drawn. The source is below.");
    }
  }
}

let drawnRoot = null;
const themeWatch = new MutationObserver(() => {
  if (drawnRoot && document.body.contains(drawnRoot)) drawDiagrams(drawnRoot);
});
if (typeof document !== "undefined") {
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

function showSource(figure, message) {
  const target = figure.querySelector(".diagram-host");
  const source = figure.querySelector(".diagram-source")?.textContent || "";
  if (!target) return;
  target.textContent = "";
  const note = document.createElement("p");
  note.textContent = message;
  const pre = document.createElement("pre");
  pre.textContent = source;
  target.append(note, pre);
}
