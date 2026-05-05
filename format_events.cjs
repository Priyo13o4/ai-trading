const fs = require('fs');
let content = fs.readFileSync("../ai-trading_frontend/src/features/news/components/EventAnalysisPanel.tsx", "utf8");

// Change ExpandableBlock wording
content = content.replace(/\{expanded \? "Show less" : "Expand"\}/g, '{expanded ? "less" : "more"}');

// EventAnalysisPanel to use grid
content = content.replace(
  '<div className="space-y-6">',
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">'
);

// Fonts sizes in EventAnalysisCard

// Event Name
content = content.replace(
  '<h3 className="text-2xl font-display font-semibold text-white leading-tight">',
  '<h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">'
);

// Market Setup header
content = content.replace(
  '<h4 className="text-[10px] uppercase tracking-widest text-[#C8935A]/80 font-bold flex items-center gap-2">',
  '<h4 className="text-xs uppercase tracking-wider text-[#C8935A]/80 font-semibold flex items-center gap-2">'
);

// Key Projections header
content = content.replace(
  '<h4 className="text-[10px] uppercase tracking-widest text-[#C8935A]/70 font-bold">Key Projections</h4>',
  '<h4 className="text-xs uppercase tracking-wider text-[#C8935A]/80 font-semibold">Key Projections</h4>'
);

// Interpretation header
content = content.replace(
  '<h4 className="mb-2 text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold flex items-center gap-2">',
  '<h4 className="mb-2 text-xs uppercase tracking-wider text-emerald-400/80 font-semibold flex items-center gap-2">'
);

// Impact badge
content = content.replace(
  /"font-bold tracking-widest uppercase text-\[10px\]",/g,
  '"font-bold tracking-wider uppercase text-xs",'
);

// Date text
content = content.replace(
  '<div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">',
  '<div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mt-1">'
);

// Affected Pairs text
content = content.replace(
  '<span className="text-[10px] font-bold uppercase tracking-widest text-[#C8935A]/60">Affected Pairs</span>',
  '<span className="text-xs font-semibold uppercase tracking-wider text-[#C8935A]/60">Affected Pairs</span>'
);
content = content.replace(
  /text-\[10px\] font-mono bg-\[\#0d0f11\] text-\[\#C8935A\] border border-\[\#C8935A\]\/20 font-bold/g,
  'text-xs font-mono bg-[#0d0f11] text-[#C8935A] border border-[#C8935A]/20 font-semibold'
);


fs.writeFileSync("../ai-trading_frontend/src/features/news/components/EventAnalysisPanel.tsx", content);
console.log("Done");
