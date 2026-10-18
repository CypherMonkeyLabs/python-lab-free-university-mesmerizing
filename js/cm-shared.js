/* Shared CypherMonkey Labs Zodiac Brand, Header, Bot & Downloads helpers.
   Reusable across 100+ CypherMonkey Labs studio apps (see LAB_TEMPLATE.md). */

export const BRAND_DOMAIN = "cyphermonkeylabs.com";
export const BRAND_URL = "https://cyphermonkeylabs.com";

export function zodiacMonkeySvg(size = 32, cls = "cm-zodiac-svg") {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="30" fill="#1e1442" stroke="#f4b942" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="26.5" fill="none" stroke="#7fe3d0" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="13" cy="31" r="7.5" fill="#8b5a2b" stroke="#f4b942" stroke-width="1.5"/>
    <circle cx="13" cy="31" r="4.5" fill="#f6c28b"/>
    <circle cx="51" cy="31" r="7.5" fill="#8b5a2b" stroke="#f4b942" stroke-width="1.5"/>
    <circle cx="51" cy="31" r="4.5" fill="#f6c28b"/>
    <polygon points="22,18 25,9 29,14 32,6 35,14 39,9 42,18" fill="#ffd54f" stroke="#f4b942" stroke-width="1"/>
    <circle cx="32" cy="5.5" r="2.2" fill="#7fe3d0"/>
    <ellipse cx="32" cy="32" rx="15" ry="14" fill="#8b5a2b" stroke="#f4b942" stroke-width="1.5"/>
    <circle cx="26.5" cy="28.5" r="7.5" fill="#fbd3a7"/>
    <circle cx="37.5" cy="28.5" r="7.5" fill="#fbd3a7"/>
    <ellipse cx="32" cy="36.5" rx="11.5" ry="8.5" fill="#fbd3a7"/>
    <circle cx="26.5" cy="29" r="3.2" fill="#1a1438" stroke="#38d9a9" stroke-width="1"/>
    <circle cx="25.5" cy="28" r="1.1" fill="#fff"/>
    <circle cx="37.5" cy="29" r="3.2" fill="#1a1438" stroke="#38d9a9" stroke-width="1"/>
    <circle cx="36.5" cy="28" r="1.1" fill="#fff"/>
    <circle cx="30" cy="34.5" r="1.1" fill="#5c3317"/>
    <circle cx="34" cy="34.5" r="1.1" fill="#5c3317"/>
    <path d="M26.5 38.5 Q32 43 37.5 38.5" fill="none" stroke="#5c3317" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="23.5" cy="36" rx="2.3" ry="1.5" fill="#f78ca2"/>
    <ellipse cx="40.5" cy="36" rx="2.3" ry="1.5" fill="#f78ca2"/>
  </svg>`;
}

export function zodiacBrandPill({ size = 28, title = "CypherMonkey Zodiac Lab", link = false } = {}) {
  const inner = `${zodiacMonkeySvg(size)}<span class="cm-brand-meta"><b class="cm-brand-title">${title}</b><span class="cm-brand-domain">${BRAND_DOMAIN}</span></span>`;
  return link
    ? `<a class="cm-brand-pill" href="${BRAND_URL}" rel="noopener">${inner}</a>`
    : `<span class="cm-brand-pill">${inner}</span>`;
}
