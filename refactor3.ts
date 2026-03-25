import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Fix totalKunjungan
content = content.replace(/const totalKunjungan = db\.prepare\(`/g, 'const totalKunjungan = await db.prepare(`');
content = content.replace(/const statistikPoli = db\.prepare\(`/g, 'const statistikPoli = await db.prepare(`');

// Fix line 476
content = content.replace(/db\.prepare\(`\n        DELETE FROM jadwal_layanan/g, 'await db.prepare(`\n        DELETE FROM jadwal_layanan');

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
