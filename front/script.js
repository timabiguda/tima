let hasAcc = true;

let accessToken=null;
async function restartCheckAuth(){
    try{
        const response=await fetch('/api/refresh',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            }
        });
        if(response.ok){
            const data=await response.json()
            accessToken = data.accessToken;
            if(authBtnTop)authBtnTop.style.display="none";
            if(authedBtn)authedBtn.style.display="flex";
            console.log('авторизация после перезагрузки успешна')
        }else{
            console.log('вы не авторизованы или истекла сессия');
        }
    }catch(err){
        console.error('ошибка сети при перезагрузке')
    }
}
document.addEventListener('DOMContentLoaded',()=>{
    restartCheckAuth();
});


let rasBtn = document.getElementById('diagnos-ras');
let dcpBtn = document.getElementById('diagnos-dcp');
let stMenu = document.getElementById('diagnos-choosing'); //fir-stMenu
let mainSite = document.querySelector('.main-site');

rasBtn.addEventListener('click',()=>{
    stMenu.classList.add('hidden');
    mainSite.classList.add('shown');

})

dcpBtn.addEventListener('click',()=>{
    stMenu.classList.add('hidden');
    mainSite.classList.add('shown');
})

let leftOpnBtn = document.getElementById('arrow-left-side');
let left = document.getElementById('left-side')
leftOpnBtn.addEventListener('click', ()=>{
    left.classList.toggle('hidden');
})

let authBtnTop = document.getElementById('auth-btn-top');
let closeArBtn = document.getElementById('btn-close-ar-plate');
let regArBtn = document.getElementById('reg-button-ar-plate');
let authArBtn = document.getElementById('auth-button-ar-plate');

let arPlate = document.getElementById('ar-plate');
let authPlate = document.querySelector('.auth-plate');
let regText = document.querySelector('.r-plate-text');
let regBtn = document.querySelector('.r-btn');
let authBtn = document.querySelector('.ar-btn');

let authText = document.querySelector('.ar-plate-text');

authBtnTop.addEventListener('click',()=>{
    arPlate.classList.add('shown');
})

regArBtn.addEventListener('click',()=>{
    authText.classList.add('hidden');
    authBtn.classList.add('hidden');
    regText.classList.add('shown');
    regBtn.classList.add('shown')
    hasAcc = false;
    console.log('hasAcc: ',hasAcc);
})

authArBtn.addEventListener('click',()=>{
    authText.classList.remove('hidden');
    authBtn.classList.remove('hidden');
    regText.classList.remove('shown');
    regBtn.classList.remove('shown')
    hasAcc = true;
    console.log('hasAcc: ',hasAcc);

})

closeArBtn.addEventListener('click',()=>{
    arPlate.classList.remove('shown');
})

let pglBtn = document.querySelector('.ar-pgl');
let pglAuth = document.querySelector('.pgl-auth');
let pglReg = document.querySelector(".pgl-reg")


pglBtn.addEventListener('click', ()=>{
    if(hasAcc){
        authPlate.style.display = 'none';
        pglAuth.classList.add('shown');
    }else{
        authPlate.style.display = 'none';
        pglReg.classList.add('shown')
    }
})




let pglAuthBackBtn = document.getElementById('pgl-auth-back-button');
pglAuthBackBtn.addEventListener('click',()=>{
    pglAuth.classList.remove('shown');
    authPlate.style.display = 'flex';
})

let pglRegBackBtn = document.getElementById('pgl-reg-back-button');
pglRegBackBtn.addEventListener('click',()=>{
    pglReg.classList.remove('shown');
    authPlate.style.display = "flex";
})

let changeToEmail = document.querySelector('.reg-changeto-email');
let changeToPhone = document.querySelector('.reg-changeto-phone');
let regEmail = document.querySelector('.reg-email');
let regPhone = document.querySelector('.reg-phone');
let regIsPhone = true;

changeToEmail.addEventListener('click',()=>{
    regPhone.classList.add('hidden');
    regEmail.classList.add('shown');
    regIsPhone=false;

})
changeToPhone.addEventListener('click',()=>{
    regPhone.classList.remove('hidden');
    regEmail.classList.remove('shown');
    regIsPhone=true;
})




let sendCodeBtnEmail = document.querySelector('.reg-send-code-email');
let sendCodeBtnPhone = document.querySelector('.reg-send-code-phone');
let regEmailInput = document.querySelector('.reg-email-input');
let regPhoneInput = document.querySelector('.reg-phone-input');


function getEmailPhone(value){
    return{
        modus: regIsPhone?'phone':'email',
        data: value
    }
}

sendCodeBtnEmail?.addEventListener('click',async(e)=>{
    const value = (regIsPhone?regPhoneInput?.value:regEmailInput?.value)?.trim()??'';
    if(!value){
        console.log('enter email');
        return;
    }
    const dataEmailPhone = getEmailPhone(value);

    try{
        const response = await fetch('/api/secrcode',{
            method: 'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(dataEmailPhone)
        });
        const result = await response.json();
        if(response.ok){
            console.log('код отправлен: ',result);
        }else{
            console.error('код не отправлен с ошибкой:',result);
        }
    }catch(err){
        console.error('огибка при отправке запроса:',err);
    }
})
sendCodeBtnPhone?.addEventListener('click',()=>{
    console.log('Код для телефона в разработке')
})



let regAcceptBtnPhone= document.getElementById('reg-accept-btn-phone');
let regAcceptBtnEmail = document.getElementById('reg-accept-btn-email');
let regLoginInput = document.querySelector('.reg-login-input');
let regPasswordInput = document.querySelector('.reg-password1-input');
let regCodeInput=document.querySelector('.reg-code-input');


function getRegCredentials() {
    const phoneBlock = document.querySelector('.reg-phone');
    const emailBlock = document.querySelector('.reg-email');
    let codeInput;
    if(phoneBlock&&!phoneBlock.classList.contains('hidden')){
        codeInput = phoneBlock.querySelector('.reg-code-input');
    }else if(emailBlock && !emailBlock.classList.contains('hidden')){
        codeInput = emailBlock.querySelector('.reg-code-input');
    }else{
        codeInput = document.querySelector('.reg-code-input');
    }
    const code = codeInput?codeInput.value:'';
    return{
        login: regLoginInput?.value||'',
        password: regPasswordInput?.value||'',
        code: code
    };
}

async function handleRegistration(e){
    e.preventDefault();
    if(regLoginInput.value&&regPasswordInput.value){
        try{
            const response=await fetch('/api/verify-code',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(getRegCredentials())
            })
            const data = await response.json();
            if(response.ok){
                accessToken = data.accessToken;
                console.log('регистрация успешна:',data);
                
                arPlate.classList.remove('shown');
                if(authBtnTop)authBtnTop.style.display="none";
                if(authedBtn)authedBtn.style.display="flex";
            }else{
                console.error('регистрация не прошла с ошибкой:', data.error);
            }
        }catch(err){
            console.error('fehler:', err);
        }
    }else{
        console.log('ЗАПОЛНИТЕ ВСЕ ПОЛЯ');
    }
}
regAcceptBtnPhone.addEventListener('click',()=>{

})

// -------

regAcceptBtnEmail?.addEventListener('click', handleRegistration);
regAcceptBtnPhone?.addEventListener('click', handleRegistration);

const pglUs = document.querySelector('.pgl-auth-input');
const pglPass = document.querySelector('.pgl-password-input');
const logInBtn = document.querySelector('.logIN');

function getCredentials(){
    return{
        user: pglUs?pglUs.value:'',
        password: pglPass?pglPass.value:''
    };
}
let authedBtn = document.getElementById("authed-btn");

logInBtn?.addEventListener('click',async(e)=>{
    e.preventDefault();
    const credentials = getCredentials();
    console.log('данные отправлены на сервер:');

    try{
        const response = await fetch('/api/login',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if(response.ok&&data.success){
            accessToken =data.accessToken;
            console.log('авторизация успешна');

            pglAuth?.classList.toggle('shown');
            arPlate?.classList.remove('shown');

            if(authPlate)authPlate.style.display='flex';
            if(authBtnTop)authBtnTop.style.display = "none";
            if(authedBtn)authedBtn.style.display = "flex";
        }else{
            console.log('ошибка авторизации',data.message||data.error);
        }
    }catch(error){
        console.error('fehler:',error);
    }
});

let authedBurger=document.querySelector('.authed-burger')
let logOutBtn=document.querySelector('.log-out-btn')
authedBtn?.addEventListener('click',()=>{
    authedBurger.classList.toggle('shown')
})
logOutBtn?.addEventListener('click',async()=>{
    try{
        const response = await fetch('/api/logout',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
        });
        if(response.ok){
            const data=await response.json()
            accessToken = data.accessToken;
            authedBurger?.classList.remove('shown');
            pglAuth?.classList.remove('shown');
            pglReg?.classList.remove('shown');  
            if(authBtnTop)authBtnTop.style.display="flex";
            if(authedBtn)authedBtn.style.display="none";

            console.log('сессия успешно удалена')
        }else{
            console.log('ошибка сервера, не удалось удалить сессию');
        }
    }catch(err){
        console.error('ошибка сети при выходе:',err);
    };
});