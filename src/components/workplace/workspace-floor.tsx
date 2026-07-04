"use client";

import { Fragment, type ReactNode, useMemo } from "react";
import { useAgentWander } from "@/hooks/use-agent-wander";
import { cn } from "@/lib/utils";
import { initialWanderAnchorForStaff } from "@/lib/workplace/wander";
import { depthZ } from "./iso-projection";
import {
  PixelMeetingTable,
  PixelOfficeChair,
  PixelRug,
  PixelWoodSign,
} from "./office-sprites";
import {
  PixelArchiveShelfIso,
  PixelBarCounterIso,
  PixelBookshelfIso,
  PixelCafeTableIso,
  PixelClockIso,
  PixelFilingCabinetIso,
  PixelFridgeIso,
  PixelLoungeChairIso,
  PixelMugIso,
  PixelPlantIso,
  PixelRoomPartitionIso,
  PixelVendingIso,
  PixelWaterCoolerIso,
  PixelWhiteboardIso,
} from "./office-sprites-iso";
import { PixelAssistant } from "./pixel-scenery";
import { WorkspaceAgent } from "./workspace-agent";
import { WorkspaceDeskCell } from "./workspace-desk";
import {
  ARCHIVE_ROOM,
  type FloorAnchor,
  PANTRY_CAFE_CLUSTERS,
  PANTRY_LOWER_PROPS,
  pantryAnchorForIndex,
  RECEPTION_ANCHOR,
  RECEPTION_EXTRA_PROPS,
  RECEPTION_MEETING,
  TASK_BOARD_ZONE,
  WORKSPACE_BOOKSHELVES,
  WORKSPACE_CORRIDOR_PROPS,
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "./workspace-layout";
import { WorkspaceOfficeCat } from "./workspace-office-cat";
import {
  ExtrudedWallHorizontal,
  ExtrudedWallVertical,
  WorkspaceScene,
} from "./workspace-scene";
import { WorkspaceZoneCell } from "./workspace-zone-cell";

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
const ARCHIVE_FLOOR =
  "repeating-linear-gradient(0deg, #E8DCC8 0px, #E8DCC8 14px, #D4C4A8 14px, #D4C4A8 16px)";
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

const DECOR_Z_CAP = 40;

function archivePropSprite(index: number) {
  if (index < 2) {
    return <PixelFilingCabinetIso size={34} />;
  }
  if (index < 4) {
    return <PixelArchiveShelfIso size={44} />;
  }
  return <PixelRoomPartitionIso size={40} />;
}

function pantryLowerPropSprite(type: "chair" | "mug" | "plant") {
  if (type === "chair") {
    return <PixelLoungeChairIso size={26} />;
  }
  if (type === "mug") {
    return <PixelMugIso size={22} />;
  }
  return <PixelPlantIso size={28} />;
}

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

function resolveAgentAnchor(
  desk: WorkspaceDesk,
  slotIndex: number,
  pantryIndex: number,
  wanderAnchors: Record<string, FloorAnchor>,
  reducedMotion: boolean
) {
  if (desk.location === "pantry") {
    return pantryAnchorForIndex(pantryIndex);
  }

  if (desk.location === "roaming" && desk.staffId && !reducedMotion) {
    return (
      wanderAnchors[desk.staffId] ?? initialWanderAnchorForStaff(desk.staffId)
    );
  }

  return WORKSPACE_DESK_SLOTS[slotIndex].agentAnchor;
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

  const roamingStaffIds = useMemo(
    () =>
      desks
        .filter((desk) => desk.staffId && desk.location === "roaming")
        .map((desk) => desk.staffId as string),
    [desks]
  );

  const { onStaffArrived, reducedMotion, wanderAnchors } =
    useAgentWander(roamingStaffIds);

  return (
    <WorkspaceScene>
      <div className="relative h-full w-full overflow-hidden bg-[#121218]">
        {/* Room floors */}
        <div
          className="absolute inset-y-0 left-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]"
          style={{ background: WOOD_FLOOR, width: "58%" }}
        />
        <div
          className="absolute shadow-[inset_0_0_16px_rgba(0,0,0,0.15)]"
          style={{
            background: ARCHIVE_FLOOR,
            height: `${ARCHIVE_ROOM.bounds.height}%`,
            left: `${ARCHIVE_ROOM.bounds.left}%`,
            top: `${ARCHIVE_ROOM.bounds.top}%`,
            width: `${ARCHIVE_ROOM.bounds.width}%`,
          }}
        />
        <div
          className="absolute top-0 right-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.2)]"
          style={{ background: PANTRY_FLOOR, height: "42%", width: "42%" }}
        />
        <div
          className="absolute right-0 bottom-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]"
          style={{ background: RECEPTION_FLOOR, height: "58%", width: "42%" }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,transparent_35%,rgba(0,0,0,0.22)_100%)]"
        />

        <ExtrudedWallVertical left="58%" />
        <ExtrudedWallHorizontal left="58%" top="42%" width="42%" />

        <FloorProp left={32} top={8}>
          <PixelWoodSign label="Work Area" />
        </FloorProp>
        <FloorProp left={79} top={8}>
          <PixelWoodSign label="Pantry" />
        </FloorProp>
        <FloorProp left={79} top={52}>
          <PixelWoodSign label="Reception" />
        </FloorProp>

        {/* Archive room props */}
        {ARCHIVE_ROOM.props.map((prop, index) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            {archivePropSprite(index)}
          </FloorProp>
        ))}

        <WorkspaceZoneCell
          anchor={ARCHIVE_ROOM.anchor}
          ariaLabel="Open the archive room"
          label="Archive"
          onClick={() => onSelectZone("archive")}
        >
          <PixelArchiveShelfIso size={40} />
        </WorkspaceZoneCell>

        {/* Task board whiteboard */}
        <FloorProp
          left={TASK_BOARD_ZONE.wallAnchor.left}
          top={TASK_BOARD_ZONE.wallAnchor.top}
        >
          <PixelWhiteboardIso size={56} />
        </FloorProp>

        <WorkspaceZoneCell
          anchor={TASK_BOARD_ZONE.anchor}
          ariaLabel="Open the task board"
          badge={hasDoneDesk}
          label="Task Board"
          onClick={() => onSelectZone("taskboard")}
        >
          <PixelWhiteboardIso size={48} />
        </WorkspaceZoneCell>

        {/* Work area bookshelves + corridor */}
        {WORKSPACE_BOOKSHELVES.map((shelf) => (
          <FloorProp key={shelf.id} left={shelf.left} top={shelf.top}>
            <PixelBookshelfIso size={shelf.size} />
          </FloorProp>
        ))}
        {WORKSPACE_CORRIDOR_PROPS.map((prop) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            <PixelPlantIso size={30} />
          </FloorProp>
        ))}

        <WorkspaceOfficeCat motionEnabled={!reducedMotion} />

        {/* Pantry upper */}
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

        {PANTRY_LOWER_PROPS.map((prop) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            {pantryLowerPropSprite(prop.type)}
          </FloorProp>
        ))}

        {/* Reception meeting area */}
        <FloorProp
          left={RECEPTION_MEETING.table.left}
          top={RECEPTION_MEETING.table.top}
        >
          <PixelMeetingTable size={72} />
        </FloorProp>
        {RECEPTION_MEETING.chairs.map((chair) => (
          <FloorProp key={chair.id} left={chair.left} top={chair.top}>
            <PixelOfficeChair size={28} />
          </FloorProp>
        ))}
        {RECEPTION_EXTRA_PROPS.map((prop) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            {prop.type === "bookshelf" ? (
              <PixelBookshelfIso size={48} />
            ) : (
              <PixelPlantIso size={32} />
            )}
          </FloorProp>
        ))}

        {/* Staff desks */}
        {desks.map((desk, index) => (
          <WorkspaceDeskCell
            anchor={WORKSPACE_DESK_SLOTS[index].anchor}
            desk={desk}
            key={desk.id}
            onHire={onHire}
          />
        ))}

        {/* Agents */}
        {desks.map((desk, index) => {
          if (!desk.staffId) {
            return null;
          }

          const anchor = resolveAgentAnchor(
            desk,
            index,
            pantryCounter,
            wanderAnchors,
            reducedMotion
          );

          if (desk.location === "pantry") {
            pantryCounter += 1;
          }

          return (
            <WorkspaceAgent
              anchor={anchor}
              desk={desk}
              key={desk.id}
              motionEnabled={!reducedMotion}
              onSelect={onSelectAgent}
              onStaffArrived={onStaffArrived}
              variant={index}
              walkOriginAnchor={
                desk.location === "roaming"
                  ? WORKSPACE_DESK_SLOTS[index].agentAnchor
                  : undefined
              }
            />
          );
        })}

        {/* Reception assistant */}
        <button
          aria-label={`Talk to ${assistantName} at reception`}
          className="group absolute z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
          onClick={onSelectReception}
          style={{
            left: `${RECEPTION_ANCHOR.left}%`,
            top: `${RECEPTION_ANCHOR.top}%`,
          }}
          type="button"
        >
          <PixelRug className="absolute top-6 -z-10" size={80} />
          <PixelAssistant
            className="transition-transform group-hover:scale-110"
            size={52}
          />
          <span className="border-2 border-wood bg-panel px-1 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
            {assistantName}
          </span>
        </button>
      </div>
    </WorkspaceScene>
  );
}
