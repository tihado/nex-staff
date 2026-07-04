"use client";

import { Fragment, type ReactNode } from "react";
import { PixelIcon } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { depthZ } from "./iso-projection";
import { PixelBlackboard, PixelRug, PixelWoodSign } from "./office-sprites";
import {
  PixelBarCounterIso,
  PixelBookshelfIso,
  PixelCafeTableIso,
  PixelCatIso,
  PixelClockIso,
  PixelFridgeIso,
  PixelLoungeChairIso,
  PixelPlantIso,
  PixelVendingIso,
  PixelWaterCoolerIso,
} from "./office-sprites-iso";
import { PixelAssistant } from "./pixel-scenery";
import { WorkspaceAgent } from "./workspace-agent";
import { WorkspaceDeskCell, WorkspaceHireDeskCell } from "./workspace-desk";
import {
  PANTRY_CAFE_CLUSTERS,
  pantryAnchorForIndex,
  RECEPTION_ANCHOR,
  WORKSPACE_BOOKSHELVES,
  WORKSPACE_DESK_SLOTS,
  WORKSPACE_EXTRA_HIRE_DESKS,
  type WorkspaceDesk,
} from "./workspace-layout";
import {
  ExtrudedWallHorizontal,
  ExtrudedWallVertical,
  WorkspaceScene,
} from "./workspace-scene";

export type WorkspaceZone = "archive" | "taskboard";

interface WorkspaceFloorProps {
  assistantName: string;
  desks: WorkspaceDesk[];
  hasDoneDesk?: boolean;
  onHire: (deskId: string) => void;
  onSelectAgent: (desk: WorkspaceDesk) => void;
  onSelectReception: () => void;
  onSelectZone: (zone: WorkspaceZone) => void;
}

const WOOD_FLOOR =
  "repeating-linear-gradient(0deg, #B8814A 0px, #B8814A 14px, #9A6634 14px, #9A6634 16px)";
const PANTRY_FLOOR =
  "repeating-linear-gradient(0deg, #FAF6EE 0px, #FAF6EE 15px, #E8DCC8 15px, #E8DCC8 16px), repeating-linear-gradient(90deg, #FAF6EE 0px, #FAF6EE 15px, #E8DCC8 15px, #E8DCC8 16px)";
const RECEPTION_FLOOR =
  "repeating-linear-gradient(0deg, #3A7294 0px, #3A7294 15px, #2A5878 15px, #2A5878 16px), repeating-linear-gradient(90deg, #3A7294 0px, #3A7294 15px, #2A5878 15px, #2A5878 16px)";

interface FloorProp {
  children: ReactNode;
  className?: string;
  left: number;
  top: number;
}

/** Decor z-index cap — keeps floor props below zone buttons (z-100). */
const DECOR_Z_CAP = 40;

/** Non-interactive decor placed by percentage anchor on the floor. */
function FloorProp({ children, className, left, top }: FloorProp) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-[78%] select-none",
        className
      )}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        zIndex: Math.min(depthZ(left, top), DECOR_Z_CAP),
      }}
    >
      {children}
    </div>
  );
}

export function WorkspaceFloor({
  assistantName,
  desks,
  hasDoneDesk = false,
  onHire,
  onSelectAgent,
  onSelectReception,
  onSelectZone,
}: WorkspaceFloorProps) {
  let pantryCounter = 0;

  return (
    <WorkspaceScene>
      <div className="relative h-full w-full overflow-hidden bg-[#121218]">
        {/* Room floors — full bleed, edge-to-edge with the frame */}
        <div
          className="absolute inset-y-0 left-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]"
          style={{ background: WOOD_FLOOR, width: "58%" }}
        />
        <div
          className="absolute top-0 right-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.2)]"
          style={{ background: PANTRY_FLOOR, height: "42%", width: "42%" }}
        />
        <div
          className="absolute right-0 bottom-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]"
          style={{ background: RECEPTION_FLOOR, height: "58%", width: "42%" }}
        />

        {/* Ambient depth gradient overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,transparent_35%,rgba(0,0,0,0.22)_100%)]"
        />

        {/* Extruded 3D walls between rooms */}
        <ExtrudedWallVertical left="58%" />
        <ExtrudedWallHorizontal left="58%" top="42%" width="42%" />

        {/* Room signs */}
        <FloorProp left={28} top={8}>
          <PixelWoodSign label="Work Area" />
        </FloorProp>
        <FloorProp left={79} top={8}>
          <PixelWoodSign label="Pantry" />
        </FloorProp>
        <FloorProp left={79} top={52}>
          <PixelWoodSign label="Reception" />
        </FloorProp>

        {/* Work area — bookshelves along walls */}
        {WORKSPACE_BOOKSHELVES.map((shelf) => (
          <FloorProp key={shelf.id} left={shelf.left} top={shelf.top}>
            <PixelBookshelfIso size={shelf.size} />
          </FloorProp>
        ))}
        <FloorProp left={6} top={86}>
          <PixelPlantIso size={38} />
        </FloorProp>
        <FloorProp left={50} top={88}>
          <PixelPlantIso size={36} />
        </FloorProp>
        <FloorProp left={4} top={60}>
          <PixelPlantIso size={30} />
        </FloorProp>
        <FloorProp left={52} top={62}>
          <PixelPlantIso size={28} />
        </FloorProp>
        <FloorProp className="animate-bounce" left={36} top={56}>
          <PixelCatIso size={32} />
        </FloorProp>

        {/* Extra for-hire desks */}
        {WORKSPACE_EXTRA_HIRE_DESKS.map((desk) => (
          <WorkspaceHireDeskCell
            anchor={desk}
            deskId={desk.id}
            key={desk.id}
            onHire={onHire}
          />
        ))}

        {/* Pantry — vending, water cooler, bar, fridge */}
        <FloorProp left={68} top={12}>
          <PixelVendingIso size={38} />
        </FloorProp>
        <FloorProp left={76} top={14}>
          <PixelWaterCoolerIso size={30} />
        </FloorProp>
        <FloorProp left={92} top={12}>
          <PixelFridgeIso size={34} />
        </FloorProp>
        <FloorProp left={84} top={6}>
          <PixelClockIso size={28} />
        </FloorProp>
        <FloorProp left={78} top={18}>
          <PixelBarCounterIso size={92} />
        </FloorProp>

        {/* Pantry — cafe tables + chairs */}
        {PANTRY_CAFE_CLUSTERS.map((cluster) => (
          <Fragment key={cluster.id}>
            <FloorProp left={cluster.table.left} top={cluster.table.top}>
              <PixelCafeTableIso size={cluster.table.size} />
            </FloorProp>
            {cluster.chairs.map((chair) => (
              <FloorProp key={chair.id} left={chair.left} top={chair.top}>
                <PixelLoungeChairIso size={chair.size ?? 28} />
              </FloorProp>
            ))}
          </Fragment>
        ))}

        {/* Reception lounge seating */}
        <FloorProp left={68} top={62}>
          <PixelCafeTableIso size={52} />
        </FloorProp>
        <FloorProp left={64} top={66}>
          <PixelLoungeChairIso size={34} />
        </FloorProp>
        <FloorProp left={72} top={68}>
          <PixelLoungeChairIso size={34} />
        </FloorProp>
        <FloorProp left={92} top={60}>
          <PixelBookshelfIso size={52} />
        </FloorProp>
        <FloorProp left={72} top={86}>
          <PixelCatIso size={30} />
        </FloorProp>

        {/* Archive zone (top-left) — above all floor decor */}
        <button
          aria-label="Open the archive room"
          className="group absolute top-3 left-3 z-[100] flex flex-col items-center gap-1 rounded-sm border-2 border-transparent border-dashed bg-black/15 p-2 hover:border-wood hover:bg-black/25 focus-visible:outline-2 focus-visible:outline-pixel-accent"
          onClick={() => onSelectZone("archive")}
          type="button"
        >
          <PixelIcon className="text-panel" name="archive" size={36} />
          <PixelWoodSign label="Archive" />
        </button>

        {/* Task Board zone — top-right of work area, clear of back-wall shelves */}
        <button
          aria-label="Open the task board"
          className="group absolute top-3 z-[100] flex flex-col items-center rounded-sm border-2 border-transparent border-dashed p-2 hover:border-wood hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-pixel-accent"
          onClick={() => onSelectZone("taskboard")}
          style={{ left: "36%" }}
          type="button"
        >
          <span className="relative inline-flex flex-col items-center">
            <PixelBlackboard size={80} />
            <div className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2">
              <PixelWoodSign label="Task Board" />
            </div>
            {hasDoneDesk ? (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 z-20 flex size-5 animate-bounce items-center justify-center rounded-full border-2 border-wood bg-alert font-[family-name:var(--font-pixel)] text-[10px] text-white"
              >
                !
              </span>
            ) : null}
          </span>
        </button>

        {/* Desk furniture layer */}
        {desks.map((desk, index) => (
          <WorkspaceDeskCell
            anchor={WORKSPACE_DESK_SLOTS[index].anchor}
            desk={desk}
            key={desk.id}
            onHire={onHire}
          />
        ))}

        {/* Agent layer (occupied desks + pantry walk) */}
        {desks.map((desk, index) => {
          if (!desk.staffId) {
            return null;
          }

          const slot = WORKSPACE_DESK_SLOTS[index];
          const anchor =
            desk.location === "pantry"
              ? pantryAnchorForIndex(pantryCounter++)
              : slot.agentAnchor;

          return (
            <WorkspaceAgent
              anchor={anchor}
              desk={desk}
              key={desk.id}
              onSelect={onSelectAgent}
              variant={index}
            />
          );
        })}

        {/* Reception / meeting room */}
        <button
          aria-label={`Talk to ${assistantName} at reception`}
          className={cn(
            "group absolute z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
          )}
          onClick={onSelectReception}
          style={{
            left: `${RECEPTION_ANCHOR.left}%`,
            top: `${RECEPTION_ANCHOR.top}%`,
          }}
          type="button"
        >
          <PixelRug className="absolute top-6 -z-10" size={92} />
          <PixelAssistant
            className="transition-transform group-hover:scale-110"
            size={56}
          />
          <span className="border-2 border-wood bg-panel px-1 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
            {assistantName}
          </span>
        </button>
      </div>
    </WorkspaceScene>
  );
}
