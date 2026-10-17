const PATHS = {
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  collapse: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  start: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>',
  fundamentals: '<path d="M5 19V5h9l5 5v9H5z"/><path d="M14 5v5h5"/>',
  dsa: '<path d="M4 7h16M4 12h10M4 17h13"/><path d="M17 10l3 2-3 2"/>',
  async: '<path d="M4 7c4 0 4 10 8 10s4-10 8-10"/><path d="M7 17l-3-2 3-2M17 7l3 2-3 2"/>',
  typing: '<path d="M5 7h6M5 12h14M5 17h9"/><path d="M16 5l3 2-3 2"/>',
  stdlib: '<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  web: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 11.6 0 16M12 4c-2.5 2.4-2.5 11.6 0 16"/>',
  data: '<path d="M4 18V6M4 18h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>',
  ai: '<circle cx="8" cy="10" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="14" cy="16" r="2"/><path d="M10 10l4-1M9.5 11.5l3.5 3.5M16 10v4"/>',
  automation: '<circle cx="8" cy="12" r="3"/><circle cx="17" cy="8" r="2.2"/><circle cx="17" cy="16" r="2.2"/><path d="M11 12h4M15.4 9.4l.2 4.2"/>',
  tooling: '<path d="M14 6l4 4-8 8H6v-4l8-8z"/>',
  licensing: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 8H6a2 2 0 0 0 0 4h2M16 8h2a2 2 0 0 1 0 4h-2"/>',
  certifications: '<path d="M12 3l2.2 4.6L19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6L12 3z"/>',
  career: '<path d="M4 18h16"/><path d="M6 18V10M12 18V6M18 18v-5"/>',
  projects: '<path d="M4 8h16v11H4z"/><path d="M8 8V6h8v2"/>',
  practice: '<path d="M5 6h14v12H5z"/><path d="M8 10h8M8 14h5"/>',
  games: '<rect x="4" y="8" width="16" height="10" rx="3"/><path d="M8 13h3M9.5 11.5v3M16 12h.01M18 14h.01"/>',
  quizzes: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.9-1.2 1.6V14"/><path d="M12 17h.01"/>',
  rooms: '<path d="M4 20V10L12 4l8 6v10"/><path d="M10 20v-6h4v6"/>',
  ecosystem: '<circle cx="12" cy="12" r="2"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M7 8l3 3M17 8l-3 3M8 17l3-3M16 17l-3-3"/>',
  downloads: '<path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 19h14"/>',
  sources: '<path d="M6 4h9l3 3v13H6z"/><path d="M15 4v3h3M8 11h8M8 15h6"/>',
  about: '<circle cx="12" cy="9" r="3"/><path d="M6 19c1.2-2.4 3.2-3.5 6-3.5S16.8 16.6 18 19"/>',
};

export function icon(name, size = 26) {
  const body = PATHS[name] || PATHS.start;
  return `<span class="ico"><svg class="ico-svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg></span>`;
}

export function rawIcon(name, size = 20) {
  const body = PATHS[name] || PATHS.start;
  return `<svg class="ico-svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
