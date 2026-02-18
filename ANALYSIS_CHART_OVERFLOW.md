
## Analysis of Horizontal Overflow in `EnhancedTradingChart`

The "chart box exploding out" on mobile is caused by **non-responsive toolbar containers** and a **lack of robust resize logic** for the chart itself.

### 1. Resizing Logic (Chart Canvas)
- **Current:** Uses `window.addEventListener('resize', ...)` in `EHancedTradingChart.tsx`.
- **Problem:** This only reacts to window size changes. It doesn't handle container resizing (e.g., when sidebars toggle or on initial layout pass).
- **Fix:** Implement a `ResizeObserver` on the chart container `div` to call `chart.resize()` whenever the container's dimensions change.

### 2. Toolbar Overflow (The "Explosion")
The main cause of the visual overflow is the toolbar components:

- **`DrawingToolsPanel.tsx`**:
  - **Issue:** Uses `<div className="flex items-center gap-1 ...">`. This forces all tool icons into a single row. On mobile, the width of all icons > screen width, causing the parent container to stretch.
  - **Fix:** Add `flex-wrap` to the container and/or make it scrollable with `overflow-x-auto`.

- **`ChartControls.tsx`**:
  - **Issue:** The tool buttons group `<div className="flex gap-2">` does not wrap.
  - **Fix:** Add `flex-wrap` to this inner container as well.

### 3. Hardcoded Widths
- The chart container uses `h-[450px] sm:h-[60vh]`. This is fine for height.
- `w-full` is used, which is correct, but the chart instance needs to be told to resize to match this width.

---

## Recommended Fixes

### Step 1: Fix `DrawingToolsPanel.tsx` (Critical)
Make the drawing tools wrap or scroll on mobile.

### Step 2: Fix `ChartControls.tsx`
Allow the button groups to wrap.

### Step 3: Implement `ResizeObserver` in `useKLineChart.ts`
Ensure the chart canvas matches its container size robustly.

I will now apply these fixes.
