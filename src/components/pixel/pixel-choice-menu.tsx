"use client";

import { useChoiceMenu } from "@/hooks/use-choice-menu";
import { cn } from "@/lib/utils";
import { PixelChoice } from "./pixel-choice";

export interface PixelChoiceOption {
  id: string;
  label: string;
}

interface PixelChoiceMenuProps {
  choices: PixelChoiceOption[];
  className?: string;
  enabled?: boolean;
  onSelect: (choiceId: string) => void;
}

export function PixelChoiceMenu({
  choices,
  onSelect,
  className,
  enabled = true,
}: PixelChoiceMenuProps) {
  const { selectedIndex, setSelectedIndex, handleKeyDown } = useChoiceMenu({
    choiceCount: choices.length,
    onSelect: (index) => {
      const choice = choices[index];
      if (choice) {
        onSelect(choice.id);
      }
    },
    enabled,
  });

  if (choices.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Choices"
      className={cn(
        "flex flex-col border-2 border-border-dialogue bg-bg-dialogue",
        className
      )}
      onKeyDown={handleKeyDown}
      role="menu"
      tabIndex={enabled ? 0 : -1}
    >
      {choices.map((choice, index) => (
        <PixelChoice
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          onFocus={() => setSelectedIndex(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          selected={index === selectedIndex}
        >
          {choice.label}
        </PixelChoice>
      ))}
    </div>
  );
}
