const fs = require('fs');
const sourceMap = require('source-map');

async function trace() {
    try {
        const rawSourceMap = fs.readFileSync('./dist/assets/index-CS1yK-kB.js.map', 'utf8');
        const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
        
        console.log(consumer.originalPositionFor({
            line: 40,
            column: 167
        }));
        
        console.log(consumer.originalPositionFor({
            line: 40,
            column: 41991
        }));
        
        consumer.destroy();
    } catch(e) {
        console.error(e);
    }
}
trace();
