"use client";

import { useState } from "react";
import { GameShell, OverlayStack } from "@/components/layout";
import {
  PixelButton,
  PixelChoiceMenu,
  type PixelChoiceOption,
  PixelCloseButton,
  PixelDialogueBox,
  PixelHUD,
  PixelNotification,
  PixelPanel,
  PixelProgressBar,
} from "@/components/pixel";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = [
  { name: "bg-scene", className: "bg-bg-scene", hex: "#1A0F3D" },
  { name: "bg-dialogue", className: "bg-bg-dialogue", hex: "#0F0829" },
  { name: "border-dialogue", className: "bg-border-dialogue", hex: "#F0F0F0" },
  { name: "pixel-accent", className: "bg-pixel-accent", hex: "#7EC8E3" },
  { name: "highlight", className: "bg-highlight", hex: "#FFE66D" },
  { name: "success", className: "bg-success", hex: "#4ECDC4" },
  { name: "alert", className: "bg-alert", hex: "#FF6B6B" },
  { name: "text-primary", className: "bg-text-primary", hex: "#F0F0F0" },
  { name: "text-muted", className: "bg-text-muted", hex: "#8888AA" },
  { name: "nameplate-bg", className: "bg-nameplate-bg", hex: "#2D1B69" },
  { name: "choice-bg", className: "bg-choice-bg", hex: "#1E3A5F" },
  { name: "choice-hover", className: "bg-choice-hover", hex: "#7EC8E3" },
] as const;

const DEMO_CHOICES: PixelChoiceOption[] = [
  { id: "hire", label: "Yes, hire Content Writer" },
  { id: "later", label: "No, maybe later" },
  { id: "explain", label: "Explain more about this role" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-pixel-accent uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showOverlayDemo, setShowOverlayDemo] = useState(false);

  return (
    <GameShell letterbox>
      <PixelHUD
        actions={[
          { id: "log", label: "[Log]" },
          { id: "settings", label: "[⚙]" },
        ]}
        subtitle="Design System — dev only"
        title="NEX STAFF"
      />

      <main className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4 lg:p-6">
        <Section title="Colors">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_SWATCHES.map((swatch) => (
              <div
                className="flex flex-col gap-1 border-2 border-border-dialogue p-2"
                key={swatch.name}
              >
                <div
                  className={cn(
                    "h-10 border border-border-dialogue",
                    swatch.className
                  )}
                />
                <span className="font-[family-name:var(--font-pixel)] text-[8px] text-text-muted">
                  {swatch.name}
                </span>
                <span className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary">
                  {swatch.hex}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <PixelPanel className="p-4">
            <p className="font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-text-primary">
              Press Start 2P — Name plate, choices, HUD
            </p>
            <p className="mt-3 font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary leading-[var(--line-height-dialogue)]">
              VT323 22px — Dialogue body text for NPC lines and descriptions.
            </p>
          </PixelPanel>
        </Section>

        <Section title="PixelPanel">
          <div className="grid gap-4 lg:grid-cols-2">
            <PixelPanel className="p-4">
              <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)]">
                Panel without title bar. 4px white border + 4px dark shadow.
              </p>
            </PixelPanel>
            <PixelPanel className="p-4 pt-6" title="ARCHIVE ROOM">
              <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)]">
                Panel with optional title bar.
              </p>
            </PixelPanel>
          </div>
        </Section>

        <Section title="PixelButton">
          <div className="flex flex-wrap items-center gap-3">
            <PixelButton>Default</PixelButton>
            <PixelButton disabled>Disabled</PixelButton>
            <PixelCloseButton />
          </div>
        </Section>

        <Section title="PixelChoiceMenu (keyboard: ↑↓ / W-S / Enter)">
          <PixelChoiceMenu
            choices={DEMO_CHOICES}
            onSelect={(id) => setSelectedChoice(id)}
          />
          {selectedChoice ? (
            <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-highlight">
              Selected: {selectedChoice}
            </p>
          ) : null}
        </Section>

        <Section title="PixelDialogueBox">
          <PixelDialogueBox
            portrait={
              <div className="sprite flex size-24 items-center justify-center border-4 border-border-dialogue bg-nameplate-bg text-5xl">
                🤖
              </div>
            }
            speakerName="Assistant"
          >
            Hi boss! What do you need today?
            <span className="pixel-cursor-blink">█</span>
          </PixelDialogueBox>
        </Section>

        <Section title="PixelProgressBar">
          <div className="grid gap-4 lg:grid-cols-3">
            <PixelProgressBar label="0%" value={0} />
            <PixelProgressBar label="45%" value={45} />
            <PixelProgressBar label="100%" value={100} />
          </div>
        </Section>

        <Section title="PixelNotification">
          <div className="flex flex-col items-start gap-3">
            <PixelButton
              onClick={() => setShowNotification(true)}
              type="button"
            >
              Show quest complete
            </PixelButton>
            {showNotification ? (
              <PixelNotification
                message="Alex has finished!"
                onDismiss={() => setShowNotification(false)}
                title="QUEST COMPLETE"
              />
            ) : null}
          </div>
        </Section>

        <Section title="GameShell + OverlayStack">
          <PixelButton onClick={() => setShowOverlayDemo(true)} type="button">
            Open overlay demo
          </PixelButton>
          {showOverlayDemo ? (
            <div className="relative mt-2 h-48 border-2 border-border-dialogue">
              <OverlayStack>
                <OverlayStack.Layer id="scene">
                  <div className="flex h-full items-center justify-center bg-bg-scene font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)]">
                    Workspace scene (dimmed when overlay active)
                  </div>
                </OverlayStack.Layer>
                <OverlayStack.Layer id="overlay">
                  <div className="flex h-full items-center justify-center p-4">
                    <PixelPanel className="w-full max-w-sm p-4" title="OVERLAY">
                      <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)]">
                        Modal overlay with 50% backdrop.
                      </p>
                      <div className="mt-4 flex justify-end">
                        <PixelButton
                          onClick={() => setShowOverlayDemo(false)}
                          type="button"
                        >
                          Close
                        </PixelButton>
                      </div>
                    </PixelPanel>
                  </div>
                </OverlayStack.Layer>
              </OverlayStack>
            </div>
          ) : null}
        </Section>
      </main>
    </GameShell>
  );
}
