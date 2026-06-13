// =================================================================
// 🔑 الإعدادات الأساسية ومفاتيح التخزين المحلي (تم دمج مفاتيحكِ الحقيقية)
// =================================================================
const chatNameKey = "lamyChatName";

const firebaseConfig = {
  apiKey: "AIzaSyApidBgjtaa1JQCw9eg0kHo3HUQf1dXBrU",
  authDomain: "x-lamy.firebaseapp.com",
  databaseURL: "https://x-lamy-default-rtdb.firebaseio.com",
  projectId: "x-lamy",
  storageBucket: "x-lamy.firebasestorage.app",
  messagingSenderId: "252824489765",
  appId: "1:252824489765:web:21428a48ef7de5a0b094cc",
  measurementId: "G-0Y2S56MG06"
};

// تهيئة تطبيقات Firebase وقاعدة البيانات المباشرة
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentUsername = localStorage.getItem(chatNameKey) || "AnonymouS"; 
let activeXOMode = "bot"; 
let activeMemoryMode = "solo"; 
let onlineXOSymbol = ""; 

// 🧠 متغيرات لعبة الذاكرة ونظام الانتظار والليدربورد المؤقت
let myMemoryPlayerSymbol = ""; 
const memoryRoomRef = database.ref("online_memory/room");

// لوحات الصدارة محصورة ومخزنة محلياً بداخل المتصفح (تتصفر عند الخروج أو التحديث)
let localLeaderboards = {
  easy: [],
  medium: [],
  hard: []
};

let localMemoryWinsCount = 0;
let temporaryBunnyScore = 0;
let localXOWinsCount = 0;

function show(id) {
  document.querySelectorAll("section").forEach(s => {
    s.classList.add("hidden");
  });
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
}

// =================================================================
// 💬 محرك الشات العالمي المباشر (Online Global Chat Room)
// =================================================================
function addChatMessage(name, msg) {
  const box = document.getElementById("box");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = name + ": " + msg;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function listenToOnlineChat() {
  database.ref("global_chat").limitToLast(40).on("child_added", (snapshot) => {
    const data = snapshot.val();
    if (data) addChatMessage(data.name, data.msg);
  });
}

function send() {
  const nameField = document.getElementById("name");
  const msgField = document.getElementById("msg");
  const name = nameField.value.trim();
  const msg = msgField.value.trim();

  if (name === "") { alert("الاسم مطلوب لشات التفاعل!"); return; }
  if (msg === "") { alert("لا يمكنك ترك رسالة فارغة"); return; }

  currentUsername = name;
  localStorage.setItem(chatNameKey, name);
  database.ref("global_chat").push({ name: name, msg: msg });
  msgField.value = "";
}

// =================================================================
// ❌ محرك لعبة XO المطورة 
// =================================================================
let board = ["", "", "", "", "", "", "", "", ""];
let xoWins = 0;
let xoGameOver = false;
const winLines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];

function switchXOMode(mode) {
  activeXOMode = mode;
  document.getElementById("xoModeBot").classList.toggle("active", mode === "bot");
  document.getElementById("xoModeOnline").classList.toggle("active", mode === "online");
  
  const statusEl = document.getElementById("xoStatusInfo");
  const leaderboardBox = document.getElementById("xoLeaderboardContainer");

  if (mode === "bot") {
    statusEl.textContent = "الوضع الحالي: اللعب ضد البوت";
    leaderboardBox.classList.add("hidden");
    resetXO();
  } else {
    statusEl.textContent = "في قائمة الانتظار...";
    leaderboardBox.classList.remove("hidden");
    resetXO();
  }
}

function draw() {
  const b = document.getElementById("xoBoard");
  if (!b) return;
  b.innerHTML = "";
  board.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = c;
    d.onclick = () => handleXOCellClick(i);
    b.appendChild(d);
  });
}

function handleXOCellClick(i) {
  if (board[i] !== "" || xoGameOver) return;

  if (activeXOMode === "bot") {
    board[i] = "X";
    let winner = checkWinner();
    if (!winner && !board.every(c => c !== "")) {
      smartBotMove();
      winner = checkWinner();
    }
    draw();
    evaluateLocalXOResults(winner);
  } else {
    database.ref("online_xo/room").once("value", (snap) => {
      const room = snap.val() || {};
      if (room.winner || room.isDraw) return;
      if (room.turn !== onlineXOSymbol) { alert("ليس دورك الآن!"); return; }
      
      board[i] = onlineXOSymbol;
      let calculatedWinner = checkWinner();
      let calculatedDraw = !calculatedWinner && board.every(cell => cell !== "");
      let nextTurn = onlineXOSymbol === "X" ? "O" : "X";

      database.ref("online_xo/room").update({
        board: board,
        turn: nextTurn,
        winner: calculatedWinner,
        isDraw: calculatedDraw
      });
    });
  }
}

function smartBotMove() {
  for (let line of winLines) {
    let cells = line.map(idx => board[idx]);
    if (cells.filter(c => c === "O").length === 2 && cells.filter(c => c === "").length === 1) {
      let emptyIdx = line[cells.indexOf("")];
      board[emptyIdx] = "O"; return;
    }
  }
  for (let line of winLines) {
    let cells = line.map(idx => board[idx]);
    if (cells.filter(c => c === "X").length === 2 && cells.filter(c => c === "").length === 1) {
      let emptyIdx = line[cells.indexOf("")];
      board[emptyIdx] = "O"; return;
    }
  }
  if (board[4] === "") { board[4] = "O"; return; }
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  const pick = empty[Math.floor(Math.random() * empty.length)];
  if (pick !== undefined) board[pick] = "O";
}

function evaluateLocalXOResults(winner) {
  if (winner) {
    xoGameOver = true;
    handleXOResult(winner === "X" ? "win" : "lose");
  } else if (board.every(c => c !== "")) {
    xoGameOver = true;
    handleXOResult("draw");
  }
  updateXOReset();
}

function checkWinner() {
  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function handleXOResult(result) {
  const message = document.getElementById("xoMessage");
  if (!message) return;
  if (result === "win") {
    xoWins++;
    document.getElementById("xoWins").textContent = "Wins: " + xoWins;
    message.textContent = "You won! 🎉";
  } else if (result === "lose") {
    message.textContent = "You lost! 😢";
  } else if (result === "draw") {
    message.textContent = "Draw! 🤝";
  }
  message.classList.remove("hidden");
}

function updateXOReset() {
  const btn = document.getElementById("xoReset");
  if (btn) (xoGameOver) ? btn.classList.remove("hidden") : btn.classList.add("hidden");
}

function handleXOResetClick() {
  resetXO();
}

function resetXO() {
  board = ["", "", "", "", "", "", "", "", ""];
  xoGameOver = false;
  draw();
  updateXOReset();
  const msg = document.getElementById("xoMessage");
  if (msg) { msg.textContent = ""; msg.classList.add("hidden"); }
}

function listenToOnlineXORoom() {
  database.ref("online_xo/room").on("value", (snapshot) => {
    if (activeXOMode !== "online") return;
    const room = snapshot.val() || {};
    board = room.board || ["","","","","","","","",""];
    const turn = room.turn || "X";
    const winner = room.winner || "";
    const isDraw = room.isDraw || false;
    
    draw();
    if (winner || isDraw) {
      xoGameOver = true;
      handleXOResult(winner === onlineXOSymbol ? "win" : (isDraw ? "draw" : "lose"));
    }
    updateXOReset();
  });
}

// =================================================================
// 🧠 محرك لعبة الذاكرة المطور 
// =================================================================
const memoryEmojis = ["🩷", "🌸", "🍣", "😝", "🌹", "🎥", "🎮", "🎧", "🐰", "🐇"];
let memoryMode = "easy"; 
let memoryBoardState = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLocked = false;
let memoryWins = 0;

function switchMemoryMatchMode(matchMode) {
  activeMemoryMode = matchMode;
  document.getElementById("memoryPlaySolo").classList.toggle("active", matchMode === "solo");
  document.getElementById("memoryPlayOnline").classList.toggle("active", matchMode === "online");
  
  const diffControls = document.getElementById("memoryDifficultyControls");
  const leaderboardBox = document.getElementById("memoryLeaderboardContainer");
  const saveNameBox = document.getElementById("memorySaveNameContainer");
  
  memoryFlipped = [];
  memoryMatched = [];
  memoryLocked = false;
  document.getElementById("memoryBoard").innerHTML = "";
  if (saveNameBox) saveNameBox.classList.add("hidden");

  if (matchMode === "solo") {
    memoryRoomRef.off("value");
    diffControls.classList.remove("hidden");
    leaderboardBox.classList.remove("hidden");
    setMemoryMode(memoryMode);
  } else {
    diffControls.classList.add("hidden");
    leaderboardBox.classList.add("hidden");
    
    updateMemoryStatus("جاري البحث عن خصم..");
    listenToOnlineMemoryRoom(); 
    joinMemoryGameOnline(); 
  }
}

function setMemoryMode(mode) {
  memoryMode = mode;
  document.getElementById("memoryEasy").classList.toggle("active", mode === "easy");
  document.getElementById("memoryMedium").classList.toggle("active", mode === "medium");
  document.getElementById("memoryHard").classList.toggle("active", mode === "hard");
  
  document.getElementById("memoryLeaderboardTitle").textContent = `🏆 لوحة الصدارة (${mode.toUpperCase()})`;
  
  updateMemoryStatus(""); 
  startMemoryGame();
  updateMemoryLeaderboardView(); 
}

function startMemoryGame() {
  const count = memoryMode === "easy" ? 4 : (memoryMode === "medium" ? 6 : 10);
  let emojis = memoryEmojis.slice(0, count);
  const pairs = [...emojis, ...emojis];
  memoryBoardState = pairs.sort(() => Math.random() - 0.5);
  memoryFlipped = []; memoryMatched = []; memoryLocked = false;
  renderMemoryBoard();
  
  const retryEl = document.getElementById("memoryRetry");
  if (retryEl) retryEl.classList.add("hidden");
}

function joinMemoryGameOnline() {
    let identityName = localStorage.getItem(chatNameKey) || "خصم مجهول";
    
    // إجبار الصعوبة
    memoryMode = "hard"; 
    updateMemoryStatus("وضع الأونلاين (Hard Mode) - جاري البحث...");

    memoryRoomRef.once("value", (snapshot) => {
        let room = snapshot.val() || {};

        // إذا كانت الغرفة فارغة أو منتهية، ننتظر فقط (بدون إضافة اسمك لقاعدة البيانات فوراً)
        if (!room.p1_name || room.gameState === "finished") {
            updateMemoryStatus("في انتظار خصم... ");
            // هنا لا نضع p1_name إلا عندما يضغط الطرف الآخر على الانضمام
            return; 
        }

        // إذا وجدنا خصماً ينتظر (p1 موجود و p2 فارغ)
        if (room.p1_name && !room.p2_name) {
            myMemoryPlayerSymbol = "p2";
            let emojis = memoryEmojis.slice(0, 10); // 10 للـ Hard
            const board = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
            
            memoryRoomRef.update({
                p2_name: identityName,
                gameState: "playing",
                board: board
            });
        }
    });

    // مراقبة التحديثات
    memoryRoomRef.on("value", (snapshot) => {
        if (activeMemoryMode !== "online") return;
        let room = snapshot.val() || {};
        
        // اكتشاف خروج الخصم
        if (room.gameState === "playing" && !room.p2_name) {
            updateMemoryStatus("الخصم غادر. في انتظار لاعب جديد...");
        }
        
        // بدء اللعب عند تحديث اللوحة
        if (room.gameState === "playing" && room.board) {
            memoryBoardState = room.board;
            renderMemoryBoard();
            updateMemoryStatus("⚔️ المواجهة جارية!");
        }
    });
}

function listenToOnlineMemoryRoom() {
  memoryRoomRef.off("value");

  memoryRoomRef.on("value", (snapshot) => {
    if (activeMemoryMode !== "online") return;
    const room = snapshot.val() || {};
    
    if (room.gameState === "waiting") {
      updateMemoryStatus("جاري البحث عن خصم..");
      document.getElementById("memoryBoard").innerHTML = "";
    }

    if (room.gameState === "playing" && room.board) {
      let opponent = myMemoryPlayerSymbol === "p1" ? room.p2_name : room.p1_name;
      updateMemoryStatus(`⚔️ بدأ تحدي الأونلاين ضد: ${opponent}`);
      memoryBoardState = room.board;
      renderMemoryBoard();
    }
  });
}

function updateMemoryStatus(text) {
  const statusEl = document.getElementById("memoryStatus");
  if (statusEl) statusEl.textContent = text;
}

function renderMemoryBoard() {
  const boardEl = document.getElementById("memoryBoard");
  if (!boardEl) return;
  boardEl.innerHTML = "";
  memoryBoardState.forEach((emoji, idx) => {
    const card = document.createElement("button");
    card.className = "memory-card" + (memoryMatched.includes(idx) ? " matched" : "") + (memoryFlipped.includes(idx) ? " flipped" : "");
    card.textContent = memoryFlipped.includes(idx) || memoryMatched.includes(idx) ? emoji : "";
    card.onclick = () => flipMemoryCard(idx);
    boardEl.appendChild(card);
  });
}

function flipMemoryCard(index) {
  if (memoryLocked || memoryFlipped.includes(index) || memoryMatched.includes(index)) return;
  memoryFlipped.push(index);
  renderMemoryBoard();
  if (memoryFlipped.length === 2) {
    memoryLocked = true;
    setTimeout(checkMemoryMatch, 700);
  }
}

function checkMemoryMatch() {
  const [first, second] = memoryFlipped;
  
  if (memoryBoardState[first] === memoryBoardState[second]) {
    memoryMatched.push(first, second);
  }
  
  memoryFlipped = [];
  memoryLocked = false;
  renderMemoryBoard();
  
  if (memoryMatched.length === memoryBoardState.length) {
    memoryWins++;
    document.getElementById("memoryWins").textContent = "Wins: " + memoryWins;
    updateMemoryStatus("كفو! أنهيت اللعبة بنجاح 🎉");
    
    if (activeMemoryMode === "solo") {
      checkMemoryLeaderboardEligibility(memoryWins);
    } else {
      memoryRoomRef.update({ gameState: "finished" });
    }
    
    const retryEl = document.getElementById("memoryRetry");
    if (retryEl) retryEl.classList.remove("hidden");
  }
}

function checkMemoryLeaderboardEligibility(scoreToCheck) {
  let currentList = localLeaderboards[memoryMode];
  if (currentList.length < 5 || scoreToCheck > Math.min(...currentList.map(item => item.score))) {
    localMemoryWinsCount = scoreToCheck;
    document.getElementById("memorySaveNameContainer").classList.remove("hidden");
  }
}

function submitMemoryHighScore() {
  const nameInput = document.getElementById("memoryLeaderboardNameInput");
  const chosenName = nameInput.value.trim();
  if (!chosenName) { alert("أدخل اسمك!"); return; }
  
  localLeaderboards[memoryMode].push({ name: chosenName, score: localMemoryWinsCount });
  localLeaderboards[memoryMode].sort((a, b) => b.score - a.score);
  localLeaderboards[memoryMode] = localLeaderboards[memoryMode].slice(0, 5);
  
  document.getElementById("memorySaveNameContainer").classList.add("hidden");
  nameInput.value = "";
  
  updateMemoryLeaderboardView();
}

function updateMemoryLeaderboardView() {
  const view = document.getElementById("memoryOnlineLeaderboardView");
  if (!view) return;
  
  let list = localLeaderboards[memoryMode];
  view.innerHTML = list.length 
    ? list.map((u, i) => `${i+1}. <b>${u.name}</b>: ${u.score} فوز<br>`).join("") 
    : "لا توجد نتائج مسجلة في هذا المستوى بعد.";
}

function retryMemoryGame() {
  if (activeMemoryMode === "solo") {
    startMemoryGame();
  } else {
    joinMemoryGameOnline(); 
  }
}

// =================================================================
// 🖱️ محرك لعبة Clicker 
// =================================================================
let score = 0;
let treeWins = 0;
function clickMe() {
  score++;
  document.getElementById("clickScore").textContent = "Score: " + score;
  let treeStage = "🌱";
  if (score >= 100) treeStage = "🌳";
  else if (score >= 50) treeStage = "🌲";
  else if (score >= 25) treeStage = "🌿";
  
  document.getElementById("treeVisualization").textContent = treeStage;
  if (score === 100) {
    document.getElementById("treeMessage").classList.remove("hidden");
    document.getElementById("treeRetry").classList.remove("hidden");
    treeWins++;
    document.getElementById("treeCount").textContent = "Tree count: " + treeWins;
  }
}

function retryTree() {
  score = 0;
  document.getElementById("clickScore").textContent = "Score: 0";
  document.getElementById("treeVisualization").textContent = "🌱";
  document.getElementById("treeMessage").classList.add("hidden");
  document.getElementById("treeRetry").classList.add("hidden");
}

// =================================================================
// ⚙️ بوابات التشغيل والتهيئة (Initialization)
// =================================================================
window.addEventListener("DOMContentLoaded", () => {
  try {
    draw();
    listenToOnlineChat();
    listenToOnlineXORoom();

    if (document.getElementById("memoryBoard")) {
      setMemoryMode(memoryMode);
    }
  } catch (initErr) {
    console.error("Initialization error:", initErr);
  }
});
