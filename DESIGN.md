# Design System: AI Trading Frontend
**Project ID:** local-ai-trading-frontend

## 1. Visual Theme & Atmosphere
The AI Trading Frontend features a **Futuristic, High-Tech Financial Terminal** atmosphere. The mood is highly professional, data-dense, yet visually sleek and modern. It leans heavily into **Glassmorphism**, taking advantage of translucent surfaces (`backdrop-filter` blurs), complex mesh gradients, and subtle noise overlays to create incredible depth above a "void" black background. The overall aesthetic feels like a sophisticated, next-generation web3 or institutional trading platform where information hierarchy is established through lighting (glowing shadows) rather than harsh lines.

## 2. Color Palette & Roles

* **Void Black (OKLCH 0 0 0 / #000000):** Used for the absolute background (`--background`), creating infinite depth and contrast.
* **Abyssal Slate (HSL 240 5.9% 10%):** Used as the underlying solid foundation for sidebars (`--sidebar-background`) and deep panels.
* **Electric Cobalt (HSL 222 89% 56% / #1E50F3):** The primary brand highlight (`--brand`). Used for key interactive elements, glowing cursor effects, and primary call-to-action buttons.
* **Warning Amber / Gold (HSL 42 94% 55% / #F59E0B):** The secondary brand power color (`--brand-2`, `--sa-accent-strong`). Used to draw immediate attention, highlight strong borders, signal warnings, and create striking gradient buttons.
* **Frosted Deep Sea (rgba(15, 24, 39, 0.78)):** The predominant surface color for glass cards (`--sa-surface`). Translucent and layered over the Void Black background.
* **Emerald Growth (HSL 156 72% 40%):** The success indicator (`--success`), used to represent positive price action, bullish sentiment, and successful system notifications.
* **Alert Crimson (OKLCH 0.6 0.25 15):** The destructive indicator (`--destructive`), used for negative price action, bearish sentiment, and system warnings.
* **Starlight White (OKLCH 1 0 0 / #FFFFFF):** Used for primary typography (`--foreground`) to maintain absolute legibility against the dark void.

## 3. Typography Rules

* **Headings (Display):** Uses **Sora**, a geometric sans-serif, with tight letter-spacing (`-0.02em`) and bold (`font-bold`, `font-semibold`) weights to create sharp, authoritative section titles.
* **Body (Legibility):** Uses **Manrope** (`font-sans`), replacing standard sans for improved UI readability at smaller sizes. Applied in standard weights with comfortable line-height (`1.55`).
* **Metrics & Financial Data (Tabular):** Uses a monospaced font stack (falling back to **Geist Mono** or system ui-monospace) configured with `lining-nums tabular-nums` to ensure that price displays, tables, and financial metrics align perfectly in vertical columns without jittering.

## 4. Component Stylings

* **Buttons:** Feature subtly rounded corners (`rounded-md`, 6px radius). The visual style varies by intent: standard buttons employ solid semantic fills, while interactive "gradient" hero buttons feature an Electric Cobalt to Warning Amber gradient edge accompanied by an intense glowing drop shadow. "Glass" buttons utilize `backdrop-filter: blur(12px)` and translucent white borders.
* **Cards/Containers:** Express the core glassmorphic identity of the app. They utilize generous corner rounding (`rounded-lg` or 16px radii) and feature complex background treatments. A typical "trading card" will have a deep frosted background (`rgba(26, 32, 44, 0.8)`), heavy background blur (`20px`), an ultra-thin translucent white stroke (`border: 1px solid rgba(255, 255, 255, 0.1)`), and multi-level, high-contrast drop shadows. Advanced cards include mesh radial gradients and interactive "cursor glow" effects that react to mouse hover.
* **Inputs/Forms:** Emphasize subtlety, using softly rounded borders (`rounded-md`), semi-transparent frosted backgrounds (`oklch(1 0 0 / 0.1)`), and prominent focus rings (`oklch(1 0 0 / 0.3)`) that snap to attention upon interaction.

## 5. Layout Principles

* **Alignment & Whitespace:** Follows standard container boundaries (`max-w-7xl` or similar via Tailwind `container` utility) with regular `2rem` padding. Whitespace is generous between distinct blocks to allow the complex glassmorphism to breathe, but tighter within metric/trading columns to establish high data density.
* **Fluid Grids:** Relies heavily on flex and grid behaviors, supporting dynamic scaling. 
* **Micro-interactions & Motion:** The layout comes alive via smooth, 300ms cubic-bezier transitions on hover states (`transform: translateY(-4px)` to lift cards), continuous floating animations (`float-y`), and subtle looping pulses to draw the eye toward live data indicators.
