"use client";

import { useCallback, useEffect, useState } from "react";
import { PixelChoice } from "@/components/pixel";
import type { DialogueChoice } from "@/hooks/use-dialogue-engine";

const MAX_VISIBLE = 4;

interface ChoiceMenuProps {
  choices: DialogueChoice[];
  onSelect: (choiceId: string) => void;
}

/** RPG choice menu: arrow-key navigation + Enter, `role="menu"` (issue #5). */
export function ChoiceMenu({ choices, onSelect }: ChoiceMenuProps) {
  const [selected, setSelected] = useState(0);
  const visible = choices.slice(0, MAX_VISIBLE);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "s") {
        event.preventDefault();
        setSelected((index) => (index + 1) % visible.length);
      } else if (event.key === "ArrowUp" || event.key === "w") {
        event.preventDefault();
        setSelected((index) => (index - 1 + visible.length) % visible.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const choice = visible[selected];

        if (choice) {
          onSelect(choice.id);
        }
      }
    },
    [visible, selected, onSelect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      aria-label="Dialogue choices"
      className="flex flex-col gap-2"
      role="menu"
    >
      {visible.map((choice, index) => (
        <PixelChoice
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          onMouseEnter={() => setSelected(index)}
          selected={index === selected}
        >
          {choice.shortcut ? (
            <span className="mr-2 text-pixel-text-muted">
              {choice.shortcut}
            </span>
          ) : null}
          {choice.label}
        </PixelChoice>
      ))}
    </div>
  );
}
