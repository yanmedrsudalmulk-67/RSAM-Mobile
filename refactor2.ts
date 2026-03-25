import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Fix double awaits
content = content.replace(/await await/g, 'await');

// Fix un-awaited db.prepare().run() that spans multiple lines
content = content.replace(/db\.prepare\('INSERT INTO error_logs(.*?)'\)\.run\(/gs, "await db.prepare('INSERT INTO error_logs$1').run(");

// Fix totalKunjungan and statistikPoli which use .get() and .all() on multiple lines
content = content.replace(/const totalKunjungan = db\.prepare\((.*?)\)\.get\(\)/gs, 'const totalKunjungan = await db.prepare($1).get()');
content = content.replace(/const statistikPoli = db\.prepare\((.*?)\)\.all\(\)/gs, 'const statistikPoli = await db.prepare($1).all()');

// Fix db.prepare(`...`).all()
content = content.replace(/db\.prepare\(`([\s\S]*?)`\)\.all\(\)/g, 'await db.prepare(`$1`).all()');

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
