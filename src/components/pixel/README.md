# Pixel design system

Shared 8-bit UI primitives for Nex Staff. **Do not** build feature UI with one-off borders, colors, or fonts — compose from these components.

**Spec:** [docs/UI-UX.md](../../docs/UI-UX.md)

## Usage

Wrap game screens in `GameShell` (applies pixel tokens via `.game-shell`):

```tsx
import { GameShell } from "@/components/layout";
import { PixelPanel, PixelDialogueBox } from "@/components/pixel";

<GameShell>
  <PixelDialogueBox speakerName="Assistant">...</PixelDialogueBox>
</GameShell>
```

## Components

| Component | Purpose |
|-----------|---------|
| `PixelPanel` | RPG panel — 4px white border + 4px shadow |
| `PixelButton` | Pixel-styled action button |
| `PixelChoice` / `PixelChoiceMenu` | RPG choice rows with keyboard nav |
| `PixelDialogueBox` | Name plate + body + advance prompt |
| `PixelHUD` | Top bar with title and action buttons |
| `PixelNotification` | Quest-complete banner |
| `PixelProgressBar` | Segmented or solid progress |
| `PixelCloseButton` | Consistent `[X]` close control |

## Tokens

Defined in `src/styles/pixel-tokens.css` (scoped to `.game-shell`). Use Tailwind aliases: `bg-bg-scene`, `text-pixel-accent`, `font-[family-name:var(--font-pixel)]`, etc.

## Rules

| ✅ Do | ❌ Don't |
|-------|---------|
| Compose from `Pixel*` components | Chat bubbles |
| Use design tokens | Hardcode hex colors |
| One active dialogue box | Scrollable message list as main UI |
| Keyboard nav on choices | shadcn for main game UI |

## Demo

Run `pnpm dev` and open `/design-system` (dev only, hidden in production).

## Anti-patterns

See [UI-UX.md — Anti-patterns](../../docs/UI-UX.md#anti-patterns-tránh). PRs for #5, #8, #9, #14, #15 must pass this checklist.
