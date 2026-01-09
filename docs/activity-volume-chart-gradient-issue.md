## Cumulative Volume Gradient Mismatch

### Summary
- Recent UI update added an `react-native-svg`–based fill under the cumulative volume line inside `apps/mobile/src/components/ActivityVolumeCharts.tsx`.
- On device the filled region does not follow the plotted line; portions of the gradient either lag behind or extend beyond the curve, making the chart look misaligned.

### Reproduction
1. Install the latest mobile app build (includes the gradient change).
2. Launch the Activity History screen and select the **Cumulative Volume** tab.
3. Observe the rendered line vs. the translucent area behind it.

### Expected vs Actual
- **Expected:** The gradient area should sit flush beneath the polyline, sharing the exact contour and touching the x‑axis at the same points.
- **Actual:** The polygon rendered by `Path d={areaPath}` drifts away from the line. This is most visible near the origin and towards the right edge where the fill either starts before the plotted point or stops short.

### Current Implementation Notes
- The chart still relies on a row of `TouchableOpacity` wrappers to simulate points. Each slot width is dynamic (`slotSpacing`) based on compression.
- `areaPath` is computed using wrapper widths plus a global gap, but the math assumes every slot shares identical offsets. Origin points with negative margins and compressed layouts with horizontal scroll create coordinate mismatches.
- The `<Svg>` overlay is absolutely positioned with a fixed `width` and `height`, independent of the inner children’s computed layout, so any discrepancy in slot widths or horizontal padding manifests as a visual offset.

### Hypotheses / Next Steps
1. **Coordinate space mismatch:** `areaPath` calculates points using `currentX + wrapperWidth / 2 + gap`, but the actual rendered x-position also includes each wrapper’s `marginHorizontal`. Need to derive coordinates from onLayout measurements or reuse the same iterator that positions `lineSegment`.
2. **Origin adjustment:** The synthetic zero point shifts left via `marginLeft: -wrapperWidth/2`, yet `areaPath` only subtracts half the wrapper width once. Confirm that compressed mode and first real data point share the same basis.
3. **SVG sizing:** The gradient overlay width is `(length - 1) * slotSpacing + wrapperWidth`, but the horizontal ScrollView also adds padding. The SVG may need to span `effectiveData.length * (wrapperWidth + gap * 2)` or simply stretch to 100% and rely on absolute coordinates within a `viewBox`.
4. Consider re-implementing the line using `react-native-svg` entirely (polyline + gradient) to guarantee shared coordinates, reducing the risk of divergence between DOM-driven layout and SVG overlay math.

### Status
- Issue reproducible on iOS simulator/device immediately after enabling the gradient.
- Need to decide whether to adjust the math for the existing view-based approach or to migrate the cumulative chart to a pure-SVG implementation for accuracy.
