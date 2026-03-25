import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Fix line 477
content = content.replace(/db\.prepare\(`\n        UPDATE jadwal_dokter/g, 'await db.prepare(`\n        UPDATE jadwal_dokter');

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
