import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Replace db.prepare(...).get(...) with await db.prepare(...).get(...)
content = content.replace(/db\.prepare\((.*?)\)\.get\((.*?)\)/g, 'await db.prepare($1).get($2)');
content = content.replace(/db\.prepare\((.*?)\)\.all\((.*?)\)/g, 'await db.prepare($1).all($2)');
content = content.replace(/db\.prepare\((.*?)\)\.run\((.*?)\)/g, 'await db.prepare($1).run($2)');

// Also handle cases where there are no arguments to get/all/run
content = content.replace(/db\.prepare\((.*?)\)\.get\(\)/g, 'await db.prepare($1).get()');
content = content.replace(/db\.prepare\((.*?)\)\.all\(\)/g, 'await db.prepare($1).all()');
content = content.replace(/db\.prepare\((.*?)\)\.run\(\)/g, 'await db.prepare($1).run()');

// Also handle cases where the result is assigned to a variable, e.g. const stmt = db.prepare(...)
// Wait, if it's just const stmt = db.prepare(...), it shouldn't be awaited.
// But the wrapper will return an object with async methods.
// So stmt.run(...) needs to be await stmt.run(...)
content = content.replace(/stmt\.run\((.*?)\)/g, 'await stmt.run($1)');
content = content.replace(/stmt\.get\((.*?)\)/g, 'await stmt.get($1)');
content = content.replace(/stmt\.all\((.*?)\)/g, 'await stmt.all($1)');

fs.writeFileSync('server.ts', content);
console.log('Refactored server.ts');
