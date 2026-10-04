/* =====================================================
   ELEMENTOS
===================================================== */

const menu = document.getElementById("menu");
const game = document.getElementById("game");
const table = document.getElementById("table");

const startButton =
    document.getElementById("startButton");

const resetButton =
    document.getElementById("resetButton");

const menuButton =
    document.getElementById("menuButton");

const soundButton =
    document.getElementById("soundButton");

const modal =
    document.getElementById("modal");

const resultTitle =
    document.getElementById("resultTitle");

const resultText =
    document.getElementById("resultText");

const continueButton =
    document.getElementById("continueButton");

const playerInput =
    document.getElementById("playerName");

const playerDisplay =
    document.getElementById("playerDisplay");

const menuCoins =
    document.getElementById("menuCoins");

const gameCoins =
    document.getElementById("gameCoins");

const scoreElement =
    document.getElementById("score");

const turnDisplay =
    document.getElementById("turnDisplay");

const powerBar =
    document.getElementById("powerBar");

const cue =
    document.getElementById("cue");

const aimLine =
    document.getElementById("aimLine");

const aimPoint =
    document.getElementById("aimPoint");


/* =====================================================
   DADOS
===================================================== */

let save = null;
try{ save = JSON.parse(localStorage.getItem("sinucaBoteco")); }catch(e){}
save = save || {
    name:"Jogador",
    coins:250,
    wins:0,
    losses:0
};

playerInput.value = save.name;

menuCoins.textContent = save.coins;
gameCoins.textContent = save.coins;

let selectedTable = "#08733d";
let selectedCue = "#b87935";

let mode = "8ball";

let balls = [];
let whiteBall;

let aiming = false;

let mouseX = 0;
let mouseY = 0;

let score = 0;

let currentTurn = "player";

let soundOn = true;

let aiThinking = false;
let aiScore=0,shooter="player",shotActive=false,shotPots=0,gameOver=false,gameId=0,shotId=0;


/* =====================================================
   SALVAR
===================================================== */

function saveGame(){

    save.name =
        playerInput.value.trim() || "Jogador";

    save.coins =
        Math.max(0,save.coins);

    try{
        localStorage.setItem("sinucaBoteco",JSON.stringify(save));
    }catch(e){}

    menuCoins.textContent = save.coins;
    gameCoins.textContent = save.coins;
}


/* =====================================================
   MODO
===================================================== */

document.querySelectorAll(".mode")
.forEach(element => {

    element.addEventListener("click",() => {

        document.querySelectorAll(".mode")
        .forEach(x =>
            x.classList.remove("active")
        );

        element.classList.add("active");

        mode = element.dataset.mode;

    });

});


/* =====================================================
   MESA
===================================================== */

document.querySelectorAll(".table-option")
.forEach(element => {

    element.addEventListener("click",() => {

        document.querySelectorAll(".table-option")
        .forEach(x =>
            x.classList.remove("active")
        );

        element.classList.add("active");

        selectedTable =
            element.dataset.color;

    });

});


/* =====================================================
   TACOS
===================================================== */

document.querySelectorAll(".cue-option")
.forEach(element => {

    element.addEventListener("click",() => {

        if(element.dataset.cue === "#a51d18"){
            alert("🔒 Esse taco será desbloqueado em uma atualização!");
            return;
        }

        document.querySelectorAll(".cue-option")
        .forEach(x =>
            x.classList.remove("active")
        );

        element.classList.add("active");

        selectedCue =
            element.dataset.cue;

    });

});


/* =====================================================
   ÁUDIO
===================================================== */

let audioContext = null;

function sound(frequency,duration,type="sine"){

    if(!soundOn) return;
    if(audioContext && audioContext.state==="suspended") audioContext.resume();

    try{

        if(!audioContext){

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.frequency.value =
            frequency;

        oscillator.type = type;

        gain.gain.setValueAtTime(
            .08,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + duration
        );

    }catch(e){}

}


/* =====================================================
   COMEÇAR
===================================================== */

startButton.addEventListener("click",() => {

    saveGame();

    playerDisplay.textContent =
        save.name;

    table.style.background =
        selectedTable;

    cue.style.background =
        selectedCue;

    menu.style.display = "none";
    game.style.display = "flex";

    fitTable();
    resetGame();

});


/* =====================================================
   CRIAR BOLA
===================================================== */

function createBall(number,x,y,color){

    const element =
        document.createElement("div");

    element.className = "ball";

    element.style.background =
        color;

    if(number !== 0){

        const numberElement =
            document.createElement("div");

        numberElement.className =
            "ball-number";

        numberElement.textContent =
            number;

        element.appendChild(
            numberElement
        );

    }

    table.appendChild(element);

    return {
        number,
        x,
        y,
        vx:0,
        vy:0,
        color,
        element,
        active:true
    };

}



/* =====================================================
   AJUSTE RESPONSIVO (mesa sempre 2:1, cabe na tela)
===================================================== */
function fitTable(){
    const a=document.getElementById("gameArea"),aw=a.clientWidth,ah=a.clientHeight;
    if(!aw||!ah) return;
    const b=Math.max(10,Math.min(26,aw*.03));
    const w=Math.max(150,Math.min(aw-2*b-6,(ah-2*b-6)*2));
    table.style.width=w+"px";
    table.style.height=w/2+"px";
    table.style.borderWidth=b+"px";
    table.style.setProperty("--b",b+"px");
    table.style.setProperty("--bs",w*.03+"px");
}
window.addEventListener("resize",fitTable);
window.addEventListener("orientationchange",()=>setTimeout(fitTable,200));

/* Coordenadas lógicas: mesa = 200 x 100 (sem distorção) */
const BALL_D=6, R=3, POCKET_R=6.2;
const pockets=[[0,0],[100,0],[200,0],[0,100],[100,100],[200,100]];

let blackBy=null;
function setTurn(t){
    currentTurn=t;
    turnDisplay.textContent = mode==="practice" ? "Treino"
        : mode==="2p" ? "Vez de "+(t==="player"?save.name:"Jogador 2")
        : t==="player" ? "Sua vez" : "🤖 Vez da máquina";
}
function updateScore(){
    scoreElement.textContent = mode==="practice" ? score : score+" x "+aiScore;
}

function resetGame(){
    gameId++;
    document.querySelectorAll(".ball").forEach(x=>x.remove());
    balls=[]; score=0; aiScore=0; blackBy=null; gameOver=false; shotActive=false; aiThinking=false;
    updateScore();
    whiteBall=createBall(0,40,50,"#fff");
    balls.push(whiteBall);
    const colors=["#f0d21a","#164da3","#d9272e","#762ba7","#e47a1d","#178c4b","#8b2e16"];
    const d=BALL_D+.15, dx=d*.87, rows=[1,2,3,2];
    let n=0;
    rows.forEach((cnt,k)=>{
        for(let i=0;i<cnt;i++){
            const x=150+(k-2)*dx, y=50+(i-(cnt-1)/2)*d;
            if(k===2&&i===1) balls.push(createBall(8,x,y,"#111"));
            else { balls.push(createBall(n+1,x,y,colors[n])); n++; }
        }
    });
    setTurn("player");
    hideAim();
    modal.style.display="none";
    updateDOM();
}

function updateDOM(){
    balls.forEach(b=>{
        if(!b.active) return;
        b.element.style.left=b.x/2+"%";
        b.element.style.top=b.y+"%";
    });
}

function ballsMoving(){
    return balls.some(b=>b.active&&(b.vx!==0||b.vy!==0));
}

function hideAim(){
    cue.style.display=aimLine.style.display=aimPoint.style.display="none";
    powerBar.style.width="0%";
}

/* =====================================================
   MIRA (mouse e toque)
===================================================== */
const MAX_PULL=18;
function aimData(){
    const rect=table.getBoundingClientRect();
    const dx=mouseX-(rect.left+whiteBall.x/200*rect.width);
    const dy=mouseY-(rect.top+whiteBall.y/100*rect.height);
    const dist=Math.hypot(dx,dy);
    return {rect,dist,angle:Math.atan2(dy,dx),pull:Math.min(dist/rect.width*100,MAX_PULL)};
}
function updateAim(){
    if(!whiteBall||!whiteBall.active) return;
    const {dist,angle,pull}=aimData();
    if(dist<3){hideAim();return;}
    const gap=4+pull*.5, ca=Math.cos(angle), sa=Math.sin(angle);
    cue.style.display="block";
    cue.style.left=(whiteBall.x+ca*gap)/2+"%";
    cue.style.top=(whiteBall.y+sa*gap)+"%";
    cue.style.width="38%";
    cue.style.transform=`translateY(-50%) rotate(${angle}rad)`;
    aimLine.style.display="block";
    aimLine.style.left=whiteBall.x/2+"%";
    aimLine.style.top=whiteBall.y+"%";
    aimLine.style.width="28%";
    aimLine.style.transform=`rotate(${angle+Math.PI}rad)`;
    aimPoint.style.display="block";
    aimPoint.style.left=(whiteBall.x-ca*8)/2+"%";
    aimPoint.style.top=(whiteBall.y-sa*8)+"%";
    powerBar.style.width=pull/MAX_PULL*100+"%";
}

const area=document.getElementById("gameArea");
area.addEventListener("contextmenu",e=>e.preventDefault());
area.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0) return;
    if(!(currentTurn==="player"||(mode==="2p"&&currentTurn==="ai"))||gameOver||ballsMoving()||!whiteBall.active) return;
    aiming=true; mouseX=e.clientX; mouseY=e.clientY;
    updateAim(); e.preventDefault();
});
window.addEventListener("pointermove",e=>{
    if(!aiming) return;
    mouseX=e.clientX; mouseY=e.clientY; updateAim();
});
window.addEventListener("pointercancel",()=>{aiming=false;hideAim();});
window.addEventListener("pointerup",e=>{
    if(!aiming) return;
    aiming=false;
    mouseX=e.clientX; mouseY=e.clientY;
    if(!whiteBall.active||gameOver){hideAim();return;}
    const who=currentTurn==="ai"?"ai":"player";
    const {dist,angle,pull}=aimData();
    hideAim();
    if(dist<3) return;
    const p=Math.pow(pull/MAX_PULL,1.15)*3.4;
    startShot(who,-Math.cos(angle)*p,-Math.sin(angle)*p);
});

function startShot(who,vx,vy){
    whiteBall.vx=vx; whiteBall.vy=vy;
    shooter=who; shotActive=true; shotPots=0;
    currentTurn="busy";
    turnDisplay.textContent = who==="ai"&&mode==="8ball" ? "🤖 Jogando..." : "Bolas rolando...";
    sound(120,.12,"triangle");
}

/* =====================================================
   FÍSICA
===================================================== */
function wallCollision(b){
    let hit=false;
    if(b.x<R){b.x=R;b.vx=Math.abs(b.vx)*.82;hit=true;}
    if(b.x>200-R){b.x=200-R;b.vx=-Math.abs(b.vx)*.82;hit=true;}
    if(b.y<R){b.y=R;b.vy=Math.abs(b.vy)*.82;hit=true;}
    if(b.y>100-R){b.y=100-R;b.vy=-Math.abs(b.vy)*.82;hit=true;}
    if(hit&&Math.hypot(b.vx,b.vy)>.4) sound(80,.04);
}

function ballCollision(a,b){
    if(!a.active||!b.active) return;
    const dx=b.x-a.x, dy=b.y-a.y, dist=Math.hypot(dx,dy);
    if(dist<=0||dist>=BALL_D) return;
    const nx=dx/dist, ny=dy/dist, ov=BALL_D-dist;
    a.x-=nx*ov/2; a.y-=ny*ov/2; b.x+=nx*ov/2; b.y+=ny*ov/2;
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(rel>0){
        const imp=-1.94*rel/2;
        a.vx+=imp*nx; a.vy+=imp*ny; b.vx-=imp*nx; b.vy-=imp*ny;
        if(rel>.3) sound(180,.035,"square");
    }
}

function pocketCheck(ball){
    for(const p of pockets){
        if(Math.hypot(ball.x-p[0],ball.y-p[1])<POCKET_R){
            ball.active=false; ball.vx=ball.vy=0;
            ball.element.style.display="none";
            sound(330,.15,"sine");
            if(ball.number!==0){
                if(ball.number===8) blackBy=shooter;
                else { if(shooter==="player") score++; else aiScore++; shotPots++; }
                updateScore();
                createPocketEffect(ball.x,ball.y);
            }
            return;
        }
    }
}

function createPocketEffect(x,y){
    const e=document.createElement("div");
    e.style.cssText=`position:absolute;left:${x/2}%;top:${y}%;width:10px;height:10px;border:2px solid #ffd56a;border-radius:50%;pointer-events:none;z-index:20;transform:translate(-50%,-50%)`;
    table.appendChild(e);
    e.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate(-50%,-50%) scale(5)",opacity:0}],{duration:400});
    setTimeout(()=>e.remove(),450);
}

function physicsStep(){
    for(let s=0;s<2;s++){
        balls.forEach(b=>{
            if(!b.active) return;
            b.x+=b.vx*.5; b.y+=b.vy*.5;
            wallCollision(b); pocketCheck(b);
        });
        for(let i=0;i<balls.length;i++)
            for(let j=i+1;j<balls.length;j++) ballCollision(balls[i],balls[j]);
    }
    balls.forEach(b=>{
        if(!b.active) return;
        b.vx*=.985; b.vy*=.985;
        if(Math.hypot(b.vx,b.vy)<.02) b.vx=b.vy=0;
    });
}

/* =====================================================
   IA
===================================================== */
function aiTurn(){
    if(mode!=="8ball"||currentTurn!=="ai"||gameOver||aiThinking||ballsMoving()||!whiteBall.active) return;
    aiThinking=true;
    const id=gameId;
    setTimeout(()=>{
        aiThinking=false;
        if(id!==gameId||gameOver||currentTurn!=="ai") return;
        const targets=balls.filter(b=>b.number!==0&&b.active);
        if(!targets.length) return;
        let best=null,bs=1e9;
        targets.forEach(t=>pockets.forEach(p=>{
            const tx=p[0]-t.x, ty=p[1]-t.y, tl=Math.hypot(tx,ty)||1;
            const gx=t.x-tx/tl*BALL_D, gy=t.y-ty/tl*BALL_D;
            const sc=Math.hypot(gx-whiteBall.x,gy-whiteBall.y)+tl;
            if(sc<bs){bs=sc;best={gx,gy};}
        }));
        const dist=Math.hypot(best.gx-whiteBall.x,best.gy-whiteBall.y);
        const ang=Math.atan2(best.gy-whiteBall.y,best.gx-whiteBall.x)+(Math.random()-.5)*.1;
        const p=Math.min(3.2,1.2+dist/45+Math.random()*.5);
        startShot("ai",Math.cos(ang)*p,Math.sin(ang)*p);
    },800);
}

/* =====================================================
   FIM DA JOGADA / TURNOS
===================================================== */
function turnManager(){
    if(!shotActive||ballsMoving()) return;
    shotActive=false;
    let scratch=false;
    if(!whiteBall.active){
        scratch=true;
        whiteBall.active=true; whiteBall.vx=whiteBall.vy=0;
        whiteBall.element.style.display="block";
        for(let x=40;x>R;x-=7){
            whiteBall.x=x; whiteBall.y=50;
            if(!balls.some(b=>b!==whiteBall&&b.active&&Math.hypot(b.x-x,50-b.y)<BALL_D+1)) break;
        }
        updateDOM();
    }
    const left=balls.filter(b=>b.number!==0&&b.active).length;
    if(blackBy){ finish(mode==="practice"?"lose":blackBy==="player"?"p2":"p1","black"); return; }
    if(mode==="practice"){ if(left===0){ finish("win"); return; } }
    else if(score>=4){ finish("p1"); return; }
    else if(aiScore>=4){ finish("p2"); return; }
    if(mode==="practice") setTurn("player");
    else if(!scratch&&shotPots>0) setTurn(shooter);
    else setTurn(shooter==="player"?"ai":"player");
}

function finish(kind,why){
    gameOver=true;
    const extra=why==="black"?"<br>A bola 8 caiu antes da hora!":"";
    const p1win = kind==="win"||kind==="p1";
    if(mode==="2p"){
        const w=p1win?save.name:"Jogador 2";
        resultTitle.textContent="🏆 "+w+" VENCEU!";
        resultText.innerHTML=`Placar: ${score} x ${aiScore}${extra}`;
    }else if(p1win){
        const prize=mode==="practice"?20:100;
        save.wins++; save.coins+=prize; saveGame();
        resultTitle.textContent="🏆 VITÓRIA!";
        resultText.innerHTML=`Você ${mode==="practice"?"limpou a mesa":"venceu a máquina"}!${extra}<br>+${prize} moedas<br><br>Vitórias: ${save.wins}`;
    }else{
        save.losses=(save.losses||0)+1; saveGame();
        resultTitle.textContent="💀 DERROTA";
        resultText.innerHTML=mode==="practice"?`Você derrubou a bola 8 antes da hora.<br><br>Tente de novo!`:`A máquina levou essa. Placar: ${score} x ${aiScore}${extra}<br><br>Tente de novo!`;
    }
    setTimeout(()=>{ if(gameOver) modal.style.display="flex"; },500);
}

menuButton.addEventListener("click",()=>{
    modal.style.display="none"; game.style.display="none"; menu.style.display="flex";
    gameId++; aiThinking=false; aiming=false; saveGame();
});
continueButton.addEventListener("click",resetGame);
resetButton.addEventListener("click",resetGame);
soundButton.addEventListener("click",()=>{
    soundOn=!soundOn; soundButton.textContent=soundOn?"🔊":"🔇";
});

/* =====================================================
   LOOP (passo fixo de 60Hz, igual em qualquer tela)
===================================================== */
let lastT=0,acc=0;
function gameLoop(t){
    acc+=Math.min(t-lastT,100); lastT=t;
    while(acc>=1000/60){ physicsStep(); acc-=1000/60; }
    updateDOM(); turnManager(); aiTurn();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(t=>{lastT=t;gameLoop(t);});

saveGame();