const chatStorageKey = "lamyChatMessages";
const chatNameKey = "lamyChatName";

/* ================= NAV ================= */

function show(id){
  document.querySelectorAll("section").forEach(s=>{
    s.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if(target) target.classList.remove("hidden");
}

/* ================= CHAT ================= */

function addChatMessage(name, msg, save = true){
  const box = document.getElementById("box");
  if(!box) return;

  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = name + ": " + msg;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;

  if(save) saveChatMessages();
}

function saveChatMessages(){
  const box = document.getElementById("box");
  if(!box) return;

  const messages = Array.from(box.querySelectorAll(".chat-message")).map(el=>{
    const text = el.textContent;
    const split = text.indexOf(": ");
    return {
      name: split !== -1 ? text.slice(0, split) : text,
      msg: split !== -1 ? text.slice(split + 2) : ""
    };
  });

  localStorage.setItem(chatStorageKey, JSON.stringify(messages));
}

function loadChatMessages(){
  const stored = localStorage.getItem(chatStorageKey);

  if(stored){
    try{
      JSON.parse(stored).forEach(m=>{
        addChatMessage(m.name, m.msg, false);
      });
    }catch(e){
      console.error(e);
    }
  }

  const savedName = localStorage.getItem(chatNameKey);
  const nameEl = document.getElementById("name");
  if(savedName && nameEl) nameEl.value = savedName;
}

function send(){
  const nameEl = document.getElementById("name");
  const msgEl = document.getElementById("msg");

  const name = nameEl.value.trim();
  const msg = msgEl.value.trim();

  if(!name) return alert("الاسم مطلوب!");
  if(!msg) return alert("اكتب رسالة!");

  localStorage.setItem(chatNameKey, name);

  addChatMessage(name, msg);

  msgEl.value = "";
}

/* ================= CLICKER ================= */

let score = 0;
let treeWins = 0;

function clickMe(){
  score++;

  const scoreEl = document.getElementById("clickScore");
  const treeEl = document.getElementById("treeVisualization");

  if(scoreEl) scoreEl.textContent = "Score: " + score;

  let treeStage = "🌱";
  if(score >= 75) treeStage = "🌳";
  else if(score >= 50) treeStage = "🌲";
  else if(score >= 25) treeStage = "🌿";

  if(treeEl) treeEl.textContent = treeStage;

  if(score === 100){
    const msg = document.getElementById("treeMessage");
    const retry = document.getElementById("treeRetry");
    const count = document.getElementById("treeCount");

    if(msg) msg.classList.remove("hidden");
    if(retry) retry.classList.remove("hidden");

    treeWins++;
    if(count) count.textContent = "Tree count: " + treeWins;
  }
}

function retryTree(){
  score = 0;

  const scoreEl = document.getElementById("clickScore");
  const treeEl = document.getElementById("treeVisualization");
  const msg = document.getElementById("treeMessage");
  const retry = document.getElementById("treeRetry");

  if(scoreEl) scoreEl.textContent = "Score: 0";
  if(treeEl) treeEl.textContent = "🌱";
  if(msg) msg.classList.add("hidden");
  if(retry) retry.classList.add("hidden");
}

/* ================= XO ================= */

let board = ["","","","","","","","",""];
let xoGameOver = false;
let xoWins = 0;

function draw(){
  const b = document.getElementById("xoBoard");
  if(!b) return;

  b.innerHTML = "";

  board.forEach((c,i)=>{
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = c;
    d.onclick = ()=>play(i);
    b.appendChild(d);
  });
}

const winLines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function play(i){
  if(board[i] || xoGameOver) return;

  board[i] = "X";

  let winner = checkWinner();
  if(!winner){
    bot();
    winner = checkWinner();
  }

  draw();

  if(winner){
    xoGameOver = true;
    handleXO(winner === "X" ? "win" : "lose");
  }else if(board.every(c=>c)){
    xoGameOver = true;
    handleXO("draw");
  }

  updateXOReset();
}

function bot(){
  const empty = board.map((v,i)=>v===""?i:null).filter(v=>v!==null);
  const pick = empty[Math.floor(Math.random()*empty.length)];
  if(pick !== undefined) board[pick] = "O";
}

function checkWinner(){
  for(const [a,b,c] of winLines){
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      return board[a];
    }
  }
  return null;
}

function handleXO(type){
  const msg = document.getElementById("xoMessage");
  const wins = document.getElementById("xoWins");

  if(type === "win"){
    xoWins++;
    if(wins) wins.textContent = "Wins: " + xoWins;
    if(msg) msg.textContent = "You won!";
  }else if(type === "lose"){
    if(msg) msg.textContent = "You lost!";
  }else{
    if(msg) msg.textContent = "Draw!";
  }

  if(msg) msg.classList.remove("hidden");
}

function updateXOReset(){
  const btn = document.getElementById("xoReset");
  if(!btn) return;

  if(board.some(c=>c) && !xoGameOver){
    btn.classList.add("hidden");
  }else{
    btn.classList.remove("hidden");
  }
}

function resetXO(){
  board = ["","","","","","","","",""];
  xoGameOver = false;

  const msg = document.getElementById("xoMessage");
  if(msg){
    msg.textContent = "";
    msg.classList.add("hidden");
  }

  draw();
  updateXOReset();
}

/* ================= MEMORY ================= */

const memoryEmojis = ["🩷","🌸","🍣","😝","🌹","🎮","🐰","🐇"];

let memoryMode = "easy";
let memoryBoard = [];
let flipped = [];
let matched = [];
let locked = false;
let memoryWins = 0;

function setMemoryMode(mode){
  memoryMode = mode;
  startMemoryGame();
}

function startMemoryGame(){
  let count = memoryMode === "easy" ? 4 : memoryMode === "medium" ? 6 : 8;

  let items = memoryEmojis.slice(0, count);
  const pairs = [...items, ...items];

  memoryBoard = pairs.sort(()=>Math.random()-0.5);
  flipped = [];
  matched = [];
  locked = false;

  renderMemory();
}

function renderMemory(){
  const board = document.getElementById("memoryBoard");
  if(!board) return;

  board.innerHTML = "";

  memoryBoard.forEach((e,i)=>{
    const btn = document.createElement("button");
    btn.className = "memory-card";

    if(flipped.includes(i) || matched.includes(i)){
      btn.textContent = e;
    }

    btn.onclick = ()=>flip(i);
    board.appendChild(btn);
  });
}

function flip(i){
  if(locked || flipped.includes(i) || matched.includes(i)) return;

  flipped.push(i);
  renderMemory();

  if(flipped.length === 2){
    locked = true;

    setTimeout(()=>{
      const [a,b] = flipped;

      if(memoryBoard[a] === memoryBoard[b]){
        matched.push(a,b);
      }

      flipped = [];
      locked = false;

      renderMemory();
    },600);
  }
}

function retryMemoryGame(){
  startMemoryGame();
}

/* ================= INIT ================= */

function initApp(){
  draw();
  loadChatMessages();
  updateXOReset();
  startMemoryGame();

  if(document.getElementById("bunnyGame")){
    initBunnyGame();
  }
}

if(document.readyState === "loading"){
  window.addEventListener("DOMContentLoaded", initApp);
}else{
  initApp();
}

/* ================= BUNNY GAME ================= */

function initBunnyGame(){
  const game = document.getElementById("bunnyGame");
  if(!game) return;

  const bunny = document.getElementById("bunny");
  const obstacle = document.getElementById("redObstacle");
  const scoreEl = document.getElementById("bunnyScore");
  const overlay = document.getElementById("bunnyOverlay");
  const finalScore = document.getElementById("bunnyFinalScore");
  const playAgain = document.getElementById("bunnyPlayAgain");

  let y = 0;
  let vy = 0;
  let gravity = 0.8;
  let jump = -12;
  let running = true;
  let score = 0;

  let hearts = [];
  let obsX = game.clientWidth + 100;

  function jumpFn(){
    if(running && y === 0){
      vy = jump;
    }
  }

  function loop(){
    if(!running){
      requestAnimationFrame(loop);
      return;
    }

    vy += gravity;
    y += vy;

    if(y > 0){
      y = 0;
      vy = 0;
    }

    bunny.style.bottom = (16 + -y) + "px";

    obsX -= 3;
    obstacle.style.left = obsX + "px";

    if(obsX < -100){
      obsX = game.clientWidth + 100;
    }

    requestAnimationFrame(loop);
  }

  game.onclick = jumpFn;
  window.addEventListener("keydown", e=>{
    if(e.code === "Space"){
      e.preventDefault();
      jumpFn();
    }
  });

  playAgain.onclick = ()=>{
    location.reload();
  };

  loop();
}
