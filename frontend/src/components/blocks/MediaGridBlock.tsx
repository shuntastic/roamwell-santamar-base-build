'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { alpha, useTheme } from '@mui/material/styles';
import type {
  BlocksMediaGrid,
  BlocksMediaGridCategory,
  BlocksMediaGridItem,
  MediaCategoryRef,
  StrapiMedia,
} from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksMediaGrid;
};

type GridItem = {
  key: string;
  src: string;
  posterSrc: string | null;
  isVideo: boolean;
  title: string;
  caption: string;
  alt: string;
  categories: Array<{ key: string; label: string }>;
  categoryKeys: string[];
};

const visuallyHidden = {
  border: 0,
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

const COLUMN_GAP_PX = 12;

function asArray<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function displayLabel(label: string) {
  return label.trim().replace(/\s+/g, ' ');
}

function categoryKey(label: string) {
  return displayLabel(label).toLowerCase();
}

/** Stable id for a Media Categories entry. Same document matches on the grid and on an item. */
function mediaCategoryKey(record: MediaCategoryRef, label: string) {
  if (record.documentId?.trim()) return record.documentId.trim();
  if (record.id != null) return `id:${record.id}`;
  return categoryKey(label);
}

function categoryRefs(category: BlocksMediaGridCategory | null | undefined) {
  const refs: Array<{ key: string; label: string }> = [];
  for (const record of asArray(category?.media_categories)) {
    const label = displayLabel(record.categoryname || '');
    if (!label) continue;
    refs.push({ key: mediaCategoryKey(record, label), label });
  }
  return refs;
}

function firstMedia(media: BlocksMediaGridItem['media']): StrapiMedia | null {
  const value = asArray(media)[0];
  if (!value?.url) return null;
  return value;
}

function isVideoMedia(media: StrapiMedia) {
  if (media.mime?.startsWith('video/')) return true;
  if (media.mime?.startsWith('image/')) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(media.url);
}

function resolveMaxColumns(value: number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(6, Math.max(1, Math.round(parsed)));
}

function prepareItems(items: BlocksMediaGrid['items']): GridItem[] {
  return asArray(items).flatMap((item, index) => {
    const media = firstMedia(item.media);
    const src = getStrapiMediaUrl(media?.url);
    if (!media || !src) return [];

    const poster = firstMedia(item.poster);
    const title = item.title?.trim() ?? '';
    const caption = item.caption?.trim() ?? '';
    const isVideo = isVideoMedia(media);
    const categories = asArray(item.categories).flatMap((category) => categoryRefs(category));
    const categoryKeys = [...new Set(categories.map((category) => category.key))];

    return [
      {
        key: `${item.id ?? index}-${src}`,
        src,
        posterSrc: getStrapiMediaUrl(poster?.url),
        isVideo,
        title,
        caption,
        alt: media.alternativeText?.trim() || title || (isVideo ? 'Video' : 'Image'),
        categories,
        categoryKeys,
      },
    ];
  });
}

function buildFilters(categories: BlocksMediaGrid['categories'], items: GridItem[]) {
  const seen = new Set<string>();
  const filters: Array<{ key: string; label: string }> = [];

  const push = (key: string, label: string) => {
    if (!key || !label || seen.has(key)) return;
    seen.add(key);
    filters.push({ key, label });
  };

  // Grid category order is the filter order editors set in the CMS.
  for (const category of asArray<BlocksMediaGridCategory>(categories)) {
    for (const ref of categoryRefs(category)) push(ref.key, ref.label);
  }

  if (!filters.length) {
    for (const item of items) {
      for (const category of item.categories) push(category.key, category.label);
    }
  }

  return filters;
}

function gridTemplateColumns(maxColumns: number, gapPx: number) {
  const minTrack = `max(10.5rem, calc((100% - ${gapPx * (maxColumns - 1)}px) / ${maxColumns}))`;
  return `repeat(auto-fill, minmax(min(100%, ${minTrack}), 1fr))`;
}

function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GridItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const theme = useTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const titleId = React.useId();
  const captionId = React.useId();
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const reduceMotionRef = React.useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const item = items[index];
  const total = items.length;
  const hasMany = total > 1;

  const setVideoNode = React.useCallback((node: HTMLVideoElement | null) => {
    if (!node || reduceMotionRef.current) return;
    node.muted = false;
    const play = node.play();
    if (!play) return;
    play.catch(() => {
      node.muted = true;
      node.play().catch(() => undefined);
    });
  }, []);

  const step = React.useCallback(
    (delta: number) => {
      if (total < 2) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, onIndexChange, total],
  );

  if (!item) return null;

  const showBar = Boolean(item.title || item.caption || hasMany);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (event.target instanceof HTMLElement && event.target.closest('video')) return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest('video, button')) return;
    pointer.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || !hasMany) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  };

  const controlSx = {
    color: 'primary.contrastText',
    bgcolor: alpha(theme.palette.primary.dark, 0.82),
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.contrastText, 0.4),
    width: 44,
    height: 44,
    '&:hover': { bgcolor: alpha(theme.palette.primary.dark, 0.94) },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.contrastText',
      outlineOffset: 2,
    },
  };

  return (
    <Dialog
      open
      onClose={onClose}
      onKeyDown={onKeyDown}
      aria-labelledby={titleId}
      aria-describedby={item.caption ? captionId : undefined}
      maxWidth={false}
      transitionDuration={reduceMotion ? 0 : 220}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: alpha(theme.palette.primary.dark, 0.94) },
        },
        paper: {
          sx: {
            bgcolor: 'transparent',
            backgroundImage: 'none',
            boxShadow: 'none',
            overflow: 'visible',
            m: { xs: 1.5, sm: 3 },
            width: 'min(1080px, calc(100vw - 32px))',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100% - 24px)',
          },
        },
      }}
    >
      <Box sx={visuallyHidden} aria-live="polite" aria-atomic="true">
        {`${index + 1} of ${total}. ${item.title || item.alt}`}
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: `${theme.layout.mediaGridRadius ?? theme.layout.cardRadius}px`,
          overflow: 'hidden',
          bgcolor: 'primary.dark',
          color: 'primary.contrastText',
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          autoFocus
          sx={{ ...controlSx, position: 'absolute', top: 12, right: 12, zIndex: 2 }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointer.current = null;
          }}
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            minHeight: { xs: 220, md: 320 },
            touchAction: 'pan-y',
          }}
        >
          {item.isVideo ? (
            <video
              key={item.key}
              ref={setVideoNode}
              controls
              playsInline
              poster={item.posterSrc ?? undefined}
              src={item.src}
              style={{
                display: 'block',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '70vh',
                background: 'transparent',
              }}
            />
          ) : (
            <Box
              key={item.key}
              component="img"
              src={item.src}
              alt=""
              draggable={false}
              sx={{
                display: 'block',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '70vh',
              }}
            />
          )}

          {hasMany ? (
            <>
              <IconButton
                aria-label="Previous media"
                onClick={() => step(-1)}
                sx={{
                  ...controlSx,
                  position: 'absolute',
                  left: { xs: 8, sm: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                aria-label="Next media"
                onClick={() => step(1)}
                sx={{
                  ...controlSx,
                  position: 'absolute',
                  right: { xs: 8, sm: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          ) : null}
        </Box>

        {showBar ? (
          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.75, md: 2.25 } }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
              {item.title ? (
                <Typography component="h2" variant="h5" id={titleId} sx={{ color: 'inherit', overflowWrap: 'anywhere' }}>
                  {item.title}
                </Typography>
              ) : (
                <Box component="h2" id={titleId} sx={visuallyHidden}>
                  {item.alt}
                </Box>
              )}
              {hasMany ? (
                <Typography variant="body2" sx={{ flexShrink: 0, opacity: 0.75 }}>
                  {index + 1} / {total}
                </Typography>
              ) : null}
            </Box>
            {item.caption ? (
              <Typography
                id={captionId}
                variant="body2"
                sx={{
                  mt: item.title ? 0.75 : 0,
                  color: 'inherit',
                  opacity: 0.9,
                  whiteSpace: 'pre-line',
                  overflowWrap: 'anywhere',
                }}
              >
                {item.caption}
              </Typography>
            ) : null}
          </Box>
        ) : (
          <Box component="h2" id={titleId} sx={visuallyHidden}>
            {item.alt}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

function MediaGridFrame({
  fullBleed,
  maxWidth,
  paddingY,
  intro,
  children,
}: {
  fullBleed: boolean;
  maxWidth: 'md' | 'lg' | 'xl';
  paddingY: { xs: number; md: number };
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!fullBleed) {
    return (
      <ThemeSection>
        {intro}
        {children}
      </ThemeSection>
    );
  }

  return (
    <Box component="section" sx={{ py: paddingY }}>
      {intro ? <Container maxWidth={maxWidth}>{intro}</Container> : null}
      {children}
    </Box>
  );
}

export function MediaGridBlock({ block }: Props) {
  const theme = useTheme();
  const headingId = React.useId();
  const gridId = React.useId();
  const items = React.useMemo(() => prepareItems(block.items), [block.items]);
  const filters = React.useMemo(() => buildFilters(block.categories, items), [block.categories, items]);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const showTitles = block.showItemTitles !== false;
  const maxColumns = resolveMaxColumns(block.maxColumns);
  const columnGapPx = theme.layout.mediaGridGap ?? COLUMN_GAP_PX;
  const radius = `${theme.layout.mediaGridRadius ?? theme.layout.cardRadius}px`;
  const fullBleed = theme.layout.mediaGridFullBleed === true;
  const titleOverlay = theme.layout.mediaGridTitle;
  const rowGap =
    theme.layout.mediaGridGap != null ? `${theme.layout.mediaGridGap}px` : showTitles ? 3 : `${COLUMN_GAP_PX}px`;

  React.useEffect(() => {
    if (filter !== null && !filters.some((entry) => entry.key === filter)) {
      setFilter(null);
    }
  }, [filter, filters]);

  const filtered = React.useMemo(
    () => (filter === null ? items : items.filter((item) => item.categoryKeys.includes(filter))),
    [filter, items],
  );

  React.useEffect(() => {
    if (activeIndex != null && activeIndex >= filtered.length) {
      setActiveIndex(null);
    }
  }, [activeIndex, filtered.length]);

  const activeFilter = filters.find((entry) => entry.key === filter);
  const status =
    filter === null
      ? `Showing all ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`
      : `Showing ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'} in ${activeFilter?.label ?? 'this category'}`;

  if (items.length === 0 && !block.title) return null;

  const intro =
    block.title || filters.length > 0 ? (
      <>
        {block.title ? (
          <Typography id={headingId} variant="h2" sx={{ mb: 3 }}>
            {block.title}
          </Typography>
        ) : null}

        {filters.length > 0 ? (
        <Box
          role="group"
          aria-label="Filter by category"
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}
        >
          <Button
            aria-pressed={filter === null}
            aria-controls={gridId}
            onClick={() => setFilter(null)}
            variant={filter === null ? 'contained' : 'outlined'}
            size="small"
            sx={{ px: 1.75, py: 0.65 }}
          >
            All
          </Button>
          {filters.map((entry) => {
            const selected = filter === entry.key;
            return (
              <Button
                key={entry.key}
                aria-pressed={selected}
                aria-controls={gridId}
                onClick={() => setFilter(entry.key)}
                variant={selected ? 'contained' : 'outlined'}
                size="small"
                sx={{ px: 1.75, py: 0.65 }}
              >
                {entry.label}
              </Button>
            );
          })}
        </Box>
      ) : null}
      </>
    ) : null;

  return (
    <MediaGridFrame
      fullBleed={fullBleed}
      maxWidth={theme.layout.contentMaxWidth}
      paddingY={theme.layout.sectionPaddingY}
      intro={intro}
    >
      <Box sx={visuallyHidden} aria-live="polite">
        {status}
      </Box>

      <Box
        component="ul"
        id={gridId}
        aria-labelledby={block.title ? headingId : undefined}
        aria-label={block.title ? undefined : 'Media'}
        sx={{
          listStyle: 'none',
          p: 0,
          m: 0,
          display: 'grid',
          alignItems: 'start',
          columnGap: `${columnGapPx}px`,
          rowGap,
          // Keep every tile the same width, including a short last row, and never exceed maxColumns.
          gridTemplateColumns: gridTemplateColumns(maxColumns, columnGapPx),
        }}
      >
        {filtered.length === 0 ? (
          <Box component="li" sx={{ gridColumn: '1 / -1', m: 0 }}>
            <Typography color="text.secondary">No media in this category.</Typography>
          </Box>
        ) : null}
        {filtered.map((item, index) => (
          <Box component="li" key={item.key} sx={{ minWidth: 0, m: 0 }}>
            <Box
              component="button"
              type="button"
              aria-label={item.isVideo ? `Play ${item.title || item.alt}` : `View ${item.title || item.alt}`}
              onClick={() => setActiveIndex(index)}
              sx={{
                display: 'block',
                width: '100%',
                p: 0,
                m: 0,
                border: 0,
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                bgcolor: 'transparent',
                cursor: 'pointer',
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 4,
                  borderRadius: radius,
                },
                '@media (prefers-reduced-motion: no-preference)': {
                  '& img, & video': { transition: 'transform 500ms ease' },
                  '&:hover img, &:hover video': { transform: 'scale(1.035)' },
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  overflow: 'hidden',
                  borderRadius: radius,
                  bgcolor: 'action.hover',
                }}
              >
                {item.isVideo && !item.posterSrc ? (
                  <Box
                    component="video"
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={item.posterSrc || item.src}
                    alt=""
                    draggable={false}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {item.isVideo ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'primary.contrastText',
                      bgcolor: alpha(theme.palette.primary.dark, 0.55),
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <PlayArrowIcon />
                  </Box>
                ) : null}
                {titleOverlay && showTitles && item.title ? (
                  <Box
                  sx={{
                    position: 'absolute',
                    zIndex: 1,
                    left: 0,
                    bottom: 0,
                    bgcolor: titleOverlay.background,
                    width: "100%",
                  }}
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        maxWidth: titleOverlay.maxWidth,
                        m: 0,
                        px: 1.25,
                        pt: 0.75,
                        pb: 0.6,
                        color: 'text.primary',
                        lineHeight: 1.35,
                        display: 'block',
                        textWrap: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxHeight: '40px',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
              {!titleOverlay && showTitles && item.title ? (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    mt: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </Typography>
              ) : null}
            </Box>
          </Box>
        ))}
      </Box>

      {activeIndex != null && filtered[activeIndex] ? (
        <MediaLightbox
          items={filtered}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      ) : null}
    </MediaGridFrame>
  );
}
