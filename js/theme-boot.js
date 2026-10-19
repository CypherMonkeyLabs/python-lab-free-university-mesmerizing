try {
  var theme = localStorage.getItem("pythonlab.theme");
  if (theme === "paper" || theme === "terminal" || theme === "contrast" || theme === "ink") {
    document.documentElement.setAttribute("data-theme", theme);
  }
} catch (err) {
  /* Storage can be blocked. The default theme still works. */
}
