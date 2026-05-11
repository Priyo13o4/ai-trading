export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTimeMinutes: number;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-pipfactor-ai-generates-trading-signals',
    title: "How PipFactor's AI Generates Trading Signals: A Full Breakdown",
    excerpt: "Most signal services tell you what to trade. This one explains why — from raw data ingestion to the confidence score on your dashboard.",
    publishedAt: "2026-05-07T12:00:00Z",
    readTimeMinutes: 6,
    content: `
<blockquote class="italic text-lg border-l-4 border-[#4f98a3] pl-6 mb-8 text-[#cdccca]">
  "Most signal services tell you what to trade. They rarely tell you <strong class="text-white">why</strong>.<br><br>
  This article is the 'why.' It's a full breakdown of how PipFactor actually generates a signal — from the moment raw data enters the system to the moment you see a confidence score on your dashboard."
</blockquote>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">What Data the System Ingests</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  PipFactor runs three independent analysis layers — news intelligence, market regime classification, and strategy generation — each operating on its own logic without contaminating the others. 
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The news layer scores incoming articles across multiple dimensions:
</p>

<ul class="list-disc pl-6 text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6 space-y-2">
  <li>Is this genuinely surprising, or already expected?</li>
  <li>Is there a clear causal chain between this event and a specific instrument?</li>
  <li>Is there a real directional implication, or just noise?</li>
</ul>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Most news fails these filters and gets discarded entirely. What passes through carries a structured impact assessment: affected instruments, directional weight, volatility expectation, and a time window for market reaction.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Separately, the market data layer processes six timeframes simultaneously — <strong class="text-white">W1, D1, H4, H1, M15, M5</strong> — computing a full technical profile for each: EMAs, RSI, MACD, ATR (with a historical volatility percentile), Bollinger Band squeeze ratio, ADX with directional strength, OBV slope, and detailed swing structure analysis.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">How Market Regime Detection Works</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The Regime Engine classifies the market into one of seven states by resolving the full picture across all six timeframes.
</p>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Trending Bull</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Trending Bear</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Ranging</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Volatile</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Consolidation</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center"><strong class="text-white">Breakout</strong></div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-4 text-center md:col-span-2"><strong class="text-white">Choppy</strong></div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  It doesn't just look at the dominant trend; it specifically weighs the <em class="italic">conflict</em> between higher and lower timeframes. A market with strong weekly EMAs sloping upward but H1/M15 showing ATR compression, Bollinger Band squeezes, and low ADX is classified as <strong class="text-white">Consolidation</strong> — not Trending. The system is designed to never let the macro picture paper over what price is actually doing right now.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">How Confidence Scoring Works</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Not all signals carry equal weight. Every setup is scored across several dimensions before reaching you:
</p>

<div class="space-y-6 my-8">
  <div class="pb-6 border-b border-[#262523]">
    <strong class="block text-white mb-2 text-xl">1. Timeframe Alignment</strong>
    <p class="text-[#cdccca] text-[17px]">How cleanly aligned are the six timeframes?</p>
  </div>
  <div class="pb-6 border-b border-[#262523]">
    <strong class="block text-white mb-2 text-xl">2. Regime Strength</strong>
    <p class="text-[#cdccca] text-[17px]">How strong is the current regime classification?</p>
  </div>
  <div class="pb-6 border-b border-[#262523]">
    <strong class="block text-white mb-2 text-xl">3. News Context</strong>
    <p class="text-[#cdccca] text-[17px]">Does the news context support, contradict, or have no bearing on the technical setup?</p>
  </div>
  <div class="pb-6 border-b border-[#262523]">
    <strong class="block text-white mb-2 text-xl">4. Causal Links</strong>
    <p class="text-[#cdccca] text-[17px]">Is there a direct causal link between the news and the specific instrument?</p>
  </div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  A signal only gets a High confidence label when all three layers are in agreement: the regime is clearly defined, the technical structure is clean across multiple timeframes, and the news context either supports the setup or is neutral. When they conflict, the confidence drops — and if the conflict is severe enough, no signal is generated at all. <strong class="text-white">The system staying quiet is a feature, not a failure.</strong>
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">What the Output Looks Like</h2>

<div class="bg-[#1c1b19] border border-[#393836] rounded-xl p-6 my-8 font-mono text-[#cdccca]">
  <div class="grid grid-cols-[100px_1fr] gap-2">
    <div class="text-[#797876]">Asset:</div><div class="text-white font-bold">EURUSD</div>
    <div class="text-[#797876]">Direction:</div><div class="text-[#4f98a3] font-bold">BUY</div>
    <div class="text-[#797876]">Entry Zone:</div><div>1.0850 – 1.0860</div>
    <div class="text-[#797876]">Stop-Loss:</div><div class="text-[#ef4444]">1.0820</div>
    <div class="text-[#797876]">Take-Profit:</div><div class="text-[#22c55e]">1.0920</div>
    <div class="text-[#797876]">Confidence:</div><div class="text-[#eab308]">82%</div>
    <div class="text-[#797876]">Regime:</div><div>Trending — Bullish bias</div>
  </div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Every field is computed, not guessed. The entry zone is derived from price structure. The SL and TP are set to a verified risk/reward ratio. The regime label tells you the market context the strategy was built for — so if the regime shifts after you enter, you know to re-evaluate.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">Limitations</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  AI is not a crystal ball. Sudden black-swan events — surprise central bank interventions, geopolitical shocks, flash crashes — can bypass any predictive model. PipFactor reduces noise and improves context; it doesn't eliminate risk. Always use proper position sizing.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  One deliberate constraint: in the window immediately surrounding high-impact scheduled news events, automated execution is blocked. The signal levels are still calculated — entry, stop-loss, take-profit — so a trader who wants to take manual risk has everything they need. But the system will not automatically execute into an event window where volatility and spread behaviour make risk management unreliable. That's a design choice, not a limitation.
</p>

<p class="text-sm text-[#797876] italic border-t border-[#262523] pt-6 mt-12">
  Signals are for informational purposes only.
</p>
    `
  },
  {
    slug: 'ai-trading-signals-for-gold-xauusd',
    title: "Using AI Trading Signals for Gold (XAUUSD): What to Expect",
    excerpt: "Gold broke me once. That's actually why this platform exists. Here's how PipFactor reads XAUUSD differently using 2026 macro context.",
    publishedAt: "2026-05-11T12:00:00Z",
    readTimeMinutes: 8,
    content: `
<blockquote class="italic text-lg border-l-4 border-[#4f98a3] pl-6 mb-8 text-[#cdccca]">
  "Gold broke me once. That's actually why this platform exists.<br><br>
  I had years of experience. I understood structure. I knew my EMAs, my pivot points, my support and resistance. And one Trump tariff comment — completely unplanned, dropped mid-session — blew straight through every level I had mapped. I held. The setup still looked right on the chart. I kept losing.<br><br>
  The problem wasn't my technical analysis. It was that I had no system for understanding why the market was suddenly ignoring it. That gap is exactly what PipFactor was built to close."
</blockquote>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">Why Gold Is the Hardest Instrument to Trade Manually</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Gold is the only major instrument where four completely different forces can be pulling price in four different directions — simultaneously — on any given day. And the one that wins isn't always the obvious one.
</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Real Yields (Macro Sensitivity)</strong>
    <p class="text-[#cdccca]">The dominant driver. Gold pays no yield, so when real yields fall, holding gold becomes relatively more attractive. Every 25 basis point shift in real yields has historically corresponded to roughly a $120–150 move in gold.</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">DXY (US Dollar Index)</strong>
    <p class="text-[#cdccca]">The multiplier. A stronger dollar makes gold more expensive for international buyers, suppressing demand and dragging price lower.</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Safe-Haven Flows (Fear Premium)</strong>
    <p class="text-[#cdccca]">The override. Geopolitical shocks can temporarily override both yields and the DXY entirely.</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Institutional Noise</strong>
    <p class="text-[#cdccca]">The short-timeframe chaos. Large funds, central banks, and algorithmic desks use gold as a hedging instrument and a tactical position, creating erratic price behaviour on M5, M15, and H1 charts.</p>
  </div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  When these forces conflict, it breaks normal correlations. 
</p>

<div class="bg-[#1c1b19] border border-[#393836] rounded-xl p-6 my-8">
  <div class="text-xs uppercase tracking-widest text-[#797876] mb-2">Early March 2026</div>
  <div class="text-xl font-bold text-[#4f98a3] mb-4">Gold surged 5.2% to $5,246</div>
  <ul class="list-disc pl-5 text-[#cdccca] space-y-2">
    <li>Cause: US-Iran conflict escalation</li>
    <li>Chart said: DXY is strengthening, Gold should drop</li>
    <li>Market said: Safe-haven override. Both surged together.</li>
  </ul>
</div>

<div class="bg-[#1c1b19] border border-[#393836] rounded-xl p-6 my-8">
  <div class="text-xs uppercase tracking-widest text-[#797876] mb-2">January 29–30, 2026</div>
  <div class="text-xl font-bold text-[#4f98a3] mb-4">Gold: $5,594 → ~$5,100 in one session</div>
  <ul class="list-disc pl-5 text-[#cdccca] space-y-2">
    <li>Cause: Kevin Warsh named Fed Chair</li>
    <li>Chart said: Bull trend intact ✓</li>
    <li>Market said: Down 9%. Goodbye.</li>
  </ul>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The day after Kevin Warsh's nomination, Gold dropped nearly $500. Not because any chart level broke. Because a single personnel announcement repriced the entire future rate path, strengthened the dollar, and raised the opportunity cost of holding a non-yielding asset — all within minutes. Technically, the gold bull trend was intact. It didn't matter.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">What This Means for Technical Analysis</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Technical analysis on Gold isn't wrong — it's incomplete without macro context.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Price levels matter. EMAs matter. But when a macro event hits — a CPI surprise, an FOMC pivot signal, a geopolitical shock — it doesn't respect those levels. The liquidity sitting at your support isn't a floor anymore. It becomes fuel for a stop hunt as price accelerates through it.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">How PipFactor Approaches XAUUSD Differently</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The core difference is that PipFactor's analysis doesn't start with the chart — it starts with the question: <em class="italic">what kind of market are we in right now, and what is the news context doing to it?</em>
</p>

<div class="space-y-8 my-8">
  <div class="pb-6 border-b border-[#262523] last:border-b-0">
    <strong class="block text-white mb-2 text-xl">1. Regime Classification Comes First</strong>
    <p class="text-[#cdccca] text-[17px]">Before any strategy is built for Gold, the system reads the full market structure across six timeframes. A Consolidation regime on Gold means the system is looking for range boundary reactions, not trend-following entries.</p>
  </div>
  <div class="pb-6 border-b border-[#262523] last:border-b-0">
    <strong class="block text-white mb-2 text-xl">2. News Relevance is Scored, Not Assumed</strong>
    <p class="text-[#cdccca] text-[17px]">Not every news event that mentions Gold actually moves Gold. The system evaluates each event for a specific, explainable link between the news and the instrument before it factors into strategy generation.</p>
  </div>
  <div class="pb-6 border-b border-[#262523] last:border-b-0">
    <strong class="block text-white mb-2 text-xl">3. Session Context is Real</strong>
    <p class="text-[#cdccca] text-[17px]">Gold doesn't behave the same at 02:00 UTC as it does at 14:00 UTC. London and New York sessions bring genuine institutional participation and tighter spreads. PipFactor's analysis is aware of which session is active and adjusts risk characteristics accordingly.</p>
  </div>
</div>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">What to Watch Summary</h2>

<div class="overflow-x-auto my-8">
  <table class="w-full border-collapse text-[#cdccca] text-[17px]">
    <thead>
      <tr class="bg-[#22211f]">
        <th class="p-4 text-left border-b border-[#262523] font-bold text-white">Situation</th>
        <th class="p-4 text-left border-b border-[#262523] font-bold text-white">What PipFactor Does</th>
      </tr>
    </thead>
    <tbody>
      <tr class="even:bg-[#1c1b19]">
        <td class="p-4 border-b border-[#262523]">Clear trending regime</td>
        <td class="p-4 border-b border-[#262523]">Generates directional signals with SL/TP</td>
      </tr>
      <tr class="even:bg-[#1c1b19]">
        <td class="p-4 border-b border-[#262523]">Consolidation / low conviction</td>
        <td class="p-4 border-b border-[#262523]">Fewer signals — waits for structure</td>
      </tr>
      <tr class="even:bg-[#1c1b19]">
        <td class="p-4 border-b border-[#262523]">Pre-FOMC / CPI / NFP window</td>
        <td class="p-4 border-b border-[#262523]">Blocks auto-execution, shows levels only</td>
      </tr>
      <tr class="even:bg-[#1c1b19]">
        <td class="p-4 border-b border-[#262523]">Choppy / volatile market</td>
        <td class="p-4 border-b border-[#262523]">Raises conviction threshold significantly</td>
      </tr>
    </tbody>
  </table>
</div>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">A Note on What PipFactor Doesn't Do</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  PipFactor won't predict where Gold is going to be in a week. Nobody can, and anything claiming to is selling you a story. What it does is read the current market structure honestly, score the news context accurately, and only issue a signal when those two things align cleanly.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The goal isn't to find more trades. It's to find better ones — and to stay out when the market is telling you to wait.
</p>

<p class="text-sm text-[#797876] italic border-t border-[#262523] pt-6 mt-12">
  Signals and regime classifications are AI-generated analysis for informational and educational purposes only. Not regulated financial advice. Always apply your own judgment and risk management.
</p>
    `
  },
  {
    slug: 'what-is-market-regime-detection-trading',
    title: "What Is Market Regime Detection? How AI Uses It to Filter Bad Trades",
    excerpt: "The same strategy in every market condition is how accounts blow up. Here's the layer that decides when to trade — and when to wait.",
    publishedAt: "2026-05-09T12:00:00Z",
    readTimeMinutes: 7,
    content: `
<blockquote class="italic text-lg border-l-4 border-[#4f98a3] pl-6 mb-8 text-[#cdccca]">
  "Most traders lose money not because they use the wrong strategy — but because they use the right strategy in the wrong market.<br><br>
  A clean pullback entry in a trending market is a great trade. The exact same setup in a choppy, directionless market is a slow bleed. The chart looks similar. The indicators look similar. But the context is completely different — and that context is what regime detection is built to read."
</blockquote>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">Why Market Regime Matters</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Every strategy has a native environment. Trend-following strategies perform in trending markets and get chopped apart in ranges. Mean-reversion strategies thrive in consolidation and get obliterated during breakouts. Breakout strategies need genuine volatility expansion — fake breakouts in low-conviction markets kill them.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The reason most retail traders don't think about this is simple: most tools don't surface it. Your chart shows candles. Your indicators show numbers. Nothing tells you <em class="italic">what kind of market you're actually in</em> before you place the trade.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  That's the gap regime detection fills.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">The Seven Regimes PipFactor Recognises</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The system classifies the current market into one of seven states:
</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Trending Bull</strong>
    <p class="text-[#cdccca]">Clear upward directional bias with momentum confirmation</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Trending Bear</strong>
    <p class="text-[#cdccca]">Clear downward directional bias with momentum confirmation</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Ranging</strong>
    <p class="text-[#cdccca]">Price oscillating between defined support and resistance, no trend</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Consolidation</strong>
    <p class="text-[#cdccca]">Tight price action, compressed volatility, market coiling</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Volatile</strong>
    <p class="text-[#cdccca]">Erratic, high-speed price movement without a clean directional structure</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">Breakout</strong>
    <p class="text-[#cdccca]">Price breaking from a prior range or structure with expanding momentum</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6 md:col-span-2">
    <strong class="block text-white mb-2 text-lg">Choppy</strong>
    <p class="text-[#cdccca]">Mixed signals across timeframes, low confidence, no tradeable structure</p>
  </div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Each regime label isn't just a description — it directly influences what type of trade setup the strategy layer builds, how aggressively it sizes the stop-loss, and how much confidence the final signal carries. 
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">How the Classification Actually Works</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The system analyses market data across six timeframes simultaneously: <strong class="text-white">Weekly (W1), Daily (D1), 4-Hour (H4), 1-Hour (H1), 15-Minute (M15), and 5-Minute (M5)</strong>.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  For each timeframe, it reads a full technical profile — not just a headline indicator. This includes:
</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">EMA Stack & RSI</strong>
    <p class="text-[#cdccca]">Checks alignment, spread, and tangling of 9/21/50/100/200 EMAs. Evaluates RSI momentum state and divergence signals.</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">MACD & OBV</strong>
    <p class="text-[#cdccca]">Analyses histogram direction, signal line crossovers, momentum shifts, and volume divergence vs price.</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">ATR & Bollinger Bands</strong>
    <p class="text-[#cdccca]">Calculates historical percentiles. Is the market coiling or expanding relative to its own history?</p>
  </div>
  <div class="bg-[#201f1d] border border-[#262523] rounded-lg p-6">
    <strong class="block text-white mb-2 text-lg">ADX (+DI/-DI)</strong>
    <p class="text-[#cdccca]">Measures sheer trend strength and directional balance independent of indicator lag.</p>
  </div>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  All of this feeds into a single AI analysis pass that produces a regime classification with a confidence score (0–100) and a detailed written assessment.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">The Rule That Makes It Work: Macro vs. Active State</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The single most important design decision in the regime system is a forced separation between the <strong class="text-white">macro trend direction</strong> and the <strong class="text-white">active market state</strong>.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Take a real example from XAUUSD (Gold) on 11 May 2026:
</p>

<div class="bg-[#1c1b19] border border-[#393836] rounded-xl p-6 my-8">
  <div class="text-xs uppercase tracking-widest text-[#797876] mb-2">11 May 2026</div>
  <div class="text-xl font-bold text-[#4f98a3] mb-4">Gold (XAUUSD) Analysis</div>
  <ul class="list-disc pl-5 text-[#cdccca] space-y-2">
    <li>Weekly Chart: Strong bullish structure</li>
    <li>Daily Chart: Volatility compressed</li>
    <li>Result: Consolidation Regime (Wait)</li>
  </ul>
</div>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  On the <strong class="text-white">Weekly chart</strong>, Gold looks structurally bullish — ADX at 40.66, price above all major EMAs. A naive system looks at this and says: <em class="italic">Trending Bull. Done.</em>
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  But drop down to the <strong class="text-white">Daily chart</strong>: ADX collapses to 13.48. ATR percentile sitting at just 14% of its historical range. Bollinger Band width percentile at 8%. On <strong class="text-white">H4</strong>, ATR percentile is at 3%. Price is barely moving.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  The system is built to resolve this conflict with a hard rule: <strong class="text-white">if lower timeframes show severe volatility compression, the active regime takes precedence over the macro narrative.</strong> A coiled, compressing market gets classified as Consolidation, not Trending, even if the weekly chart is pointing up.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">What Happens After the Regime Is Set</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  Once a regime is classified, the result feeds directly into the strategy layer. The regime determines which types of trade setups are even considered, what risk parameters are appropriate, and how much weight to give conflicting news signals.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  A <strong class="text-white">Consolidation</strong> regime in Gold means the strategy layer will look for zone retests and range boundary reactions — not trend-following entries. A <strong class="text-white">Volatile</strong> regime narrows strategy generation significantly, because the risk of liquidity traps and false moves is high enough that conviction must be substantially higher before a signal is issued.
</p>

<hr class="border-t border-[#262523] my-12">

<h2 class="text-3xl font-bold mt-12 mb-6 text-white font-display">Why This Matters for You</h2>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  If you've ever placed a textbook setup — everything looked right — and watched price chop around your entry and eventually stop you out for no apparent reason, there's a good chance the regime was working against you. The setup was technically valid. The market just wasn't in a state where that setup had an edge.
</p>

<p class="text-[17px] leading-[1.7] max-w-[72ch] text-[#cdccca] mb-6">
  PipFactor's regime layer is specifically designed to catch those situations before a signal reaches you.
</p>

<p class="text-sm text-[#797876] italic border-t border-[#262523] pt-6 mt-12">
  Signals and regime classifications are AI-generated analysis for informational purposes only. Not regulated financial advice.
</p>
    `
  }
];
