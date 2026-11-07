"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type PointerEvent, type Ref } from "react";
import { createMorphRenderer, type MorphRenderer } from "@/components/car/morph-renderer";
import { cn } from "@/lib/utils";

type Photo = { src: string; alt: string };
export type MorphGalleryHandle = { show: (index: number) => void; prepare: () => void };
type Props = {
  photos: Photo[];
  label: string;
  onActiveChange: (index: number) => void;
  ref: Ref<MorphGalleryHandle>;
};

const SWIPE_THRESHOLD_PX = 48;
const arrowStyle =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-card-foreground shadow-sm transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-ring";

// The parent can call show() (e.g. when a colour is picked) and hears back through
// onActiveChange, so every change of photo goes through the same dissolve.
export function MorphGallery({ photos, label, onActiveChange, ref }: Props) {
  const t = useTranslations("Gallery");
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [morphing, setMorphing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // undefined: not set up yet; null: WebGL unavailable, so photos cross-fade instead.
  const renderer = useRef<MorphRenderer | null | undefined>(undefined);
  const swipeStart = useRef<number | null>(null);

  useEffect(() => () => renderer.current?.dispose(), []);

  // The shader and its textures load only once the buyer shows interest, so the first
  // paint is a plain optimised image.
  const prepareMorph = () => {
    if (renderer.current !== undefined || !canvasRef.current) return;
    renderer.current = createMorphRenderer(canvasRef.current, photos.map((photo) => photo.src));
  };

  const show = (requested: number) => {
    const next = (requested + photos.length) % photos.length;
    if (next === active || morphing) return;
    prepareMorph();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion && renderer.current?.canMorph(active, next)) {
      setMorphing(true);
      renderer.current.play(active, next, requested > active ? 1 : -1).then(() => setMorphing(false));
    }
    setPrevious(active);
    setActive(next);
    onActiveChange(next);
  };

  useImperativeHandle(ref, () => ({ show, prepare: prepareMorph }));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") show(active - 1);
    if (event.key === "ArrowRight") show(active + 1);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) > SWIPE_THRESHOLD_PX) show(active + (distance < 0 ? 1 : -1));
  };

  if (photos.length === 0) return <div className="aspect-[16/10] rounded-2xl bg-muted" />;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        className="relative aspect-[16/10] touch-pan-y overflow-hidden rounded-2xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onPointerEnter={prepareMorph}
        onFocus={prepareMorph}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => (swipeStart.current = event.clientX)}
        onPointerUp={onPointerUp}
      >
        {photos.map((photo, index) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={index === active ? photo.alt : ""}
            aria-hidden={index !== active}
            fill
            preload={index === 0}
            sizes="(min-width: 1024px) 58vw, 100vw"
            // The outgoing photo stays opaque underneath while the new one fades in on
            // top, so the fallback fade never dips through to the background.
            className={cn(
              "object-cover",
              index === active && "z-[1] opacity-100 transition-opacity duration-300 motion-reduce:transition-none",
              index === previous && "opacity-100",
              index !== active && index !== previous && "opacity-0",
            )}
          />
        ))}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 z-[2] size-full", !morphing && "invisible")}
        />
        {photos.length > 1 && (
          <>
            <button type="button" aria-label={t("previous")} className={cn(arrowStyle, "left-3")} onClick={() => show(active - 1)}>
              <ChevronLeftIcon className="size-5" />
            </button>
            <button type="button" aria-label={t("next")} className={cn(arrowStyle, "right-3")} onClick={() => show(active + 1)}>
              <ChevronRightIcon className="size-5" />
            </button>
            <p className="absolute right-3 bottom-3 z-10 rounded-full bg-card/90 px-2.5 py-1 text-sm text-card-foreground tabular-nums">
              {active + 1} / {photos.length}
            </p>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <ul className="flex gap-2">
          {photos.map((photo, index) => (
            <li key={photo.src}>
              <button
                type="button"
                aria-label={t("show", { number: index + 1 })}
                aria-current={index === active}
                onClick={() => show(index)}
                className={cn(
                  "relative block h-14 w-20 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-16 sm:w-24",
                  index === active ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={photo.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {t("live", { current: active + 1, total: photos.length })}
      </p>
    </div>
  );
}
