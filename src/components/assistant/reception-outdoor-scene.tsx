import {
  PixelBush,
  PixelCloud,
  PixelGround,
  PixelRainbow,
  PixelSun,
  PixelTree,
} from "@/components/workplace/pixel-scenery";

const SKY_GRADIENT =
  "linear-gradient(180deg, var(--color-sky-top) 0%, var(--color-sky-mid) 55%, var(--color-sky-low) 100%)";

/** Outdoor sky + grass backdrop shared by login and Issue #5 reception. */
export function ReceptionOutdoorScene() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{ backgroundImage: SKY_GRADIENT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
      >
        <PixelSun
          className="pixel-sun-spin absolute top-6 right-8 sm:top-8 sm:right-10"
          size={72}
        />
        <PixelCloud className="absolute top-8 left-4 sm:left-6" size={112} />
        <PixelCloud className="absolute top-24 left-1/4" size={80} />
        <PixelCloud className="absolute top-12 right-1/5" size={96} />
        <PixelRainbow
          className="absolute top-12 left-1/2 -translate-x-1/2 opacity-90"
          size={300}
        />
        <PixelTree
          className="absolute bottom-[104px] left-4 sm:left-6"
          size={96}
        />
        <PixelTree
          className="absolute bottom-[104px] left-[18%] hidden sm:block"
          size={72}
        />
        <PixelBush className="absolute bottom-[104px] left-1/4" size={48} />
        <PixelBush
          className="absolute right-[38%] bottom-[104px] hidden md:block"
          size={40}
        />
        <PixelGround className="absolute inset-x-0 bottom-0" height={104} />
      </div>
    </>
  );
}
