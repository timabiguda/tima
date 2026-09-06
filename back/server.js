import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'url';
import fs from 'node:fs';
import https from 'node:https';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path:path.resolve(__dirname,'../.env')});

const app = express();
app.use(express.json()); 
app.use(cookieParser());

const sslOptions={
    key:fs.readFileSync(path.join(__dirname, '..', 'localhost+2-key.pem')),
    cert:fs.readFileSync(path.join(__dirname, '..', 'localhost+2.pem'))
};

app.use(express.static(path.join(__dirname, '..', 'front')))
app.use('/api', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'front', 'index.html'));
});


https.createServer(sslOptions, app).listen(5000,()=>{
    console.log('shit https://localhost:5000');
});