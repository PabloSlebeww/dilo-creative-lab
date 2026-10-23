import navRaw from "../content/nav.html?raw";
import transitionRaw from "../content/transition.html?raw";
import crtRaw from "../content/crt.html?raw";
import homeRaw from "../content/pages/index.html?raw";
import eventsRaw from "../content/pages/evenements.html?raw";
import aboutRaw from "../content/pages/a-propos.html?raw";
import contactRaw from "../content/pages/contact.html?raw";
import pagesJson from "../content/pages.json";

export type PageKey = "home" | "events" | "about" | "contact";

export interface PageData {
  slug: string;
  path: string;
  label: string;
  container_class: string;
  title: string;
  description: string;
  og_title: string;
  og_image: string;
}

export const pages = pagesJson as Record<PageKey, PageData>;

const pageMarkup: Record<PageKey, string> = {
  home: homeRaw,
  events: eventsRaw,
  about: aboutRaw,
  contact: contactRaw,
};

export function getPageData(key: PageKey): PageData {
  return pages[key];
}

export function getPageMarkup(key: PageKey): string {
  return pageMarkup[key];
}

export function getTransitionMarkup(): string {
  return transitionRaw;
}

export function getCrtMarkup(): string {
  return crtRaw;
}

export function normalizePath(pathname: string): string {
  let path = pathname.split("?")[0].split("#")[0];
  if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
  if (path.endsWith(".html")) path = path.slice(0, -".html".length);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/**
 * Server-rendered active state for the persistent navigation. The same logic
 * runs client-side after a Barba transition in /scripts/site.js.
 */
export function navForPath(pathname: string): string {
  const path = normalizePath(pathname);
  return navRaw.replace(/<a\b[^>]*>/g, (tag) => {
    const href = tag.match(/\bhref="([^"]*)"/)?.[1];
    if (href !== path) return tag;
    if (!/twostep-nav__(logo|link)/.test(tag)) return tag;

    let next = tag;
    if (!/\baria-current=/.test(next)) {
      next = next.slice(0, -1) + ' aria-current="page">';
    }
    next = next.replace(/class="([^"]*)"/, (_match, classes: string) =>
      classes.split(/\s+/).includes("w--current")
        ? `class="${classes}"`
        : `class="${classes} w--current"`,
    );
    return next;
  });
}
