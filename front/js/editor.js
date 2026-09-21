let textEditor=document.querySelector('.text-editor-content');

let italicBtn=document.querySelector('.tef1-italic-btn');
let boldBtn=document.querySelector('.tef1-bold-btn');
let strokeBtn=document.querySelector('.tef1-stroke-btn');
let underlineBtn=document.querySelector('.tef1-underline-btn');
let aboveRegBtn=document.querySelector('.tef1-aboveReg-btn');
let underRegBtn=document.querySelector('.tef1-underReg-btn');
let clearBtn=document.querySelector('.tef1-clear-btn');

let articleTitleInput=document.querySelector('.article-title-input');
let readyBtn=document.querySelector('.ready-btn');

const btnKeys={
    em: italicBtn,
    strong: boldBtn,
    del: strokeBtn,
    u: underlineBtn,
    sup: aboveRegBtn,
    sub: underRegBtn
};

//состояния стилей
let formateStatesList={
    em: false,
    strong: false,
    del: false,
    u: false,
    sup: false, //выше
    sub: false //ниже
}

const MAX_CONTENT_LENGTH=50000;
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['strong', 'em', 'del', 'u', 'sup', 'sub', 'br', 'p', 'span'],
            ALLOWED_ATTR: []
        });
    }

    // Резервная ручная валидация DOM (если DOMPurify не подключен)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const allowedTags = new Set(['STRONG', 'EM', 'DEL', 'U', 'SUP', 'SUB', 'BR', 'P', 'SPAN', '#text']);

    function cleanNode(node) {
        const children = Array.from(node.childNodes);
        for (let child of children) {
            if (!allowedTags.has(child.nodeName)) {
                // Заменяем неразрешенные теги (например <script>) на их текстовое содержимое
                const text = document.createTextNode(child.textContent);
                node.replaceChild(text, child);
            } else {
                // Удаляем все атрибуты (например onerror, onclick)
                if (child.nodeType === Node.ELEMENT_NODE) {
                    while (child.attributes.length > 0) {
                        child.removeAttribute(child.attributes[0].name);
                    }
                    cleanNode(child);
                }
            }
        }
    }

    cleanNode(tempDiv);
    return tempDiv.innerHTML;
}



//возвращает диапазон выделения
function getRangeSelected(){
    let selection=window.getSelection();
    if(!selection||selection.rangeCount===0)return null;
    const range=selection.getRangeAt(0);
    if(textEditor.contains(range.commonAncestorContainer)){
        return range;
    }
    return null;
}

//возвращает какие стили включены
function formateState(){
    // let statesEnabled=[];
    // for(let key in formateStatesList){
    //     formateStatesList[key]?statesEnabled.push(key):console.log('стиль не задан');
    // }
    // return statesEnabled;
    return Object.keys(formateStatesList).filter(key=>formateStatesList[key]);
}

//сброс
function resetFormateStatesList(){
    for(let key in formateStatesList){
        formateStatesList[key]=false;
    }
}

function updateBtnUI(){
    for(let key in btnKeys){
        if(btnKeys[key]){
            btnKeys[key].classList.toggle('active',formateStatesList[key]);
            //formateStatesList[key]
            //    ?btnKeys[key].classList.add('active')
            //    :btnKeys[key].classList.remove('active');
        }
    }
}

function checkCursorStyles() {
    const range=getRangeSelected();
    if(!range)return;
    resetFormateStatesList();

    let parent=range.commonAncestorContainer;
    if(parent.nodeType===Node.TEXT_NODE){
        parent=parent.parentNode;
    }
    while(parent&&parent!==textEditor){
        const tagName=parent.tagName.toLowerCase();
        if(tagName in formateStatesList){
            formateStatesList[tagName]=true;
        }
        parent=parent.parentNode;
    }
    updateBtnUI();
}


function removeTag(range,tagName){
    if(!tagName)return false;
    let parent=range.commonAncestorContainer;
    if(parent.nodeType===Node.TEXT_NODE){
        parent=parent.parentNode;
    }

    const closestTag=parent.closest(tagName);
    if(closestTag&&textEditor.contains(closestTag)){
        const parentOfTag = closestTag.parentNode;        
        while(closestTag.firstChild){
            parentOfTag.insertBefore(closestTag.firstChild, closestTag);
        }
        parentOfTag.removeChild(closestTag);
        return true;
    }
    return false;
}


//форматирует !!выделенный!! текст
function formateSelectedText(range,pressedTag){
    // const range=getRangeSelected();
    // if(!range||range.toString().length===0)return;
    if(removeTag(range,pressedTag)){
        window.getSelection().removeAllRanges();
        checkCursorStyles();
        return;
    }

    const activeTags=formateState();
    if(activeTags.length===0)return;

    const extractedContent = range.extractContents(); 
    let parentElement=null;
    let innerElement=null;
    activeTags.forEach((tag,index)=>{
        const newElement=document.createElement(tag);
        index===0?parentElement=newElement:innerElement.appendChild(newElement);
        innerElement=newElement;
    });

    innerElement.appendChild(extractedContent);
    range.insertNode(parentElement);

    window.getSelection().removeAllRanges();
    checkCursorStyles();
}


//вставляет теги в место где курсор
function formateEnteringText(range,pressedTag){
    if(!range)return;
    let parent=range.commonAncestorContainer;
    if(parent.nodeType===Node.TEXT_NODE){
        parent=parent.parentNode;
    }

    const closestTag = parent.closest(pressedTag);
    if(closestTag&&textEditor.contains(closestTag)){
        const dietSpace=document.createTextNode('\u200B');        
        closestTag.parentNode.insertBefore(dietSpace, closestTag.nextSibling);

        const selection=window.getSelection();
        const newRange=document.createRange();
        newRange.setStart(dietSpace,1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        checkCursorStyles();
        return;
    }

    // if(removeTag(range,pressedTag)){
    //     checkCursorStyles();
    //     return;
    // }
    const activeTags=formateState();
    if(activeTags.length===0)return;

    let parentElement=null;
    let innerElement=null;

    activeTags.forEach((tag, index)=>{
        const newElement=document.createElement(tag);
        index===0?parentElement=newElement:innerElement.appendChild(newElement)
        innerElement=newElement;
    });
    const dietSpace=document.createTextNode('\u200B');
    innerElement.appendChild(dietSpace);

    range.deleteContents();
    range.insertNode(parentElement);

    const selection=window.getSelection();
    const newRange=document.createRange();

    newRange.setStart(dietSpace,1); 
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    updateBtnUI();
}

//ctrl z|c|y
let undoArr=[];
let redoArr=[];
const MAX_HISTORY=50;

function saveState(clearRedo=true){
    const currentState=textEditor.innerHTML;
    
    if(undoArr.length>0&&undoArr[undoArr.length-1]===currentState)return;
    undoArr.push(currentState);
    if(undoArr.length>MAX_HISTORY)undoArr.shift();
    if(clearRedo)redoArr=[];
}

function undo(){
    if(undoArr.length<=1)return;
    const currentState=undoArr.pop();
    redoArr.push(currentState);
    const prevState=undoArr[undoArr.length-1];
    textEditor.innerHTML=prevState;

    checkCursorStyles();
}

function redo(){
    if(redoArr.length===0)return;
    const nextState=redoArr.pop();
    undoArr.push(textEditor.innerHTML);
    textEditor.innerHTML=nextState;

    checkCursorStyles();
}


function cleanPaste(e){
    e.preventDefault();
    saveState();

    const plainText=(e.clipboardData||window.clipboardData).getData('text/plain');
    const selection=window.getSelection();
    if(!selection.rangeCount)return;

    const range=selection.getRangeAt(0);
    range.deleteContents();

    const textNode=document.createTextNode(plainText);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    saveState();
    checkCursorStyles();
}
//говно сделал
// function placeCursorAtEnd(el){
//     el.focus();
//     const selection=window.getSelection();
//     const range=document.createRange();
//     range.selectNodeContents(el);
//     range.collapse(false);
//     selection.removeAllRanges();
//     selection.addRange(range);
// }

//очистка
function clearFormating(){
    const selection=window.getSelection();
    if(!selection||selection.rangeCount===0)return;
    const range=selection.getRangeAt(0);
    if(range.collapsed){
        resetFormateStatesList();
        updateBtnUI();
        return;
    }
    saveState();

    const frag=range.extractContents();
    const cleanText=frag.textContent||'';
    const textNode=document.createTextNode(cleanText);

    range.insertNode(textNode);
    const formatingTags=['STRONG','EM','U','DEL','SUP','SUB'];
    let current=textNode.parentNode;
    while(current&&current!==textEditor){
        const parent=current.parentNode;
        if(formatingTags.includes(current.tagName)){
            while(current.firstChild){
                parent.insertBefore(current.firstChild,current);
            }
            parent.removeChild(current);
            current=parent;
        }else{
            current=parent;
        }
    }

    const newRange=document.createRange();
    newRange.selectNodeContents(textNode);
    selection.removeAllRanges();
    selection.addRange(newRange);

    resetFormateStatesList();
    updateBtnUI();
    isWordBoundary=true;
}

//-----
saveState();

let isWordBoundary=true;
textEditor.addEventListener('beforeinput',(e)=>{
    if(e.inputType==='historyUndo'){
        e.preventDefault();
        undo();
        return;
    }
    if(e.inputType==='historyRedo'){
        e.preventDefault();
        redo();
        return;
    }
    // if(e.inputType.startsWith('delete')||e.data===' ')saveState();

    const isDelete=e.inputType.startsWith('delete');
    const isSpaceOrEnter=e.data===' '||e.inputType==='insertLineBreak';
    if(isDelete||isSpaceOrEnter||isWordBoundary){
        saveState();
        isWordBoundary=false;
    }
    if(isSpaceOrEnter||isDelete)isWordBoundary=true;
});

// textEditor.addEventListener('input',(e)=>{
//     if(e.inputType==='historyUndo'||e.inputType==='historyRedo')return;
//     // if(e.inputType.startsWith('delete')||e.inputType==='insertLineBreak'||e.data===' '){
//     //     saveState();
//     // }else{}
//     clearTimeout(inputTimeout);
//     inputTimeout=setTimeout(()=>{
//         saveState();
//         lastInputType = '';
//     },200);
// });


function chooseFormBtn(e){
    if(e.ctrlKey||e.metaKey){
        if(e.code==='KeyZ'||e.key.toLowerCase()==='z'||e.key.toLowerCase()==='я'){
            e.preventDefault();
            isWordBoundary=true;
            e.shiftKey?redo():undo();
            return;
        }
        if(e.code==='KeyY'||e.key.toLowerCase()==='y'||e.key.toLowerCase()==='н'){
            e.preventDefault();
            isWordBoundary=true;
            redo();
            return;
        }
    }

    let isFormatingKey=false;
    let pressedTag='';
    if(e.ctrlKey||e.metaKey){
        if(e.code==='Backslash'||e.code==='Space'){
            e.preventDefault();
            clearFormating();
            return;
        }
    }

    if((e.ctrlKey||e.metaKey)&&e.shiftKey){
        switch(e.code){
            case 'Equal':
                e.preventDefault();
                formateStatesList.sup=!formateStatesList.sup;
                isFormatingKey=true;
                pressedTag = 'sup';
                break;
            case 'Minus':
                e.preventDefault();
                formateStatesList.sub=!formateStatesList.sub;
                isFormatingKey=true;
                pressedTag='sub';
                break;
        }
    }
    else if(e.ctrlKey||e.metaKey){
        switch(e.key.toLowerCase()){
            case'i':case'ш':
                e.preventDefault();
                formateStatesList.em=!formateStatesList.em;
                isFormatingKey=true;
                pressedTag='em';
                break;
            case 'b':case'и':
                e.preventDefault();
                formateStatesList.strong=!formateStatesList.strong;
                isFormatingKey=true;
                pressedTag='strong';
                break;
            case 'd':case'в':
                e.preventDefault();
                formateStatesList.del=!formateStatesList.del;
                isFormatingKey=true;
                pressedTag='del';
                break;
            case 'u':case'г':
                e.preventDefault();
                formateStatesList.u=!formateStatesList.u;
                isFormatingKey=true;
                pressedTag='u';
                break;
        }
    }
    if(isFormatingKey){
        saveState();
        isWordBoundary=true;
        const range = getRangeSelected();
        if(!range)return;
        const hasSelection=range.toString().length>0;
        hasSelection?formateSelectedText(range,pressedTag):formateEnteringText(range,pressedTag);
    }
}


textEditor.addEventListener('keydown',chooseFormBtn);
textEditor.addEventListener('mouseup',checkCursorStyles);
textEditor.addEventListener('keyup',(e)=>{
    if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey)checkCursorStyles();
});
textEditor.addEventListener('paste',(e)=>{
    isWordBoundary=true;
    cleanPaste(e);
})

function initClickBtns(){
    Object.keys(btnKeys).forEach(tag=>{
        const btn=btnKeys[tag];
        if(!btn)return;
        btn.addEventListener('mousedown',(e)=>{
            e.preventDefault();
            textEditor.focus();

            const range=getRangeSelected();
            if(!range)return;
            saveState();
            isWordBoundary=true;
            formateStatesList[tag]=!formateStatesList[tag];

            const hasSelection=range.toString().length>0;

            hasSelection?formateSelectedText(range,tag):formateEnteringText(range,tag);
        });
    });
}

clearBtn.addEventListener('mousedown',(e)=>{
    e.preventDefault();
    textEditor.focus();
    clearFormating();
});
initClickBtns();
