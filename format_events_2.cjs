const fs = require('fs');
let content = fs.readFileSync("../ai-trading_frontend/src/features/news/components/EventAnalysisPanel.tsx", "utf8");

content = content.replace(
  '<span className="text-[10px] uppercase tracking-wider text-[#C8935A]/40 mb-1.5 leading-none font-bold">{key}</span>',
  '<span className="text-[11px] uppercase tracking-wider text-[#C8935A]/60 mb-1.5 leading-none font-semibold">{key}</span>'
);

content = content.replace(
  '<span className="text-lg font-bold text-slate-100 font-mono tracking-tight">{toText(itemValue)}</span>',
  '<span className="text-xl font-bold text-slate-100 font-mono tracking-tight">{toText(itemValue)}</span>'
);

content = content.replace(
  /buttonClassName = "text-\[10px\] font-bold uppercase tracking-wider text-\[\#C8935A\] hover:text-\[\#E2B485\] mt-2 transition-colors"/,
  'buttonClassName = "text-xs font-semibold uppercase tracking-wider text-[#C8935A] hover:text-[#E2B485] mt-2 transition-colors"'
);

// Specifically for interpretation
content = content.replace(
  /buttonClassName="text-\[10px\] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"/,
  'buttonClassName="text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"'
);

// We changed the container to `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`
// So let's make key numbers grid flow correctly for a 2-col card layout
content = content.replace(
  '<div className="grid grid-cols-2 md:grid-cols-4 gap-3">',
  '<div className="grid grid-cols-2 gap-3">'
);

fs.writeFileSync("../ai-trading_frontend/src/features/news/components/EventAnalysisPanel.tsx", content);
console.log("Done");
