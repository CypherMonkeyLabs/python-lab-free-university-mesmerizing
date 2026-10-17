let mermaidPromise = null;

function mermaidTheme() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "paper") return "neutral";
  return "dark";
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
  const hosts = [...root.querySelectorAll(".diagram")];
  if (!hosts.length) return;
  let mermaid;
  try {
    mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      fontFamily: "Atkinson Hyperlegible, sans-serif",
      theme: mermaidTheme(),
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
