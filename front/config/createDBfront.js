import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../mydb.db');

const db = new sqlite3.Database(dbPath,
    err=>err?console.error('ошибка подключения бд',err.message):console.log('бд подключена')
);
db.serialize(()=>{
    db.run(`
        CREATE TABLE IF NOT EXISTS articles(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL
        )
    `,err=>err?console.error('err',err.message):console.log('таблица создана')
    );
});
export default db;