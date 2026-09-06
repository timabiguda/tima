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
        CREATE TABLE IF NOT EXISTS datas(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password TEXT,
            refreshToken TEXT,
            version INTEGER
        )
    `,err=>err?console.error('err',err.message):console.log('таблица создана')
    );
});
export default db;