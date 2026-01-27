# Card border normalization plan (Mobile)

This document is a step-by-step plan to make **all card-like surfaces** (Standards cards, Logs cards, Settings cards, panels, etc.) use a **uniform border thickness and border color** across the app in **both light and dark mode**.

It’s written so a junior dev can execute it safely and predictably.

## Goal

- **Uniform border appearance** across all “cards” in the mobile app.
- Borders must be **visibly present** (subtle, but consistently noticeable) in **light and dark mode**.
- Avoid per-screen “custom” borders; **one source of truth**.

## Definitions

### What counts as a “card”

A component/container is a “card” if it has **most** of these:

- Rounded corners (`borderRadius`)
- A surface background (`theme.background.card` or `theme.background.surface`)
- Often has elevation/shadow (`elevation`, `shadowOpacity`, etc.) or is used as a grouped container

Examples in this repo:

- `StandardCard` (Standards library)
- `StandardProgressCard` (Dashboard / ActivityHistory)
- `ActivityLogEntry` (Logs list)
- `SettingsScreen` grouped cards (Organization / Appearance)
- `ActivitySettingsScreen` / `CategorySettingsScreen` “section” containers
- `ActivityHistoryStatsPanel` (stats panel card)
- `PeriodHistoryList` rows (they look like cards but currently rely on shadow only)

## Current source-of-truth reference (Settings cards)

Settings “cards” are the best reference for the desired look. They use:

- **Border width**: `1`
- **Border color**: `theme.border.secondary`
- **Radius**: `12`
- **Overflow**: `hidden`

You can see the pattern in `apps/mobile/src/screens/SettingsScreen.tsx` (`styles.card`).

## Standard to adopt (v1)

For v1 normalization, use **exactly**:

- **Border width**: `1`
- **Border color**: `theme.border.secondary`

Rationale:

- This matches the Settings cards that already look correct.
- `StyleSheet.hairlineWidth` can be effectively invisible on some devices/backgrounds.

If later we want borders *slightly* stronger/weaker, we should do that by introducing a dedicated theme token (see “v2 improvements”).

## Implementation strategy (do this in order)

### Step 1 — Create a shared card style helper

Create a shared helper in one place so we stop re-implementing card borders differently everywhere.

Recommended location:

- `apps/mobile/src/theme/card.ts` (new file)

Export:

- `getCardBorderStyle(theme)` returns `{ borderWidth: 1, borderColor: theme.border.secondary }`
- Optionally `getCardContainerStyle(theme)` returns border + common radius/overflow defaults (but do not break existing radii if they’re intentionally different yet).

Example API:

- `getCardBorderStyle(theme)`
- `getCardBaseStyle({ radius })`

**Rules**

- The helper must not depend on React (keep it a pure function).
- It must not hardcode colors (always use `theme`).

### Step 2 — Migrate the main user-facing cards first

Update the following components to use the shared border style:

- `apps/mobile/src/components/StandardCard.tsx`
- `apps/mobile/src/components/StandardProgressCard.tsx`
- `apps/mobile/src/components/ActivityLogEntry.tsx`

Acceptance criteria:

- Borders are **clearly visible** in dark mode (subtle, but present).
- They match the Settings card border weight and tone.

Notes:

- These components currently have shadows/elevation; the border should not remove them.
- Avoid combining `opacity` changes that fade out borders excessively; if necessary, apply opacity to inner content rather than the container.

### Step 3 — Migrate “section cards” (grouped containers)

These are “cards” even when they contain rows:

- `apps/mobile/src/screens/SettingsScreen.tsx` (already correct, but convert to helper so it stays canonical)
- `apps/mobile/src/screens/ActivitySettingsScreen.tsx` (search container, section container)
- `apps/mobile/src/screens/CategorySettingsScreen.tsx` (section containers, dashed add button border may stay special)
- `apps/mobile/src/components/ActivityHistoryStatsPanel.tsx`

Acceptance criteria:

- These containers use the **same** border width and color as the “main cards”.

### Step 4 — Find and fix “card-like” rows that currently have no border

Example:

- `apps/mobile/src/components/PeriodHistoryList.tsx` currently has a shadow but no border.

Add the same border style so it matches.

### Step 5 — Audit: search + list all card-like containers

You must do a repo-wide audit so no random container stays inconsistent.

Run searches in `apps/mobile/src`:

1) `borderWidth: 1`
2) `StyleSheet.hairlineWidth`
3) `shadowOpacity:` and `elevation:` (to find card-like surfaces)
4) `backgroundColor: theme.background.card` and `backgroundColor: theme.background.surface`

For each hit, decide:

- **Card?** If yes, apply the shared border style (unless it’s intentionally special, like dashed borders for “Add” affordances).
- **Not a card?** Leave it.

Create a short checklist table in your PR description:

- File
- Component/style name
- Before (width/color)
- After (width/color)

### Step 6 — Visual QA checklist (must do in both themes)

On a simulator/device, check:

- **Settings**: Organization/Appearance cards still look right.
- **Standards**: Standards Library cards have the same border feel as Settings.
- **Dashboard**: Active Standards cards border is visible.
- **Logs**: Activity log entry cards border is visible.
- **History**: Scorecard/Period History cards border is visible.

If any card’s border is still hard to see:

- Confirm it is **`borderWidth: 1`** and **`theme.border.secondary`**.
- Confirm its container isn’t being faded with a parent `opacity` (that will also fade the border).

## Common pitfalls (read this before touching code)

- **Hairline width**: `StyleSheet.hairlineWidth` is not reliable for “subtle-but-visible” borders.
- **Opacity on container**: Applying `opacity: 0.6` to the card container will fade the border. Prefer fading inner content or using a different inactive style.
- **Mixing tokens**: Don’t use `theme.input.border` for cards; inputs and cards should not drift together.
- **One-off borders**: Don’t add special-case border colors in random screens. If you need a new visual standard, add a token.

## v2 improvements (optional, after v1 is stable)

If you want borders tuned per theme (especially in dark mode), add a dedicated token:

- Add `border.card` to the theme (`apps/mobile/src/theme/colors.ts`)
- Set:
  - Light: slightly darker than `border.secondary` if needed
  - Dark: slightly brighter than `border.secondary` if needed (without looking “outlined”)

Then update `getCardBorderStyle` to use `theme.border.card` instead of `theme.border.secondary`.

