"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { alpha } from "@mui/material/styles";
import type { StrapiSlideshow } from "@/types/cms";
import { getStrapiMediaUrl } from "@/lib/strapi";

type Props = {
  slideshow: StrapiSlideshow;
  /** Crossfade duration in milliseconds. Defaults to 1000 (1 second). */
  transitionMs?: number;
};

export function Slideshow({ slideshow, transitionMs = 1000 }: Props) {
  const slides = slideshow.slides ?? [];
  const [index, setIndex] = React.useState(0);
  const safeIndex = slides.length ? index % slides.length : 0;
  const active = slides[safeIndex];
  const isCarousel = slides.length > 1;
  const fadeMs = Math.max(0, transitionMs);

  React.useEffect(() => {
    if (!slideshow.autoplay || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, slideshow.intervalMs ?? 5000);
    return () => window.clearInterval(timer);
  }, [slideshow.autoplay, slideshow.intervalMs, slides.length, safeIndex]);

  if (!slides.length || !active?.media) return null;

  const goPrev = () =>
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((current) => (current + 1) % slides.length);

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label={slideshow.title || "Slideshow"}
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "primary.dark",
        color: "common.white",
        width: "100%",
        maxWidth: 1200,
        height: "80vh",
        maxHeight: 840,
        mx: "auto",
      }}
    >
      {slideshow.title ? (
        <Typography
          variant="overline"
          sx={{
            position: "absolute",
            top: 16,
            left: 20,
            zIndex: 2,
            opacity: 0.85,
          }}
        >
          {slideshow.title}
        </Typography>
      ) : null}

      <Box sx={{ position: "absolute", inset: 0 }}>
        {slides.map((slide, slideIndex) => {
          if (!slide.media) return null;
          const mediaUrl = getStrapiMediaUrl(slide.media.url);
          if (!mediaUrl) return null;
          const isVideo = slide.media.mime?.startsWith("video/");
          const activeSlide = slideIndex === safeIndex;

          return (
            <Box
              key={`${slide.id ?? mediaUrl}-${slideIndex}`}
              aria-hidden={!activeSlide}
              sx={{
                position: "absolute",
                inset: 0,
                opacity: activeSlide ? 1 : 0,
                transition: isCarousel ? `opacity ${fadeMs}ms ease` : "none",
                pointerEvents: activeSlide ? "auto" : "none",
              }}
            >
              {isVideo ? (
                <Box
                  component="video"
                  src={mediaUrl}
                  autoPlay={activeSlide}
                  muted
                  loop
                  playsInline
                  sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <Box
                  component="img"
                  src={mediaUrl}
                  alt={slide.altText || slide.caption || slideshow.title || ""}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              )}
            </Box>
          );
        })}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      </Box>

      {active.caption ? (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            p: 3.0,
            background: `linear-gradient(41deg, #00000030 0%, #00000075 32%, #00000000 77%)`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              position: "relative",
              maxWidth: 640,
              fontFamily: 'var(--font-body),"Helvetica Neue",Arial,sans-serif',
              lineHeight: "1.25rem",
              fontSize: "1.125rem",
              opacity: 1,
              transition: isCarousel ? `opacity ${fadeMs}ms ease` : "none",
            }}
          >
            {active.caption}
          </Typography>
        </Box>
      ) : null}

      {isCarousel ? (
        <>
          <IconButton
            aria-label="Previous slide"
            onClick={goPrev}
            sx={(theme) => ({
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "common.white",
              bgcolor: alpha(theme.palette.secondary.main, 1.0),
              "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.78) },
            })}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Next slide"
            onClick={goNext}
            sx={(theme) => ({
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "common.white",
              bgcolor: alpha(theme.palette.secondary.main, 1.0),
              "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.78) },
            })}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      ) : null}
    </Box>
  );
}
