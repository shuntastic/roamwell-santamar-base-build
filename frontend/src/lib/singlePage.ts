import type { CmsPage, NavItem } from '@/types/cms';

export type SinglePageSection = {
  page: CmsPage;
  /** DOM id used by header hash links. */
  anchor: string;
};

export type SinglePageComposition =
  | { mode: 'pages'; sections: SinglePageSection[] }
  | { mode: 'blocks'; page: CmsPage; anchors: string[] };

/** Navigation order. Equal `order` values keep the CMS list order. */
export function sortNavItems(items: NavItem[] | null | undefined): NavItem[] {
  return (items ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? 0) - (b.item.order ?? 0) || a.index - b.index)
    .map(({ item }) => item);
}

function slugFromPath(url?: string | null): string | null {
  if (!url || url.startsWith('http')) return null;
  const path = url.split('#')[0].replace(/^\/+|\/+$/g, '');
  if (!path) return null;
  return path;
}

function sanitizeAnchor(value: string): string {
  return value.trim().replace(/\s+/g, '-');
}

/**
 * Hash id for a nav item.
 * Prefers the CMS section anchor, then a hash URL, then the related page slug.
 */
export function sectionAnchorForNavItem(item: NavItem): string | null {
  const explicit = item.sectionAnchor?.trim();
  if (explicit) return sanitizeAnchor(explicit);

  if (item.url?.startsWith('#')) {
    const hash = item.url.slice(1).trim();
    if (hash) return sanitizeAnchor(hash);
  }

  const slug = item.page?.slug?.trim() || slugFromPath(item.url);
  if (!slug) return null;
  return slug === 'home' ? 'top' : sanitizeAnchor(slug);
}

/** Anchor a deep link such as `/en/gallery` should land on. */
export function anchorForPageSlug(
  slug: string,
  items: NavItem[] | null | undefined,
): string | null {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  const match = sortNavItems(items).find((item) => {
    if (item.page?.slug === normalized) return true;
    return slugFromPath(item.url) === normalized;
  });
  if (!match) return null;
  return sectionAnchorForNavItem(match);
}

function pageKey(page: CmsPage): string {
  return page.documentId || page.slug;
}

function linkedPage(
  item: NavItem,
  byDocumentId: Map<string, CmsPage>,
  bySlug: Map<string, CmsPage>,
): CmsPage | null {
  const related = item.page;
  if (related?.documentId) {
    const match = byDocumentId.get(related.documentId);
    if (match) return match;
  }
  if (related?.slug) {
    const match = bySlug.get(related.slug);
    if (match) return match;
  }
  const fromUrl = slugFromPath(item.url);
  if (fromUrl) return bySlug.get(fromUrl) ?? null;
  return null;
}

function claimAnchor(preferred: string, page: CmsPage, used: Set<string>): string {
  let anchor = sanitizeAnchor(preferred || (page.slug === 'home' ? 'top' : page.slug));
  if (!anchor) anchor = page.slug || 'section';
  if (used.has(anchor)) anchor = `${anchor}-${page.slug || 'page'}`;
  used.add(anchor);
  return anchor;
}

/**
 * Build the single-page view.
 * Pages linked from navigation render in that order. The home page leads when
 * it is not itself a nav item. A starter that only anchors blocks on one home
 * page keeps that block mapping.
 */
export function composeSinglePage(
  pages: CmsPage[],
  items: NavItem[] | null | undefined,
): SinglePageComposition | null {
  if (!pages.length) return null;

  const byDocumentId = new Map<string, CmsPage>();
  const bySlug = new Map<string, CmsPage>();
  for (const page of pages) {
    if (page.documentId) byDocumentId.set(page.documentId, page);
    if (page.slug) bySlug.set(page.slug, page);
  }

  const sorted = sortNavItems(items);
  const resolved = sorted
    .map((item) => ({ item, page: linkedPage(item, byDocumentId, bySlug) }))
    .filter((entry): entry is { item: NavItem; page: CmsPage } => Boolean(entry.page));

  const distinct = new Set(resolved.map((entry) => pageKey(entry.page)));
  const anchors = sorted
    .map((item) => sectionAnchorForNavItem(item))
    .filter((anchor): anchor is string => Boolean(anchor));

  const home = bySlug.get('home') ?? pages[0];
  const onlyHome =
    distinct.size === 0 || (distinct.size === 1 && resolved.every((entry) => pageKey(entry.page) === pageKey(home)));

  if (onlyHome && anchors.length) {
    return { mode: 'blocks', page: home, anchors };
  }

  const usedDocs = new Set<string>();
  const usedAnchors = new Set<string>();
  const sections: SinglePageSection[] = [];

  const homeIsLinked = resolved.some((entry) => pageKey(entry.page) === pageKey(home));
  if (home && !homeIsLinked) {
    sections.push({ page: home, anchor: claimAnchor('top', home, usedAnchors) });
    usedDocs.add(pageKey(home));
  }

  for (const entry of resolved) {
    const key = pageKey(entry.page);
    if (usedDocs.has(key)) continue;
    const anchor = sectionAnchorForNavItem(entry.item) || entry.page.slug;
    sections.push({
      page: entry.page,
      anchor: claimAnchor(anchor, entry.page, usedAnchors),
    });
    usedDocs.add(key);
  }

  const rest = pages
    .filter((page) => !usedDocs.has(pageKey(page)))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  for (const page of rest) {
    sections.push({
      page,
      anchor: claimAnchor(page.slug === 'home' ? 'top' : page.slug, page, usedAnchors),
    });
  }

  return { mode: 'pages', sections };
}
