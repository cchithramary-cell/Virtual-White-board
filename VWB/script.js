// Basic setup
const canvas=document.getElementById("whiteboard");
const ctx=canvas.getContext("2d");
let drawing=false,lastX=0,lastY=0,color="black",brush=5,eraser=false;
let currentUser="",currentPage=1,tool="pen";
let undoStack=[],redoStack=[],tempImage=null;
let startX=0,startY=0;

// Login
currentUser=localStorage.getItem("currentUser");
if(currentUser) showWhiteboard(); else showLogin();
function login(){ 
    const name=document.getElementById("usernameInput").value.trim(); 
    if(!name){ alert("Enter username"); return; } 
    currentUser=name; 
    localStorage.setItem("currentUser",name); 
    showWhiteboard(); 
}
function logout(){ 
    localStorage.removeItem("currentUser"); 
    showLogin(); 
}
function showLogin(){ 
    document.getElementById("loginScreen").style.display="block"; 
    document.getElementById("whiteboardScreen").style.display="none"; 
}
function showWhiteboard(){ 
    document.getElementById("loginScreen").style.display="none"; 
    document.getElementById("whiteboardScreen").style.display="block"; 
    document.getElementById("userLabel").innerText=currentUser; 
    loadBoard(); 
    updatePageList(); 
}

// Toolbar events
document.getElementById("color").addEventListener("change",e=>{ color=e.target.value; eraser=false; });
document.getElementById("brush").addEventListener("change",e=>{ brush=parseInt(e.target.value); });
function setEraser(){ eraser=true; tool="pen"; }
function setTool(t){ tool=t; eraser=false; }

// Undo/Redo
function saveState(){ undoStack.push(canvas.toDataURL()); redoStack=[]; }
function undo(){ if(undoStack.length){ redoStack.push(canvas.toDataURL()); const img=new Image(); img.src=undoStack.pop(); img.onload=()=>ctx.drawImage(img,0,0); saveBoard(); } }
function redo(){ if(redoStack.length){ undoStack.push(canvas.toDataURL()); const img=new Image(); img.src=redoStack.pop(); img.onload=()=>ctx.drawImage(img,0,0); saveBoard(); } }

// Drawing
function startDraw(x,y){ if(tool==='text') return; drawing=true; lastX=x; lastY=y; saveState(); }
function stopDraw(){ drawing=false; saveBoard(); updatePageList(); }
function drawLine(x,y){ ctx.strokeStyle=eraser?'white':color; ctx.lineWidth=brush; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); lastX=x; lastY=y; }

// Shapes
function drawShape(x,y){
 ctx.putImageData(tempImage,0,0);
 ctx.strokeStyle=color; ctx.lineWidth=brush;
 ctx.fillStyle=color;
 const cx=(startX+x)/2,cy=(startY+y)/2;
 const fill=document.getElementById("fillShape").checked;
 switch(tool){
 case "line": ctx.beginPath(); ctx.moveTo(startX,startY); ctx.lineTo(x,y); ctx.stroke(); break;
 case "rect": fill?ctx.fillRect(startX,startY,x-startX,y-startY):ctx.strokeRect(startX,startY,x-startX,y-startY); break;
 case "square": let s=Math.max(x-startX,y-startY); fill?ctx.fillRect(startX,startY,s,s):ctx.strokeRect(startX,startY,s,s); break;
 case "circle": let r=Math.sqrt((x-startX)**2+(y-startY)**2); ctx.beginPath(); ctx.arc(startX,startY,r,0,2*Math.PI); fill?ctx.fill():ctx.stroke(); break;
 case "triangle": ctx.beginPath(); ctx.moveTo(startX,startY); ctx.lineTo(x,startY); ctx.lineTo(cx,y); ctx.closePath(); fill?ctx.fill():ctx.stroke(); break;
 case "ellipse": ctx.beginPath(); ctx.ellipse(cx,cy,Math.abs(x-startX)/2,Math.abs(y-startY)/2,0,0,2*Math.PI); fill?ctx.fill():ctx.stroke(); break;
 case "diamond": ctx.beginPath(); ctx.moveTo(cx,startY); ctx.lineTo(x,cy); ctx.lineTo(cx,y); ctx.lineTo(startX,cy); ctx.closePath(); fill?ctx.fill():ctx.stroke(); break;
 case "pentagon": drawPolygon(5,x,y,fill); break;
 case "hexagon": drawPolygon(6,x,y,fill); break;
 case "star": drawStar(5,x,y,fill); break;
 case "arrow": drawArrow(startX,startY,x,y); break;
 }
}

function drawPolygon(sides,x,y,fill){
 const cx=(startX+x)/2,cy=(startY+y)/2; const radius=Math.min(Math.abs(x-startX),Math.abs(y-startY))/2;
 ctx.beginPath();
 for(let i=0;i<sides;i++){
 let angle=(i*2*Math.PI/sides)-Math.PI/2; let px=cx+radius*Math.cos(angle); let py=cy+radius*Math.sin(angle);
 if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
 }
 ctx.closePath(); fill?ctx.fill():ctx.stroke();
}

function drawStar(points,x,y,fill){
 const cx=(startX+x)/2,cy=(startY+y)/2; const outer=Math.min(Math.abs(x-startX),Math.abs(y-startY))/2; const inner=outer/2;
 ctx.beginPath();
 for(let i=0;i<2*points;i++){
 const r=i%2===0?outer:inner; let angle=(i*Math.PI/points)-Math.PI/2; let px=cx+r*Math.cos(angle); let py=cy+r*Math.sin(angle);
 if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
 }
 ctx.closePath(); fill?ctx.fill():ctx.stroke();
}

function drawArrow(x1,y1,x2,y2){ const headlen=10; const dx=x2-x1,dy=y2-y1; const angle=Math.atan2(dy,dx);
 ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x2-headlen*Math.cos(angle-Math.PI/6),y2-headlen*Math.sin(angle-Math.PI/6));
 ctx.moveTo(x2,y2); ctx.lineTo(x2-headlen*Math.cos(angle+Math.PI/6),y2-headlen*Math.sin(angle+Math.PI/6)); ctx.stroke(); }

// Text
function handleText(x,y){
 const txt=prompt("Enter text"); if(!txt) return;
 ctx.fillStyle=color;
 let fs=parseInt(document.getElementById("fontSize").value);
 let ff=document.getElementById("fontFamily").value;
 ctx.font=fs+'px '+ff;
 ctx.textBaseline='top';
 ctx.fillText(txt,x,y);
 saveBoard(); updatePageList();
}

// Events
function getCanvasPos(e){
 const rect=canvas.getBoundingClientRect();
 if(e.touches) return {x:e.touches[0].clientX-rect.left, y:e.touches[0].clientY-rect.top};
 return {x:e.clientX-rect.left, y:e.clientY-rect.top};
}

canvas.addEventListener("mousedown",e=>{
 const pos=getCanvasPos(e); if(tool==='text'){ handleText(pos.x,pos.y); return; }
 if(tool==='pen'){ startDraw(pos.x,pos.y); } else if(tool!==''){ startX=pos.x; startY=pos.y; drawing=true; saveState(); tempImage=ctx.getImageData(0,0,canvas.width,canvas.height); }
});
canvas.addEventListener("mousemove",e=>{ if(!drawing) return; const pos=getCanvasPos(e); tool==='pen'?drawLine(pos.x,pos.y):drawShape(pos.x,pos.y); });
canvas.addEventListener("mouseup",stopDraw); canvas.addEventListener("mouseout",stopDraw);
canvas.addEventListener("touchstart",e=>{ e.preventDefault(); const pos=getCanvasPos(e); if(tool==='text'){ handleText(pos.x,pos.y); return; } if(tool==='pen'){ startDraw(pos.x,pos.y); } else if(tool!==''){ startX=pos.x; startY=pos.y; drawing=true; saveState(); tempImage=ctx.getImageData(0,0,canvas.width,canvas.height); } });
canvas.addEventListener("touchmove",e=>{ e.preventDefault(); if(!drawing) return; const pos=getCanvasPos(e); tool==='pen'?drawLine(pos.x,pos.y):drawShape(pos.x,pos.y); });
canvas.addEventListener("touchend",stopDraw);

// Save/Load
function saveBoard(){ localStorage.setItem(`whiteboard_${currentUser}_page${currentPage}`,canvas.toDataURL()); }
function loadBoard(){ 
    ctx.clearRect(0,0,canvas.width,canvas.height); 
    const data=localStorage.getItem(`whiteboard_${currentUser}_page${currentPage}`); 
    if(data){ 
        const img=new Image(); 
        img.src=data; 
        img.onload=()=>ctx.drawImage(img,0,0); 
    } 
    document.getElementById("pageLabel").innerText=currentPage; 
    updatePageList(); 
}

// Clear/Export
function clearBoard(){ ctx.clearRect(0,0,canvas.width,canvas.height); saveBoard(); updatePageList(); }
function exportImage(){ 
    const a=document.createElement("a"); 
    a.href=canvas.toDataURL("image/png"); 
    a.download=`${currentUser}_page${currentPage}.png`; 
    a.click(); 
}
function exportPDF(){ 
    const { jsPDF } = window.jspdf; 
    const pdf=new jsPDF({orientation:'portrait',unit:'px',format:[canvas.width,canvas.height]}); 
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,canvas.width,canvas.height); 
    pdf.save(`${currentUser}_page${currentPage}.pdf`); 
}

// Pages
function newPage(){ saveBoard(); currentPage++; loadBoard(); }
function prevPage(){ if(currentPage>1){ saveBoard(); currentPage--; loadBoard(); } }
function nextPage(){ saveBoard(); currentPage++; loadBoard(); }
function deletePage(){ 
    if(confirm("Delete this page?")){ 
        localStorage.removeItem(`whiteboard_${currentUser}_page${currentPage}`); 
        if(currentPage>1) currentPage--; 
        loadBoard(); 
    } 
}

function updatePageList(){ 
    const div=document.getElementById("pageList"); 
    div.innerHTML=""; 
    for(let i=1;i<=50;i++){ 
        if(localStorage.getItem(`whiteboard_${currentUser}_page${i}`)){ 
            const item=document.createElement("div"); 
            item.className="pageItem"; 
            item.innerHTML=`<span>Page ${i}</span><button onclick="currentPage=${i}; loadBoard();">Load</button>`; 
            div.appendChild(item); 
        } 
    } 
}

// Glitter sparkle effect generation in login screen
function createSparkles() {
    const container = document.querySelector('#loginScreen .sparkle-container');
    const sparkleCount = 30;
    for(let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.top = (Math.random() * 80 + 10) + '%';
        sparkle.style.left = (Math.random() * 100) + '%';
        sparkle.style.animationDelay = (Math.random() * 2.5) + 's';
        container.appendChild(sparkle);
    }
}
createSparkles();
