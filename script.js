const chatStorageKey = "lamyChatMessages";
const chatNameKey = "lamyChatName";

function show(id){
  document.querySelectorAll("section").forEach(s=>{
    s.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if(target) target.classList.remove("hidden");
}

function addChatMessage(name, msg, save = true){
  const box = document.getElementById("box");
  if(!box){ console.warn('chat box not found'); return; }
  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = name + ": " + msg;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  if(save) saveChatMessages();
}

function saveChatMessages(){
  const box = document.getElementById("box");
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
      console.error(e);
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

/* CLICKER */
let score = 0;
let treeWins = 0;
function clickMe(){
  score++;
  document.getElementById("clickScore").textContent = "Score: " + score;
  
  // Tree growth logic
  let treeStage = "🌱";
  if(score >= 100) treeStage = "🌳";
  else if(score >= 75) treeStage = "🌳";
  else if(score >= 50) treeStage = "🌲";
  else if(score >= 25) treeStage = "🌿";
  
  document.getElementById("treeVisualization").textContent = treeStage;
  
  // Show message when reaching 100 clicks
  if(score === 100){
    document.getElementById("treeMessage").classList.remove("hidden");
    document.getElementById("treeRetry").classList.remove("hidden");
    treeWins++;
    document.getElementById("treeCount").textContent = "Tree count: " + treeWins;
  }
}

function retryTree(){
  score = 0;
  document.getElementById("clickScore").textContent = "Score: 0";
  document.getElementById("treeVisualization").textContent = "🌱";
  document.getElementById("treeMessage").classList.add("hidden");
  document.getElementById("treeRetry").classList.add("hidden");
}

/* XO */
let board = ["","","","","","","","",""];
let xoWins = 0;
let xoGameOver = false;

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
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

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
  const empty = board.map((v,i)=>v === "" ? i : null).filter(v=>v !== null);
  const pick = empty[Math.floor(Math.random() * empty.length)];
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
  if(result === "win"){
    xoWins++;
    document.getElementById("xoWins").textContent = "Wins: " + xoWins;
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

const memoryEmojis = ["🩷","🌸","🍣","😝","🌹","🎥","🎮","🎧","🐰","🐇"];
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
  // Ensure we have enough unique emojis by repeating if array is shorter than requested
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
  console.log('startMemoryGame', {mode: memoryMode, pairs: memoryBoardState.length, uniqueEmojis: emojis.length});
  const statusEl = document.getElementById("memoryStatus");
  if(statusEl) statusEl.textContent = "ابدأ الاختيار وافتح البطاقات بنفسك";
}

function renderMemoryBoard(){
  const board = document.getElementById("memoryBoard");
  if(!board) return;
  board.innerHTML = "";
  memoryBoardState.forEach((emoji, idx) => {
    const card = document.createElement("button");
    card.className = "memory-card" + (memoryMatched.includes(idx) ? " matched" : "") + (memoryFlipped.includes(idx) ? " flipped" : "");
    card.textContent = memoryFlipped.includes(idx) || memoryMatched.includes(idx) ? emoji : "";
    card.onclick = () => flipMemoryCard(idx);
    board.appendChild(card);
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
  if(memoryBoardState[first] === memoryBoardState[second]){
    memoryMatched.push(first, second);
    const statusEl = document.getElementById("memoryStatus");
    if(statusEl) statusEl.textContent = "مبارك! تم العثور على زوج.";
  } else {
    const statusEl = document.getElementById("memoryStatus");
    if(statusEl) statusEl.textContent = "حاول مرة أخرى.";
  }
  memoryFlipped = [];
  memoryLocked = false;
  renderMemoryBoard();
  if(memoryMatched.length === memoryBoardState.length){
    memoryWins++;
    const winsEl = document.getElementById("memoryWins");
    if(winsEl) winsEl.textContent = "Wins: " + memoryWins;
    const statusEl2 = document.getElementById("memoryStatus");
    if(statusEl2) statusEl2.textContent = "انتهت اللعبة! اضغط play again للعب مرة أخرى";
    const retryEl = document.getElementById("memoryRetry");
    if(retryEl) retryEl.classList.remove("hidden");
  }
}

function retryMemoryGame(){
  startMemoryGame();
  const retryEl = document.getElementById("memoryRetry");
  if(retryEl) retryEl.classList.add("hidden");
}

function initApp(){
  try{
    draw();
    loadChatMessages();
    updateXOReset();
    // ensure clicker UI shows current score
    const clickEl = document.getElementById('clickScore'); if(clickEl) clickEl.textContent = "Score: " + score;
    // init memory
    if(document.getElementById("memoryBoard")){
      try { setMemoryMode(memoryMode); } catch(e){ console.error('memory init failed', e); }
    }
    // initialize bunny game if present
    try{ initBunnyGame(); } catch(e){ /* non-fatal */ }
  } catch(initErr){
    console.error('Initialization error:', initErr);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM already ready
  initApp();
}

/* ------------------ Bunny Game (demo) ------------------ */
// Modular sections: state, rendering, movement, collisions, scoring
function initBunnyGame(){
  const container = document.getElementById('bunnyGame');
  if(!container) return;

  // Elements
  const bunnyEl = document.getElementById('bunny');
  const obstacleEl = document.getElementById('redObstacle');
  const heartTemplate = document.getElementById('heartTemplate');
  const scoreEl = document.getElementById('bunnyScore');
  const overlay = document.getElementById('bunnyOverlay');
  const finalScore = document.getElementById('bunnyFinalScore');
  const playAgainBtn = document.getElementById('bunnyPlayAgain');

  // Game state
  let running = false;
  let lastTime = null;
  let bunny = { y:16, vy:0, width:56, height:56 };
  const gravity = 2000; // px/s^2
  const jumpVel = 650; // px/s
  let score = 0;
  let hearts = []; // {el,x,y,w,h}
  let obstacle = { x: container.clientWidth + 20, w:48, h:80, speed: 220 };
  let spawnTimer = 0;

  function resetState(){
    running = true; lastTime = null; score = 0; hearts = []; spawnTimer = 0; overlay.classList.add('hidden');
    bunny.y = 16; bunny.vy = 0;
    obstacle.x = container.clientWidth + 20;
    updateScore();
    // remove any leftover spawned hearts
    Array.from(container.querySelectorAll('.collectible')).forEach(el=>{ if(el !== heartTemplate) el.remove(); });
  }

  function updateScore(){ if(scoreEl) scoreEl.textContent = 'Score: ' + score; }

  function spawnHeart(){
    const h = heartTemplate.cloneNode(true);
    h.id = '';
    h.classList.remove('hidden');
    const startX = container.clientWidth + 20;
    const minY = 60; const maxY = Math.max(60, container.clientHeight - 80);
    const y = Math.floor(Math.random() * (maxY - minY)) + minY;
    h.style.left = startX + 'px';
    h.style.top = y + 'px';
    container.appendChild(h);
    hearts.push({ el: h, x: startX, y: y, w: 36, h: 36, speed: 180 });
  }

  function handleJump(){ if(!running) return; bunny.vy = jumpVel; }

  // Click/tap to jump
  container.addEventListener('click', ()=>{ handleJump(); });
  document.addEventListener('keydown', (e)=>{ if(e.code === 'Space'){ e.preventDefault(); handleJump(); } });

  function rectsOverlap(a, b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function gameOver(){
    running = false;
    overlay.classList.remove('hidden');
    finalScore.textContent = 'Score: ' + score;
  }

  function update(dt){
    // bunny physics
    bunny.vy -= gravity * dt;
    bunny.y += bunny.vy * dt;
    if(bunny.y < 16){ bunny.y = 16; bunny.vy = 0; }
    // position bunny element
    if(bunnyEl) bunnyEl.style.bottom = Math.max(0, Math.round(bunny.y)) + 'px';

    // move obstacle
    obstacle.x -= obstacle.speed * dt;
    if(obstacleEl) obstacleEl.style.left = Math.max(-200, Math.round(obstacle.x)) + 'px';
    // spawn new obstacle if offscreen
    if(obstacle.x < - (obstacle.w + 60)){
      obstacle.x = container.clientWidth + (100 + Math.random()*200);
      // randomize speed slightly
      obstacle.speed = 180 + Math.random()*160;
    }

    // hearts movement
    for(let i = hearts.length -1; i>=0; i--){
      const h = hearts[i];
      h.x -= h.speed * dt;
      if(h.el) h.el.style.left = Math.round(h.x) + 'px';
      // remove offscreen
      if(h.x < -100){ if(h.el) h.el.remove(); hearts.splice(i,1); continue; }
      // collision with bunny
      const bunnyRect = { x: 28, y: bunny.y, w: bunny.width, h: bunny.height };
      const heartRect = { x: h.x, y: h.y, w: h.w, h: h.h };
      if(rectsOverlap(bunnyRect, heartRect)){
        // collect
        score += 5; updateScore();
        if(h.el) h.el.remove(); hearts.splice(i,1);
      }
    }

    // obstacle collision
    const bunnyRectC = { x:28, y: bunny.y, w: bunny.width, h: bunny.height };
    const obsRect = { x: obstacle.x, y:16, w: obstacle.w, h: obstacle.h };
    if(rectsOverlap(bunnyRectC, obsRect)){
      gameOver();
    }
  }

  function loop(ts){
    if(!lastTime) lastTime = ts; const dt = Math.min(0.05, (ts - lastTime)/1000); lastTime = ts;
    if(running) update(dt);
    // spawn heart occasionally
    spawnTimer += dt;
    if(spawnTimer > 1.6){ spawnTimer = 0; if(Math.random() > 0.3) spawnHeart(); }
    requestAnimationFrame(loop);
  }

  playAgainBtn.addEventListener('click', ()=>{ resetState(); });

  // initial reset and start
  resetState();
  requestAnimationFrame(loop);
}

// init on load if bunny area exists
try{ if(document.readyState !== 'loading') initBunnyGame(); else window.addEventListener('DOMContentLoaded', initBunnyGame); }catch(e){console.error(e);} 

/* ------------------ End Bunny Game ------------------ */

/* old Rabbit game removed */
