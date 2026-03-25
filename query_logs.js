import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const logs = db.prepare('SELECT * FROM error_logs').all();
console.log(JSON.stringify(logs, null, 2));
