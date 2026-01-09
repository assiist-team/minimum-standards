# Period Progress Overage Visualization Bug

## Summary
- **Impacted area:** `ActivityVolumeCharts` → `PeriodProgressChart` in the Activity History screen.
- **Symptom (original):** Periods where `actual > goal` appeared capped at the goal height; overflow color segments and goal markers sometimes failed to render, so users could not tell they exceeded the standard.
- **Status (Jan 8, 2026):** First scaling change (global max-based) shipped but showed no visual difference on device. Follow-up fixes now (a) scale bar height by each period’s standard, (b) draw over-goal amounts using a capped overflow band, and (c) remove the protruding goal marker / gray track so the bar renders as a single column with color shift at the standard threshold—pending verification.

## Expected vs. Actual (pre-fix)
| Expectation | Previous Actual |
| --- | --- |
| Each bar fills to `actualHeight`, with the portion above the goal highlighted and no clipping. | Some bars never rendered the overflow segment—the entire bar still topped out at the goal, making over-goal periods indistinguishable. |
| A slim goal marker stays visible even when overflow is present so the exact target is obvious. | Goal marker occasionally hidden underneath the actual bar when overflow should appear. |

## Current Behavior (post-change observation)
- Bars **before** the latest fix continued to render at identical heights regardless of the period standard.
- Overflow segments remained invisible even when `actual > goal`, so there was no brighter cap above the target line.
- Goal marker frequently aligned with the top of the bar, implying the layout was still being clamped to the goal height instead of the computed `actualHeight`.

**Note:** A new implementation (Jan 8) now:
- Scales bar height exclusively from each period’s minimum standard so relative heights should match standard ratios (e.g., 40 vs 80 ⇒ 1:2).
- Fills progress up to the goal within that base height and renders overflow using the same unit scale but capped at 25% of chart height to avoid clipping.
 - Shows the goal as a subtle on-bar track (darker neutral background capped to the standard height) so unmet periods still have a visible reference line without extending outside the bar.

Need to confirm whether this change resolves the issue on physical devices.

## Jan 8 Retest Notes
- Device: iPhone 15 Pro (iOS 17.4 beta) physical device, production data account ending in `…328`.
- Standard comparison: Period A goal = 40, Period B goal = 80 → rendered heights looked identical.
- Over-goal example: Period C logged 92 against goal 60; UI still capped at the goal line with no overflow tint.
- Conclusion: no perceptible visual change in the chart after deploying the **first** scaling update.
- Action: apply new build (with per-standard scaling + capped overflow) and repeat the above measurements.

## Reproduction Steps
1. Log activity to exceed the period goal (e.g., goal = 50 units, log 65 units).
2. Ensure the app bundle includes the latest scaling changes (Jan 8, 2026 build).
3. Open `Activity History` → select the *Period Progress* chart.
4. Compare a low-standard period with a high-standard period:
   - Expected now: bar heights differ proportionally and overflow shows as a brighter cap above the goal marker.
   - Previous behavior: both bars appeared the same height and over-goal periods lacked overflow highlighting.

## Investigation Recap
- Refactored the bar layout to compute pixel heights for goal, base fill, and overflow segments (`ActivityVolumeCharts.tsx`, `PeriodProgressChart`).  
- Added a dedicated `stackedBar` wrapper and absolute-positioned layers so overflow could extend beyond the goal container without clipping.  
- Introduced `status.met.barOverflow` in `theme/colors.ts` for brighter overage visualization and removed borders on the overflow layer for clarity.  
- Latest iteration swaps the scaling logic to use a single `maxScaleValue` across `goal` and `actual`, and grows the bar container to include the overflow portion so Android no longer clips the extra segment.

## Open Questions / Next Steps
1. **Verify latest fix:** rebuild the app (clearing Metro cache) and retest on iOS + Android to confirm:
   - Bar heights differ by standard.
   - Overflow cap appears when `actual > goal`.
   - Goal reference track is visible but confined within the bar bounds; no protruding line/halo remains. Updated to use a darker shade for better visibility in light mode.
2. **Inspect layout constraints (if still broken):** use React Native Inspector to check for ancestor clipping or unexpected `overflow: hidden`.
3. **Runtime logging:** emit `goalValue`, `actualValue`, `baseHeight`, and `overflowHeight` to confirm the math during a live session.
4. **Storybook / screenshot test:** render mocked periods (e.g., goals 40 & 80) via Storybook to visually lock in the intended behavior and catch regressions.

## References
- Implementation details: `apps/mobile/src/components/ActivityVolumeCharts.tsx`
- Theme tokens: `apps/mobile/src/theme/colors.ts`
