const fs = require('fs');
const file = '/Volumes/My Drive/Priyodip/college notes and stuff/Coding stuff (Vs code)/Docker Projects/ai-trading_frontend/src/components/signal/klinechart/useNewsOverlay.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const filtered = markers.filter((marker) => {',
  'console.log("[DEBUG] applyFiltersAndAggregate called with markers:", markers.length, "minImportance:", minImportance, "symbol:", symbol);\n    const filtered = markers.filter((marker) => {'
);
code = code.replace(
  'return instruments.some(',
  'const isMatch = instruments.some('
);
code = code.replace(
  ');\n    });',
  ');\nif(!isMatch) console.log("[DEBUG] FILTERED OUT. instruments:", instruments, "symbolAliases:", symbolAliases);\nreturn isMatch;\n    });\nconsole.log("[DEBUG] filtered length after:", filtered.length);'
);

fs.writeFileSync(file, code);
