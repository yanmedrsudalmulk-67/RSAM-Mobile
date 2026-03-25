import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Replace app.get('/api/...', (req, res) => { with app.get('/api/...', async (req, res) => {
content = content.replace(/app\.(get|post|put|delete)\('(.*?)', \(req, res\) => {/g, "app.$1('$2', async (req, res) => {");

// Also handle the one with express.json middleware
content = content.replace(/app\.post\('\/api\/auth\/upload-photo', express\.json\(\{ limit: '5mb' \}\), \(req, res\) => {/g, "app.post('/api/auth/upload-photo', express.json({ limit: '5mb' }), async (req, res) => {");

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts async handlers');
