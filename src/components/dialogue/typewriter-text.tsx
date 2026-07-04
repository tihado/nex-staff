"use client";

import { useEffect, useRef, useState } from "react";

const MS_PER_CHAR = 30;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);

    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}

interface TypewriterTextProps {
  onComplete: () => void;
  skip?: boolean;
  text: string;
}

export function TypewriterText({
  text,
  skip = false,
  onComplete,
}: TypewriterTextProps) {
  const [count, setCount] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reducedMotion || skip) {
      setCount(text.length);
      return;
    }

    if (count >= text.length) {
      return;
    }

    const id = setTimeout(() => {
      setCount((current) => Math.min(current + 1, text.length));
    }, MS_PER_CHAR);

    return () => clearTimeout(id);
  }, [count, text, skip, reducedMotion]);

  const done = count >= text.length;

  useEffect(() => {
    if (done) {
      onCompleteRef.current();
    }
  }, [done]);

  return (
    <span aria-live="polite">
      {text.slice(0, count)}
      {done ? null : <span className="cursor-blink">{"\u2588"}</span>}
    </span>
  );
}
