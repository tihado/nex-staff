"use client";

import { useCallback, useEffect, useState } from "react";

interface UseChoiceMenuOptions {
  choiceCount: number;
  enabled?: boolean;
  onSelect: (index: number) => void;
}

export function useChoiceMenu({
  choiceCount,
  onSelect,
  enabled = true,
}: UseChoiceMenuOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= choiceCount) {
      setSelectedIndex(Math.max(0, choiceCount - 1));
    }
  }, [choiceCount, selectedIndex]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : choiceCount - 1));
  }, [choiceCount]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < choiceCount - 1 ? prev + 1 : 0));
  }, [choiceCount]);

  const confirm = useCallback(() => {
    if (choiceCount > 0) {
      onSelect(selectedIndex);
    }
  }, [choiceCount, onSelect, selectedIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || choiceCount === 0) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault();
          moveUp();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault();
          moveDown();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          confirm();
          break;
        default:
          break;
      }
    },
    [choiceCount, confirm, enabled, moveDown, moveUp]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
