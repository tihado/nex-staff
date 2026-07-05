"use client";

import { Fragment, type ReactNode, useMemo } from "react";
import { useAgentWander } from "@/hooks/use-agent-wander";
import { cn } from "@/lib/utils";
import {
  initialWanderAnchorForStaff,
  OFFICE_WANDER_CONFIG,
  PANTRY_WANDER_CONFIG,
} from "@/lib/workplace/wander";
import {
  STAFF_IDLE_PANTRY_RETURN_CHANCE,
  STAFF_IDLE_WORKPLACE_VISIT_CHANCE,
} from "@/lib/workplace/wander-config";
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
  PixelDeskIso,
  PixelFilingCabinetIso,
  PixelFridgeIso,
  PixelLoungeChairIso,
  PixelMugIso,
  PixelPlantIso,
  PixelRoomPartitionIso,
  PixelSofaIso,
  PixelTeaTableIso,
  PixelVendingIso,
  PixelWaterCoolerIso,
  PixelWhiteboardIso,
} from "./office-sprites-iso";
import { PixelAssistant } from "./pixel-scenery";
import { WorkspaceAgent } from "./workspace-agent";
import { WorkspaceDeskCell } from "./workspace-desk";
import {
  ARCHIVE_ROOM,
  MEETING_ROOM,
  PANTRY_CAFE_CLUSTERS,
  PANTRY_LOWER_PROPS,
  pantryAnchorForIndex,
  RECEPTION_ROOM,
  TASK_BOARD_ZONE,
  WORKSPACE_BOOKSHELVES,
  WORKSPACE_CORRIDOR_PROPS,
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
  workspaceDeskSlot,
} from "./workspace-layout";
import { WorkspaceOfficeCat } from "./workspace-office-cat";
import {
  ExtrudedWallHorizontal,
  ExtrudedWallVertical,
  WorkspaceScene,
} from "./workspace-scene";
import { WorkspaceZoneCell } from "./workspace-zone-cell";

export type WorkspaceZone = "archive" | "meeting" | "taskboard";

interface WorkspaceFloorProps {
  assistantName: string;
  desks: WorkspaceDesk[];
  onHire: (deskId: string) => void;
  onSelectAgent: (desk: WorkspaceDesk) => void;
  onSelectReception: () => void;
  onSelectZone: (zone: WorkspaceZone) => void;
  pendingCompletionCount?: number;
}

const WOOD_FLOOR =
  "repeating-linear-gradient(0deg, #B8814A 0px, #B8814A 14px, #9A6634 14px, #9A6634 16px)";
const ARCHIVE_FLOOR =
  "repeating-linear-gradient(0deg, #E8DCC8 0px, #E8DCC8 14px, #D4C4A8 14px, #D4C4A8 16px)";
const PANTRY_FLOOR =
  "repeating-linear-gradient(0deg, #FAF6EE 0px, #FAF6EE 15px, #E8DCC8 15px, #E8DCC8 16px), repeating-linear-gradient(90deg, #FAF6EE 0px, #FAF6EE 15px, #E8DCC8 15px, #E8DCC8 16px)";
const RECEPTION_FLOOR =
  "repeating-linear-gradient(0deg, #3A7294 0px, #3A7294 15px, #2A5878 15px, #2A5878 16px), repeating-linear-gradient(90deg, #3A7294 0px, #3A7294 15px, #2A5878 15px, #2A5878 16px)";
const MEETING_FLOOR =
  "repeating-linear-gradient(0deg, #4A88A8 0px, #4A88A8 14px, #3A7294 14px, #3A7294 16px), repeating-linear-gradient(90deg, #4A88A8 0px, #4A88A8 14px, #3A7294 14px, #3A7294 16px)";

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

function meetingPropSprite(type: "partition" | "plant") {
  if (type === "plant") {
    return <PixelPlantIso size={26} />;
  }
  return <PixelRoomPartitionIso size={36} />;
}

function receptionPropSprite(type: "bookshelf" | "plant") {
  if (type === "bookshelf") {
    return <PixelBookshelfIso size={44} />;
  }
  return <PixelPlantIso size={30} />;
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

export function WorkspaceFloor({
  assistantName,
  desks,
  pendingCompletionCount = 0,
  onHire,
  onSelectAgent,
  onSelectReception,
  onSelectZone,
}: WorkspaceFloorProps) {
  let pantryCounter = 0;

  const idlePantryStaffIds = useMemo(
    () =>
      desks
        .filter(
          (desk) =>
            desk.staffId && desk.location === "pantry" && desk.state === "idle"
        )
        .map((desk) => desk.staffId as string),
    [desks]
  );

  const { onStaffArrived, reducedMotion, wanderAnchors, wanderZones } =
    useAgentWander(idlePantryStaffIds, PANTRY_WANDER_CONFIG, {
      alternateConfig: OFFICE_WANDER_CONFIG,
      alternateVisitChance: STAFF_IDLE_WORKPLACE_VISIT_CHANCE,
      primaryReturnChance: STAFF_IDLE_PANTRY_RETURN_CHANCE,
    });

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
          className="absolute shadow-[inset_0_0_20px_rgba(0,0,0,0.25)]"
          style={{
            background: MEETING_FLOOR,
            height: `${MEETING_ROOM.bounds.height}%`,
            left: `${MEETING_ROOM.bounds.left}%`,
            top: `${MEETING_ROOM.bounds.top}%`,
            width: `${MEETING_ROOM.bounds.width}%`,
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

        {/* Meeting room — furniture first, zone sign at entrance (no duplicate table) */}
        <FloorProp left={MEETING_ROOM.rug.left} top={MEETING_ROOM.rug.top}>
          <PixelRug size={MEETING_ROOM.rug.size} />
        </FloorProp>
        <FloorProp left={MEETING_ROOM.table.left} top={MEETING_ROOM.table.top}>
          <PixelMeetingTable size={56} />
        </FloorProp>
        {MEETING_ROOM.chairs.map((chair) => (
          <FloorProp key={chair.id} left={chair.left} top={chair.top}>
            <PixelOfficeChair size={24} />
          </FloorProp>
        ))}
        {MEETING_ROOM.props.map((prop) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            {meetingPropSprite(prop.type)}
          </FloorProp>
        ))}
        <WorkspaceZoneCell
          anchor={MEETING_ROOM.anchor}
          ariaLabel="Open the meeting room"
          label="Meeting"
          onClick={() => onSelectZone("meeting")}
        >
          <PixelWhiteboardIso size={36} />
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
          badgeCount={pendingCompletionCount}
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

        <WorkspaceOfficeCat motionEnabled />

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

        {/* Reception — centered desk + grouped waiting lounge */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-[78%] flex-col items-center gap-1"
          style={{
            left: `${RECEPTION_ROOM.desk.left}%`,
            top: `${RECEPTION_ROOM.desk.top}%`,
            zIndex: Math.round(
              RECEPTION_ROOM.desk.left + RECEPTION_ROOM.desk.top
            ),
          }}
        >
          <PixelWoodSign className="relative z-20 shrink-0" label="Reception" />
          <PixelDeskIso size={76} />
          <button
            aria-label={`Talk to ${assistantName} at reception`}
            className="group relative z-10 mt-1 flex flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
            onClick={onSelectReception}
            type="button"
          >
            <PixelAssistant
              className="transition-transform group-hover:scale-110"
              size={52}
            />
            <span className="border-2 border-wood bg-panel px-1 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
              {assistantName}
            </span>
          </button>
        </div>

        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{
            left: `${RECEPTION_ROOM.waiting.anchor.left}%`,
            top: `${RECEPTION_ROOM.waiting.anchor.top}%`,
            zIndex: Math.round(
              RECEPTION_ROOM.waiting.anchor.left +
                RECEPTION_ROOM.waiting.anchor.top
            ),
          }}
        >
          <PixelRug
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-[40%]"
            size={RECEPTION_ROOM.waiting.rug.size}
          />
          <PixelTeaTableIso size={RECEPTION_ROOM.waiting.teaTable.size} />
          <PixelSofaIso
            className="mt-1"
            size={RECEPTION_ROOM.waiting.sofa.size}
          />
        </div>

        {RECEPTION_ROOM.props.map((prop) => (
          <FloorProp key={prop.id} left={prop.left} top={prop.top}>
            {receptionPropSprite(prop.type)}
          </FloorProp>
        ))}

        {/* Staff desks */}
        {desks.map((desk, index) => {
          const slot = workspaceDeskSlot(desk.id);

          return (
            <WorkspaceDeskCell
              anchor={slot?.anchor ?? WORKSPACE_DESK_SLOTS[index].anchor}
              desk={desk}
              key={desk.id}
              onHire={onHire}
              onSelectAgent={onSelectAgent}
              variant={index}
            />
          );
        })}

        {/* Pantry — task complete, waiting for acknowledgement */}
        {desks.map((desk, index) => {
          if (
            !desk.staffId ||
            desk.location !== "pantry" ||
            desk.state !== "done"
          ) {
            return null;
          }

          const slot = workspaceDeskSlot(desk.id);
          const anchor = pantryAnchorForIndex(pantryCounter);
          pantryCounter += 1;

          return (
            <WorkspaceAgent
              anchor={anchor}
              desk={desk}
              key={`${desk.id}-pantry-done`}
              motionEnabled
              onSelect={onSelectAgent}
              variant={index}
              walkOriginAnchor={slot?.agentAnchor}
            />
          );
        })}

        {/* Idle staff — mostly pantry, occasionally work area */}
        {desks.map((desk, index) => {
          if (
            !desk.staffId ||
            desk.location !== "pantry" ||
            desk.state !== "idle"
          ) {
            return null;
          }

          const slot = workspaceDeskSlot(desk.id);
          const zone = wanderZones[desk.staffId] ?? "pantry";
          const wanderConfig =
            zone === "workplace" ? OFFICE_WANDER_CONFIG : PANTRY_WANDER_CONFIG;
          const anchor =
            wanderAnchors[desk.staffId] ??
            initialWanderAnchorForStaff(desk.staffId, wanderConfig);

          return (
            <WorkspaceAgent
              anchor={anchor}
              desk={desk}
              key={`${desk.id}-idle`}
              motionEnabled={!reducedMotion}
              onSelect={onSelectAgent}
              onStaffArrived={onStaffArrived}
              variant={index}
              walkOriginAnchor={slot?.agentAnchor}
            />
          );
        })}
      </div>
    </WorkspaceScene>
  );
}
