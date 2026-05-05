const fs = require('fs');
const content = fs.readFileSync("../ai-trading_frontend/src/features/news/components/WeeklyPlaybookPanel.tsx", "utf8");

// Extract the pieces
// Split at: {asArray((item as any).pair_bias).length > 0 && (
const part1 = content.split('{asArray((item as any).pair_bias).length > 0 && (')[0];
const rest1 = '{asArray((item as any).pair_bias).length > 0 && (' + content.split('{asArray((item as any).pair_bias).length > 0 && (')[1];

// Split the rest into High Risk and Pairs
const actionablePairsBlock = rest1.split('        <section className="space-y-4">\n          <h4 className="text-[15px] md:text-[16px] font-semibold text-white tracking-[0.5px]">\n            High-Risk Event Windows\n          </h4>')[0];
const highRiskBlockOrig = '        <section className="space-y-4">\n          <h4 className="text-[15px] md:text-[16px] font-semibold text-white tracking-[0.5px]">\n            High-Risk Event Windows\n          </h4>' + rest1.split('        <section className="space-y-4">\n          <h4 className="text-[15px] md:text-[16px] font-semibold text-white tracking-[0.5px]">\n            High-Risk Event Windows\n          </h4>')[1];
const highRiskBlock = highRiskBlockOrig.split('      </div>\n    </Card>\n  );\n}')[0];
const endBlock = '      </div>\n    </Card>\n  );\n}\n' + highRiskBlockOrig.split('      </div>\n    </Card>\n  );\n}')[1];

// Modify High Risk
let newHighRisk = highRiskBlock
    .replace('bg-[#0d0f11]/40', 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 relative overflow-hidden group shadow-[inset_0_1px_8px_rgba(245,158,11,0.05)]')
    .replace('bg-amber-500/10 flex items-center justify-center shrink-0', 'bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform');

// Inject background glow
newHighRisk = newHighRisk.replace('<div className="flex items-start justify-between gap-3">', `<div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500 blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity" />\n                  <div className="flex items-start justify-between gap-3 relative z-10">`);

// Make sure the bottom part of HighRisk retains relative z-10
newHighRisk = newHighRisk.replace('<div className="mt-2 ml-11">', '<div className="mt-2 ml-11 relative z-10">');

// Modify Actionable Pairs to include Search AND map over filteredPairs
let newPairsBlock = actionablePairsBlock.replace(
    '<div className="flex items-center justify-between mb-1">',
    `<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">`
).replace(
    '</Badge>\n            </div>\n            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">',
    `</Badge>\n              <div className="relative w-full md:w-64">\n                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />\n                <input\n                  type="text"\n                  value={searchQuery}\n                  onChange={(e) => setSearchQuery(e.target.value)}\n                  placeholder="Search pairs..."\n                  className="w-full bg-[#111315]/80 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8935A]/50 focus:ring-1 focus:ring-[#C8935A]/20 transition-all"\n                />\n              </div>\n            </div>\n            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">`
);
newPairsBlock = newPairsBlock.replace('{asArray((item as any).pair_bias).map((entry, index) => {', '{filteredPairs.map((entry, index) => {');

// Reconstruct: part1 + newHighRisk + newPairsBlock + endBlock
const finalContent = part1 + newHighRisk + newPairsBlock + endBlock;
fs.writeFileSync("../ai-trading_frontend/src/features/news/components/WeeklyPlaybookPanel.tsx", finalContent);
console.log("Done");
