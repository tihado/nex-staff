"use client";

import { PixelIcon } from "@/components/pixel";
import type { TaskOutputItem } from "@/lib/tasks/output-items";

interface TaskOutputListProps {
  items: TaskOutputItem[];
  onSelectItem: (item: TaskOutputItem) => void;
}

function outputIcon(kind: TaskOutputItem["kind"]): string {
  return kind === "deliverable" ? "file" : "notes";
}

export function TaskOutputList({ items, onSelectItem }: TaskOutputListProps) {
  if (items.length === 0) {
    return (
      <p className="font-body text-[18px] text-ink-muted italic">
        No rewards yet — deliverables appear when the quest completes.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            className="flex w-full items-center gap-3 border-2 border-wood bg-panel px-3 py-2.5 text-left transition-colors hover:bg-[#fff9c4] focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
            onClick={() => onSelectItem(item)}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center border-2 border-wood-dark bg-bg-dialogue text-ink">
              <PixelIcon name={outputIcon(item.kind)} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-[family-name:var(--font-pixel)] text-[7px] text-ink-muted uppercase">
                {item.kind === "deliverable" ? "Deliverable" : "Draft"}
              </span>
              <span className="block truncate font-body text-[18px] text-ink">
                {item.title}
              </span>
              {item.subtitle ? (
                <span className="mt-0.5 block truncate font-body text-[15px] text-ink-muted">
                  {item.subtitle}
                </span>
              ) : null}
            </span>
            <PixelIcon
              className="shrink-0 text-ink-muted"
              name="chevron-right"
              size={16}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
