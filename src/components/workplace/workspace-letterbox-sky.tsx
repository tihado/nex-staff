import { PixelCloud, PixelSun } from "./pixel-scenery";

const SKY_GRADIENT =
  "linear-gradient(180deg, var(--color-sky-top) 0%, var(--color-sky-mid) 55%, var(--color-sky-low) 100%)";

/** Matches GameShell letterboxed panel footprint for margin-relative placement. */
const PANEL_FRAME_CLASS =
  "relative min-h-0 w-full max-h-[calc(100dvh-2rem)] max-w-[calc((100dvh-2rem)*16/9)] flex-none aspect-video";

/** Sun and clouds in the GameShell letterbox margins around the workspace floor. */
export function WorkspaceLetterboxSky() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden select-none lg:flex lg:items-center lg:justify-center lg:p-4"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: SKY_GRADIENT }}
      />

      <div className={PANEL_FRAME_CLASS}>
        <PixelSun
          className="pixel-sun-spin absolute top-[14%] -left-[4.25rem] sm:-left-[5rem]"
          size={52}
        />
        <PixelCloud className="absolute -top-8 left-[30%]" size={72} />
        <PixelCloud className="absolute top-[6%] -right-[4.5rem]" size={64} />
        <PixelCloud className="absolute top-[48%] -right-[4rem]" size={72} />
        <PixelCloud className="absolute -bottom-7 left-[14%]" size={56} />
        <PixelCloud className="absolute -bottom-6 -left-[3.5rem]" size={64} />
        <PixelCloud
          className="absolute -right-[4.5rem] bottom-[22%]"
          size={52}
        />
      </div>
    </div>
  );
}
