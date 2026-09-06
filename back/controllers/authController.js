import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '../config/createDB.js';
import bcrypt from "bcryptjs";


//jqt
export function generateAccessToken(uid,role){
    return jwt.sign(
        {uid, role},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: '15m'}
    );
}
export function generateRefreshToken(uid,role){
    return jwt.sign(
        {uid, role},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: '7d'}
    );
}

const spreadTokens=(userId, res)=>{
    const accessToken=generateAccessToken(userId);
    const refreshToken=generateRefreshToken(userId);
    db.run(`UPDATE datas SET refreshToken = ? WHERE id = ?`,[refreshToken, userId],(updErr)=>{
        if(updErr){
            console.error('ошибка сохранения рефреш токена:', updErr.message);
        }
    });
    res.clearCookie('reg-data');
    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:'strict',
        maxAge:7*24*3600000
    });
    return accessToken    
};



//нодмайлер
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth:{
        user: process.env.GMAIL_ADRESS,
        pass: process.env.GMAIL_PASS,
    },
});

//эндпоинты
export const login = async(req,res)=>{
    const {user,password}=req.body;
    if (!user||!password){
        return res.status(400).json({error:'заполните все поля'});
    }
    db.get('SELECT * FROM datas WHERE login = ? OR email = ?',[user,user],async(err,row)=>{
        if(err){
            console.error('ошибка при поиске пользователя:',err.message);
            return res.status(500).json({error:'ошибка сервера'});
        }
        if(!row){
            return res.status(401).json({success: false,message:'пользователь не найден'});
        }
        
        try{
            let hashedPassword=row.password;
            const isMatch = await bcrypt.compare(password, hashedPassword);        
            if(isMatch){
                const accessToken = spreadTokens(row.id,res);
                return res.json({success: true,message:'пароль совпал',accessToken});
            }else{
                console.log('неверный пароль');
                res.status(401).json({success: false,message:'неверный пароль'});
            }
        }catch(err){
            console.error('Ошибка проверки пароля:', bcryptErr);
            return res.status(500).json({ error: 'Ошибка сервера при проверке пароля' });
        }
    });
};


export const sendSecrCode = async(req,res)=>{
    const {modus, data}=req.body;
    if(!data)return res.status(400).json({error: 'email не введён'});
    const code = Math.floor(100000+Math.random()*900000).toString();
    if(modus==="email"){
        try{
            await transporter.sendMail({
                from:'"timabiguda" <timabiguda@gmail.com>',
                to: `${data}`,
                subject: "Registration code",
                text: `Your code is ${code}`,
            });
            res.cookie('reg-data',JSON.stringify({code,data,modus}),{
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 600000
            })
            res.json({success:true, message: 'code to email was sent'});
        }catch(err){
            console.error("sending mail error:", err);
            res.status(500).json({error: 'code to email was NOT sent. ERROR 500'});
        }
    }
}


async function encryption(password){
    const saltRounds=10;
    return await bcrypt.hash(password, saltRounds);;
}

export const verifyCode= async(req,res)=>{
    const login=req.body.login?.trim();
    const password=req.body.password?.trim();
    const code=req.body.code?.trim();

    if(!login)return res.status(400).json({error: 'логин не введён'});
    if(!password)return res.status(400).json({error: 'пароль не введён'});
    if(!code)return res.status(400).json({error: 'код не введён'});
    // const sentCode = req.cookies['reg-code'];
    // if(!sentCode)return res.status(400).json({error: 'срок действия кода истёк'});
    // if(sentCode!==code)return res.status(400).json({error: 'неправильный код'});
    // res.clearCookie('reg-code');
    const rawRegData = req.cookies['reg-data'];
    if(!rawRegData)return res.status(400).json({error:'срок действия кода истёк'});
    
    let regData;
    try{
        regData=JSON.parse(rawRegData)
    }catch(err){
        return res.status(400).json({error:'некорректные данные регистрации'});
    }
    if(regData.code!==code)return res.status(400).json({error: 'неправильный код'});

    const email=regData.modus==='email'?regData.data:null;
    const phone=regData.modus==='phone'?regData.data:null;

    try{
        const hashedPassword=await encryption(password);
        const sql = `INSERT INTO datas (login, email, phone, password, version) VALUES (?, ?, ?, ?, ?)`;

        db.run(sql,[login, email, phone, hashedPassword, 1],function(err){
            if(err){
                console.error('ошибка записи в бд:',err.message);
                return res.status(500).json({error:'юз с таким email или логином уже существует'});
            }
            const userId = this.lastID;           
            const accessToken = spreadTokens(userId,res);
            res.clearCookie('reg-data');
            return res.json({ success: true, accessToken });
        });        
    }catch(err){
        console.error('ошибка сервера при регистрации:',err);
        return res.status(500).json({error:'ошибка сервера'});
    }
};

export const restartCheckAuth=async(req,res)=>{
    const refreshToken = req.cookies['refreshToken'];
    if(!refreshToken){
        return res.status(401).json({error:'нет рефреш токена'});
    }
    try{
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        db.get(`SELECT id, refreshToken FROM datas WHERE id = ?`,[decoded.uid],(err,user)=>{
            if(err||!user||user.refreshToken!==refreshToken){
                res.clearCookie('refreshToken');
                return res.status(403).json({ error:'недействительная или удалённая сессия'});
            }
            const newAccessToken = generateAccessToken(user.id);
            return res.json({ 
                success:true, 
                accessToken:newAccessToken 
            });
        });
    }catch(err){
        console.error('ошибка проверки рефреш токена:',err.message);
        res.clearCookie('refreshToken');
        return res.status(403).json({error:'недействительный или истёкший рефреш токен'});
    }
}

export const logOut=async(req,res)=>{
    try{
        const refreshToken = req.cookies['refreshToken'];
        if(refreshToken){
            db.run(`UPDATE datas SET refreshToken = NULL WHERE refreshToken = ?`,[refreshToken],(err)=>{
                if(err){
                    console.error('ошибка очистки рефреш токена в бд:',err.message);
                }
            });
        }
        res.clearCookie('refreshToken',{
            httpOnly:true,
            secure:true,
            sameSite:'strict',
        });
        return res.json({ 
            success:true, 
            accessToken:null
        });
    }catch (err) {
        console.error("ошибка при выходе:", err);
        return res.status(500).json({error:'ошибка сервера, не удалось удалить сессию/такой сессии нет'});
    }
}
