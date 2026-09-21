import sanitizeHtml from 'sanitize-html';
import db from '../config/createDBfront.js';

const sanitizeOptions={
    allowedTags:['strong','em','del','u','sup','sub','p','br','span'],
    allowedAttributes:{},
    allowedSchemes:[]
};

export const createArticle=async(req,res)=>{
    try{
        const{title,content}=req.body;
        if(!title||!title.trim()||!content||!content.trim()){
            return res.status(400).json({error:'пустая статья'});
        }

        const cleanTitle=sanitizeHtml(title.trim(),{allowedTags:[],allowedAttributes:{}});
        const cleanContent=sanitizeHtml(content.trim(),sanitizeOptions);

        if(!cleanTitle||!cleanContent){
            return res.status(400).json({error:'не взламывайте нас'});
        }
        const currentDate=new Date().toISOString();

        const sql=`INSERT INTO articles (title, content, date) VALUES (?, ?, ?)`;
        db.run(sql,[cleanTitle,cleanContent,currentDate],function(err){
            if(err){
                console.error('ошибка при записи в бд:',err.message);
                return res.status(500).json({error:'ошибка сервера при записи статьи в бд'});
            }

            return res.status(201).json({
                success:true,
                message:'статья сохранена',
                articleId:this.lastID
            });
        });
    }catch(err){
        console.error('ошибка обработки стати:',err);
        return res.status(500).json({error:'ошибка обработки статьи'});
    }
};

// Получение списка всех статей
export const getArticles=async(req,res)=>{
    const sql=`SELECT * FROM articles ORDER BY date DESC`;
    db.all(sql,[],(err,rows)=>{
        if(err){
            console.error('ошибка чтения статей из бд',err.message);
            return res.status(500).json({error:'ошибка чтения статей из бд'});
        }
        res.json({ success:true,articles:rows });
    });
};

// Получение одной статьи по ID
export const getArticleById=async(req,res)=>{
    const {id}=req.params;
    const sql=`SELECT * FROM articles WHERE id = ?`;
    db.get(sql,[id],(err,row)=>{
        if(err){
            console.error('ошибка чтения статьи из бд', err.message);
            return res.status(500).json({error:'ошибка чтения статьи'});
        }
        if(!row){
            return res.status(404).json({error:'статья не найдена'});
        }
        res.json({success:true,article:row});
    });
};