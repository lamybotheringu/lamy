/* ================= GLOBAL CONFIGURATION & STATE ================= */
const chatStorageKey = "lamyChatMessages";
const chatNameKey = "lamyChatName";
const memoryEmojis = ["🩷","🌸","🍣","😝","🌹","🎥","🎮","🎧","🐰","🐇"];

/* ================= APP CORE / NAVIGATION ================= */
function show(id){
  document.querySelectorAll("section").forEach(s => {
    s.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if(target) target.classList.remove("hidden");
}

/* ================= PERSISTENT CHAT ENGINE ================= */
function addChatMessage(name, msg, save = true){
  const box = document.getElementById("box");
  if(!box){ console.warn('Chat box element not found'); return; }
  
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
  
  const messages = Array.from(box.querySelectorAll(".chat-message")).map(el => {
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
    try {
      const messages = JSON.parse(stored);
      messages.forEach(m => addChatMessage(m.name, m.msg, false));
    } catch (e) {
      console.error("Error parsing stored chat messages:", e);
    }
  }
  const savedName = localStorage.getItem(chatNameKey);
  if(savedName){
    const nameEl = document.getElementById("name");
    if(nameEl) nameEl.value = savedName;
  }
}

function send(){
  const nameField = document.getElementById("name");
  const msgField = document.getElementById("msg");
  if(!nameField || !msgField) return;

  const name = nameField.value.trim();
  const msg = msgField.value.trim();

  if(name === ""){
    alert("الاسم مطلوب!");
    return;
  }

  if(msg === ""){
    alert("لا يمكنك ترك رسالة فارغة");
    return;
  }

  localStorage.setItem(chatNameKey, name);
  addChatMessage(name, msg);
  msgField.value = "";
}

/* ================= CLICKER GAME (TREE GROWTH MODULE) ================= */
let score = 0;
let treeWins = 0;

function clickMe(){
  score++;
  const scoreEl = document.getElementById("clickScore");
  if(scoreEl) scoreEl.textContent = "Score: " + score;
  
  // Tree progression calculation
  let treeStage = "🌱";
  if(score >= 100) treeStage = "🌳";
  else if(score >= 75) treeStage = "🌳";
  else if(score >= 50) treeStage = "🌲";
  else if(score >= 25) treeStage = "🌿";
  
  const treeVis = document.getElementById("treeVisualization");
  if(treeVis) treeVis.textContent = treeStage;
  
  // Milestones reached
  if(score === 100){
    const treeMsg = document.getElementById("treeMessage");
    const treeRetryBtn = document.getElementById("treeRetry");
    const treeCountEl = document.getElementById("treeCount");

    if(treeMsg) treeMsg.classList.remove("hidden");
    if(treeRetryBtn) treeRetryBtn.classList.remove("hidden");
    
    treeWins++;
    if(treeCountEl) treeCountEl.textContent = "Tree count: " + treeWins;
  }
}

function retryTree(){
  score = 0;
  const scoreEl = document.getElementById("clickScore");
  if(scoreEl) scoreEl.textContent = "Score: 0";
  
  const treeVis = document.getElementById("treeVisualization");
  if(treeVis) treeVis.textContent = "🌱";
  
  const treeMsg = document.getElementById("treeMessage");
  const treeRetryBtn = document.getElementById("treeRetry");
  if(treeMsg) treeMsg.classList.add("hidden");
  if(treeRetryBtn) treeRetryBtn.classList.add("hidden");
}

/* ================= XO GAME (INTELLIGENT VS BOT) ================= */
let board = ["","","","","","","","",""];
let xoWins = 0;
let xoGameOver = false;

const winLines = [
  [0,1,2], [3,4,5], [6,7,8], // Rows
  [0,3,6], [1,4,7], [2,5,8], // Columns
  [0,4,8], [2,4,6]           // Diagonals
];

function draw(){
  const b = document.getElementById("xoBoard");
  if(!b) return;
  b.innerHTML = "";

  board.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = c;
    d.onclick = () => play(i);
    b.appendChild(d);
  });
}

function play(i){
  if(board[i] === "" && !xoGameOver){
    board[i] = "X";
    let winner = checkWinner();
    if(!winner){
      bot();
      winner = checkWinner();
    }
    draw();
    if(winner){
      if(winner === "X"){
        handleXOResult("win");
      } else {
        handleXOResult("lose");
      }
      xoGameOver = true;
    } else if(isBoardFull()){
      handleXOResult("draw");
      xoGameOver = true;
    }
    updateXOReset();
  }
}

function bot(){
  if(isGameFinished() || xoGameOver) return;
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  const pick = empty[Math.floor(Math.random() * empty.length)];
  if(pick !== undefined) board[pick] = "O";
}

function checkWinner(){
  for(const [a, b, c] of winLines){
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      return board[a];
    }
  }
  return null;
}

function isBoardFull(){
  return board.every(cell => cell !== "");
}

function isGameFinished(){
  return Boolean(checkWinner() || isBoardFull());
}

function updateXOReset(){
  const resetButton = document.getElementById("xoReset");
  if(!resetButton) return;
  if(isGameFinished()){
    resetButton.classList.remove("hidden");
  } else {
    resetButton.classList.add("hidden");
  }
}

function handleXOResult(result){
  const message = document.getElementById("xoMessage");
  if(!message) return;

  if(result === "win"){
    xoWins++;
    const winsEl = document.getElementById("xoWins");
    if(winsEl) winsEl.textContent = "Wins: " + xoWins;
    message.textContent = "You won!";
  } else if(result === "lose"){
    message.textContent = "You lost!";
  } else if(result === "draw"){
    message.textContent = "Draw!";
  }
  message.classList.remove("hidden");
}

function clearXOMessage(){
  const message = document.getElementById("xoMessage");
  if(!message) return;
  message.textContent = "";
  message.classList.add("hidden");
}

function resetXO(){
  board = ["","","","","","","","",""];
  xoGameOver = false;
  draw();
  updateXOReset();
  clearXOMessage();
}

/* ================= MULTI-MODE MEMORY MATCH GAME ================= */
let memoryMode = "easy";
let memoryBoardState = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLocked = false;
let memoryWins = 0;

function setMemoryMode(mode){
  memoryMode = mode;
  const easyBtn = document.getElementById("memoryEasy");
  const medBtn = document.getElementById("memoryMedium");
  const hardBtn = document.getElementById("memoryHard");
  if(easyBtn) easyBtn.classList.toggle("active", mode === "easy");
  if(medBtn) medBtn.classList.toggle("active", mode === "medium");
  if(hardBtn) hardBtn.classList.toggle("active", mode === "hard");
  
  const statusText = mode === "easy" ? "الوضع السهل: 4 أزواج" : (mode === "medium" ? "الوضع المتوسط: 6 أزواج" : "الوضع الصعب: 10 أزواج");
  const statusEl = document.getElementById("memoryStatus");
  if(statusEl) statusEl.textContent = statusText;
  startMemoryGame();
}

function startMemoryGame(){
  const count = memoryMode === "easy" ? 4 : (memoryMode === "medium" ? 6 : 10);
  let emojis = memoryEmojis.slice(0, count);

  if(emojis.length < count){
    let i = 0;
    while(emojis.length < count){
      emojis.push(memoryEmojis[i % memoryEmojis.length]);
      i++;
    }
  }
  const pairs = [...emojis, ...emojis];
  memoryBoardState = pairs.sort(() => Math.random() - 0.5);
  memoryFlipped = [];
  memoryMatched = [];
  memoryLocked = false;
  renderMemoryBoard();
  
  const statusEl = document.getElementById("memoryStatus");
  if(statusEl) statusEl.textContent = "ابدأ الاختيار وافتح البطاقات بنفسك";
}

function renderMemoryBoard(){
  const boardEl = document.getElementById("memoryBoard");
  if(!boardEl) return;
  boardEl.innerHTML = "";
  
  memoryBoardState.forEach((emoji, idx) => {
    const card = document.createElement("button");
    card.className = "memory-card" + (memoryMatched.includes(idx) ? " matched" : "") + (memoryFlipped.includes(idx) ? " flipped" : "");
    card.textContent = memoryFlipped.includes(idx) || memoryMatched.includes(idx) ? emoji : "";
    card.onclick = () => flipMemoryCard(idx);
    boardEl.appendChild(card);
  });
}

function flipMemoryCard(index){
  if(memoryLocked || memoryFlipped.includes(index) || memoryMatched.includes(index)) return;
  memoryFlipped.push(index);
  renderMemoryBoard();
  if(memoryFlipped.length === 2){
    memoryLocked = true;
    setTimeout(checkMemoryMatch, 700);
  }
}

function checkMemoryMatch(){
  const [first, second] = memoryFlipped;
  const statusEl = document.getElementById("memoryStatus");

  if(memoryBoardState[first] === memoryBoardState[second]){
    memoryMatched.push(first, second);
    if(statusEl) statusEl.textContent = "مبارك! تم العثور على زوج.";
  } else {
    if(statusEl) statusEl.textContent = "حاول مرة أخرى.";
  }
  memoryFlipped = [];
  memoryLocked = false;
  renderMemoryBoard();

  if(memoryMatched.length === memoryBoardState.length){
    memoryWins++;
    const winsEl = document.getElementById("memoryWins");
    if(winsEl) winsEl.textContent = "Wins: " + memoryWins;
    if(statusEl) statusEl.textContent = "انتهت اللعبة! اضغط play again للعب مرة أخرى";
    const retryEl = document.getElementById("memoryRetry");
    if(retryEl) retryEl.classList.remove("hidden");
  }
}

function retryMemoryGame(){
  startMemoryGame();
  const retryEl = document.getElementById("memoryRetry");
  if(retryEl) retryEl.classList.add("hidden");
}

/* ================= ADVANCED BUNNY ARCADE ENGINE ================= */
function initBunnyGame(){
  const game = document.getElementById('bunnyGame');
  if(!game) return;

  const bunny = document.getElementById('bunny');
  const heartTemplate = document.getElementById('heartTemplate');
  const obstacle = document.getElementById('redObstacle');
  const scoreEl = document.getElementById('bunnyScore');
  const overlay = document.getElementById('bunnyOverlay');
  const finalScore = document.getElementById('bunnyFinalScore');
  const playAgainBtn = document.getElementById('bunnyPlayAgain');
  
  if(!bunny || !heartTemplate || !obstacle || !scoreEl || !overlay || !finalScore || !playAgainBtn) return;

  // Mechanics and physics simulation values
  let vy = 0; 
  const gravity = 0.9;
  const jumpVel = -13;
  let bunnyY = 0; 
  let onGround = true;
  let isRunning = true;
  let gameScore = 0;

  let hearts = []; 
  let lastSpawn = 0;
  const spawnInterval = 1400;

  let obstacleX = game.clientWidth + 80;
  let obstacleSpeed = 3.2;

  function resizeInit(){
    obstacleX = game.clientWidth + 80;
    bunnyY = 0;
    setBunnyPos();
  }

  function setBunnyPos(){
    const ground = 16; 
    bunny.style.bottom = (ground + bunnyY) + 'px';
  }

  function doJump(){
    if(!isRunning) return;
    if(onGround){ vy = jumpVel; onGround = false; }
  }

  function spawnHeart(){
    const el = heartTemplate.cloneNode(true);
    el.id = '';
    el.classList.remove('hidden');
    el.classList.add('collectible');
    const startX = game.clientWidth + 20;
    const maxY = Math.max(40, game.clientHeight - 120);
    const y = Math.floor(Math.random() * maxY) + 40;
    el.style.left = startX + 'px';
    el.style.top = y + 'px';
    game.appendChild(el);
    hearts.push({el, x: startX, y});
  }

  function collectHeart(i){
    try{
      const h = hearts[i];
      if(h && h.el && h.el.parentNode){
        game.removeChild(h.el);
      }
    }catch(e){}
    hearts.splice(i,1);
    gameScore += 1;
    scoreEl.textContent = 'Score: ' + gameScore;
  }

  // State changes
  function showGameOver(){
    isRunning = false;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    finalScore.textContent = 'Score: ' + gameScore;
  }

  function resetGame(){
    hearts.forEach(h => { 
      try{ if(h.el && h.el.parentNode) h.el.parentNode.removeChild(h.el); } catch(e){} 
    });
    hearts = [];
    gameScore = 0;
    scoreEl.textContent = 'Score: 0';
    vy = 0; bunnyY = 0; onGround = true; isRunning = true;
    obstacleX = game.clientWidth + 80;
    obstacle.style.left = (obstacleX) + 'px';
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    lastSpawn = performance.now();
  }

  // Animation and collision pipeline loop
  function loop(t){
    if(!isRunning){ requestAnimationFrame(loop); return; }

    // Logic: Collectible generation
    if(t - lastSpawn > spawnInterval){
      lastSpawn = t;
      spawnHeart();
    }

    // Logic: Gravity calculations
    vy += gravity;
    bunnyY += vy;
    if(bunnyY > 220) bunnyY = 220;
    if(bunnyY < 0){ bunnyY = 0; vy = 0; onGround = true; }
    setBunnyPos();

    // Logic: Item translations & hitboxing
    for(let i = hearts.length - 1; i >= 0; i--){
      const h = hearts[i];
      h.x -= 3; 
      if(h.el) h.el.style.left = h.x + 'px';
      
      if(h.x < -60){ 
        try{ if(h.el && h.el.parentNode) h.el.parentNode.removeChild(h.el); } catch(e){} 
        hearts.splice(i,1); 
        continue; 
      }
      
      try{
        const hb = h.el.getBoundingClientRect();
        const bb = bunny.getBoundingClientRect();
        const overlap = !(hb.right < bb.left || hb.left > bb.right || hb.bottom < bb.top || hb.top > bb.bottom);
        if(overlap){ collectHeart(i); }
      }catch(e){}
    }

    // Logic: Hazard movement
    obstacleX -= obstacleSpeed;
    if(obstacleX < -120){
      obstacleX = game.clientWidth + Math.random() * 300 + 80;
      obstacleSpeed = 2.6 + Math.random() * 1.4;
    }
    obstacle.style.left = obstacleX + 'px';

    // Logic: Dynamic crash validation
    try{
      const ob = obstacle.getBoundingClientRect();
      const bb = bunny.getBoundingClientRect();
      const hit = !(ob.right < bb.left || ob.left > bb.right || ob.bottom < bb.top || ob.top > bb.bottom);
      if(hit){ showGameOver(); }
    }catch(e){}

    requestAnimationFrame(loop);
  }

  // Input listeners
  window.addEventListener('resize', resizeInit);
  game.addEventListener('click', () => { doJump(); });
  window.addEventListener('keydown', (e) => { 
    if(e.code === 'Space' || e.keyCode === 32){ 
      e.preventDefault(); 
      doJump(); 
    } 
  });
  playAgainBtn.addEventListener('click', (e) => { e.preventDefault(); resetGame(); });

  // Bootstrapping the subsystem
  resizeInit();
  lastSpawn = performance.now();
  requestAnimationFrame(loop);
}

/* ================= CENTRAL LIFE CYCLE APP INITS ================= */
function initApp(){
  try{
    draw();
    loadChatMessages();
    updateXOReset();
    
    const clickEl = document.getElementById('clickScore'); 
    if(clickEl) clickEl.textContent = "Score: " + score;
    
    if(document.getElementById("memoryBoard")){
      try { setMemoryMode(memoryMode); } catch(e){ console.error('Memory matrix initialization failed:', e); }
    }
    
    try{ initBunnyGame(); } catch(e){ /* Fallback sequence handles omission gracefully */ }
  } catch(initErr){
    console.error('Core applications bootstrap failed:', initErr);
  }
}

// ReadyState safety wrapper to prevent premature DOM manipulations
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
