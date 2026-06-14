// =================================================================
// 🔑 الإعدادات الأساسية ومفاتيح التخزين المحلي
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
  const box = document.getElementById("box");
  if (!box) return;

  // الاستماع لأي تغيير في قاعدة البيانات
  database.ref("global_chat").on("value", (snapshot) => {
    // إذا كانت قاعدة البيانات فارغة (بعد الحذف)، نفرغ الشاشة
    if (!snapshot.exists()) {
      box.innerHTML = "";
      return;
    }

    // إذا كانت هناك بيانات، نقوم بإعادة بناء القائمة
    // (هذه الطريقة تضمن أن الشاشة تعكس بالضبط ما هو موجود في Firebase)
    box.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      addChatMessage(data.name, data.msg);
    });
  });
}

function send(){
  const nameField = document.getElementById("name");
  const msgField = document.getElementById("msg");
  const name = nameField.value.trim();
  const msg = msgField.value.trim();

  // كود الاختصار
  if(msg === "//clearbylamy"){
    database.ref("global_chat").remove(); // هذا الأمر سيشغل دالة الاستماع (value) أعلاه عند الجميع
    msgField.value = "";
    return;
  }

  if(name === ""){ alert("الاسم مطلوب!"); return; }
  if(msg === ""){ alert("لا يمكنك ترك رسالة فارغة"); return; }

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

  // إذا كانت اللوحة مرسومة بالفعل بنفس القيم، لا تعيد الرسم

  if (b.children.length === 9) return;

 

  b.innerHTML = "";

  board.forEach((c, i) => {

    const d = document.createElement("div");

    d.className = "cell";

    d.textContent = c;

    d.onclick = () => handleXOCellClick(i);

    b.appendChild(d);

  });

}



// 1. دالة الرسم المحسنة (تمنع التجمد وتحدث العناصر فقط)

function draw() {

  const b = document.getElementById("xoBoard");

  if (!b) return;



  const cells = b.getElementsByClassName("cell");

  if (cells.length === 9) {

    board.forEach((c, i) => {

      cells[i].textContent = c;

    });

  } else {

    b.innerHTML = "";

    board.forEach((c, i) => {

      const d = document.createElement("div");

      d.className = "cell";

      d.textContent = c;

      d.onclick = () => handleXOCellClick(i);

      b.appendChild(d);

    });

  }

}



// 2. دالة الفحص (المسؤولة عن معرفة الفائز)

function checkWinnerInBoard(currentBoard) {

  for (const [a, b, c] of winLines) {

    if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c])

      return currentBoard[a];

  }

  return null;

}



// 3. دالة الضغط (المسؤولة عن إرسال الحركة لـ Firebase)

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

      if (room.turn !== onlineXOSymbol) {

        alert("انتظر دورك!");

        return;

      }

     

      let newBoard = [...board];

      newBoard[i] = onlineXOSymbol;

      let nextTurn = (onlineXOSymbol === "X") ? "O" : "X";

      let winner = checkWinnerInBoard(newBoard);

      let isDraw = !winner && newBoard.every(cell => cell !== "");

     

      database.ref("online_xo/room").update({

        board: newBoard,

        turn: nextTurn,

        winner: winner || "",

        isDraw: isDraw

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
  if (activeXOMode === "online") {
    // إرسال أمر "تصفير" اللوحة لـ Firebase ليراه الخصم أيضاً
    database.ref("online_xo/room").update({
      board: ["", "", "", "", "", "", "", "", ""],
      winner: "",
      isDraw: false,
      turn: "X" 
    });
  } else {
    // اللعب ضد البوت يعمل محلياً كما كان
    resetXO();
  }
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

    const roomRef = database.ref("online_xo/room");

    const statusDiv = document.getElementById("xoStatusInfo"); // تعريف العنصر هنا لضمان وجوده

   

    roomRef.off("value");



    roomRef.on("value", (snapshot) => {

        if (activeXOMode !== "online") return;

        const room = snapshot.val();

        if (!room) return;



        // 1. تحديث اللوحة

        const newBoard = room.board || ["", "", "", "", "", "", "", "", ""];

        if (JSON.stringify(newBoard) !== JSON.stringify(board)) {

            board = newBoard;

            draw();

        }



        // 2. تحديث الرسائل التفاعلية للاعب

        if (statusDiv) {

            if (xoGameOver) {

                statusDiv.textContent = "انتهت الجولة!";

            } else if (room.turn === onlineXOSymbol) {

                statusDiv.textContent = "دورك الآن!.";

            } else {

                statusDiv.textContent = "الخصم يفكر.. كن صبوراً!";

            }

        }



        // 3. التحقق من النتيجة النهائية

        const winner = room.winner || "";

        const isDraw = room.isDraw || false;



        if (winner && !xoGameOver) {

            xoGameOver = true;

            const result = (winner === onlineXOSymbol) ? "win" : "lose";

           

            // تحديث الصدارة العالمية إذا فزت

            if (result === "win") {

                updateGlobalLeaderboard(localStorage.getItem("xoPlayerName"));

            }

           

            handleXOResult(result);

        } else if (isDraw && !xoGameOver) {

            xoGameOver = true;

            handleXOResult("draw");

        }

       

        updateXOReset();

    });

}



// دالة تحديث الصدارة العالمية (تبقى كما هي)

function updateGlobalLeaderboard(name) {

    if (!name) return;

    const playerRef = database.ref("online_xo/players/" + name);

    playerRef.transaction((player) => {

        if (player) {

            player.wins = (player.wins || 0) + 1;

            return player;

        }

        return { wins: 1 };

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

// دالة الانضمام للعبة
function joinMemoryGameOnline() {
    let identityName = localStorage.getItem(chatNameKey) || "خصم مجهول";
    
    // إيقاف أي استماع سابق قبل البدء
    memoryRoomRef.off("value"); 

    memoryRoomRef.once("value", (snapshot) => {
        let room = snapshot.val() || {};

        // 1. إذا كانت الغرفة فارغة أو انتهت، أنشئ غرفة جديدة
        if (!room.p1_name || room.gameState === "finished") {
            memoryRoomRef.set({
                p1_name: identityName,
                p2_name: "",
                gameState: "waiting",
                board: []
            });
            updateMemoryStatus("بانتظار خصم...");
        } 
        // 2. إذا كان هناك لاعب ينتظر، انضم إليه
        else if (room.p1_name && !room.p2_name && room.p1_name !== identityName) {
            let emojis = memoryEmojis.slice(0, 10);
            const board = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
            memoryRoomRef.update({
                p2_name: identityName,
                gameState: "playing",
                board: board
            });
            updateMemoryStatus("⚔️ تم التحدي! اللعبة بدأت");
        }
        
        // بعد الانتهاء من عملية الانضمام، ابدأ المراقبة
        listenToOnlineMemoryRoom();
    });
}

// دالة مراقبة التحديثات (منفصلة تماماً ومغلقة بشكل صحيح)
function listenToOnlineMemoryRoom() {
    // إيقاف أي استماع قديم قبل تفعيل الجديد
    memoryRoomRef.off("value");

    memoryRoomRef.on("value", (snapshot) => {
        if (activeMemoryMode !== "online") return;
        
        let room = snapshot.val();
        if (!room) return;
        
        // بدء اللعب عند تحديث اللوحة
        if (room.gameState === "playing" && room.board) {
            memoryBoardState = room.board;
            renderMemoryBoard();
            updateMemoryStatus("⚔️ المواجهة جارية!");
        }
        // اكتشاف خروج الخصم
        else if (room.gameState === "playing" && !room.p2_name) {
            updateMemoryStatus("الخصم غادر. في انتظار لاعب جديد...");
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

// 1. الدالة التي تقرر هل نظهر صندوق إدخال الاسم أم نحفظ السكور فوراً
function checkMemoryLeaderboardEligibility(scoreToCheck) {
    let savedName = localStorage.getItem("memoryPlayerName");

    if (savedName) {
        // إذا كان الاسم موجوداً، احفظ السكور فوراً بدون إظهار الصندوق
        saveScoreToLeaderboard(savedName, scoreToCheck);
    } else {
        // إذا كان هذا أول فوز، أظهر الصندوق ليطلب الاسم
        localMemoryWinsCount = scoreToCheck;
        document.getElementById("memorySaveNameContainer").classList.remove("hidden");
    }
}

// 2. الدالة المسؤولة عن تحديث القائمة (باللون الذهبي للاعب)
function saveScoreToLeaderboard(name, score) {
    // حفظ الاسم في المتصفح للأبد
    localStorage.setItem("memoryPlayerName", name);
    
    // البحث إذا كان اللاعب موجوداً مسبقاً في هذا المستوى
    let list = localLeaderboards[memoryMode];
    let existingIdx = list.findIndex(item => item.name === name);

    if (existingIdx !== -1) {
        // إذا موجود، حدث السكور فقط إذا كان الجديد أعلى
        if (score > list[existingIdx].score) {
            list[existingIdx].score = score;
        }
    } else {
        // إذا غير موجود، أضف السطر الجديد
        list.push({ name: name, score: score });
    }
    
    // ترتيب النتائج (الأعلى أولاً) وأخذ أفضل 5
    list.sort((a, b) => b.score - a.score);
    localLeaderboards[memoryMode] = list.slice(0, 5);
    
    // تحديث العرض
    updateMemoryLeaderboardView();
}

function submitMemoryHighScore() {
    try {
        const nameInput = document.getElementById("memoryLeaderboardNameInput");
        const chosenName = nameInput.value ? nameInput.value.trim() : "";
        
        if (!chosenName) { 
            alert("يرجى إدخال اسم صحيح!"); 
            return; 
        }
        
        // استدعاء دالة الحفظ التي جهزناها
        saveScoreToLeaderboard(chosenName, localMemoryWinsCount);
        
        // إخفاء الصندوق
        const container = document.getElementById("memorySaveNameContainer");
        if (container) container.classList.add("hidden");
        
        nameInput.value = "";
        
        console.log("تم الحفظ بنجاح!");
    } catch (error) {
        console.error("حدث خطأ أثناء الحفظ:", error);
        alert("فشل الحفظ. تأكدي من أن العناصر في الصفحة موجودة.");
    }
}

// 3. دالة تحديث شكل القائمة (تظهر اسمك بالذهبي)
function updateMemoryLeaderboardView() {
    const view = document.getElementById("memoryOnlineLeaderboardView");
    if (!view) return;
    
    let currentPlayerName = localStorage.getItem("memoryPlayerName");
    let list = localLeaderboards[memoryMode];

    if (list.length === 0) {
        view.innerHTML = "لا توجد نتائج مسجلة في هذا المستوى بعد.";
        return;
    }

    view.innerHTML = list.map((u, i) => {
        let isMe = (u.name === currentPlayerName);
        // التنسيق الذهبي للاعب الحالي
        let style = isMe ? "color: #FFD700; font-weight: bold; text-shadow: 0 0 5px #FFD700;" : "";
        
        return `<div style="${style}">
            ${i + 1}. <b>${u.name}</b>: ${u.score} فوز ${isMe ? ' 👑' : ''}
        </div>`;
    }).join("");
}

function updateMemoryLeaderboardView() {
    const view = document.getElementById("memoryOnlineLeaderboardView");
    if (!view) return;
    
    // الحصول على اسم اللاعب الحالي من المتصفح
    let currentPlayerName = localStorage.getItem("memoryPlayerName");
    let list = localLeaderboards[memoryMode];

    if (list.length === 0) {
        view.innerHTML = "لا توجد نتائج مسجلة في هذا المستوى بعد.";
        return;
    }

    view.innerHTML = list.map((u, i) => {
        // التحقق: إذا كان هذا الصف هو صف اللاعب الحالي، نعطيه تنسيقاً ذهبياً
        let isMe = (u.name === currentPlayerName);
        let style = isMe ? "color: #FFD700; font-weight: bold; text-shadow: 0 0 5px #FFD700;" : "";
        
        return `<div style="${style}">
            ${i + 1}. <b>${u.name}</b>: ${u.score} فوز ${isMe ? ' 👑' : ''}
        </div>`;
    }).join("");
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
// =================================================================
// 🐇 نظام صدارة لعبة الأرانب (Bunny Leaderboard)
// =================================================================

function checkBunnyLeaderboard(currentScore) {
    window.currentBunnyScore = currentScore;
    let savedName = localStorage.getItem("bunnyPlayerName");
    
    if (savedName) {
        saveBunnyScore(savedName, currentScore);
    } else {
        // إظهار صندوق إدخال الاسم إذا كان لاعباً جديداً
        const container = document.getElementById("bunnySaveNameContainer");
        if (container) container.classList.remove("hidden");
    }
}

function saveBunnyScore(name, score) {
    localStorage.setItem("bunnyPlayerName", name);
    let list = JSON.parse(localStorage.getItem("bunnyList") || "[]");
    
    let existingIdx = list.findIndex(item => item.name === name);
    if (existingIdx !== -1) {
        if (score > list[existingIdx].score) list[existingIdx].score = score;
    } else {
        list.push({ name: name, score: score });
    }

    list.sort((a, b) => b.score - a.score);
    let topFive = list.slice(0, 5);
    
    localStorage.setItem("bunnyList", JSON.stringify(topFive));
    updateBunnyLeaderboardView();
}

function updateBunnyLeaderboardView() {
    const view = document.getElementById("bunnyLeaderboardView");
    if (!view) return;

    let bunnyLeaderboard = JSON.parse(localStorage.getItem("bunnyList") || "[]");
    let myName = localStorage.getItem("bunnyPlayerName");

    view.innerHTML = bunnyLeaderboard.map((u, i) => {
        let isMe = (u.name === myName);
        let style = isMe ? "color: #FFD700; font-weight: bold; text-shadow: 0 0 5px #FFD700;" : "";
        
        return `<div style="${style}">
            ${i + 1}. <b>${u.name}</b>: ${u.score} قلوب ${isMe ? ' 👑' : ''}
        </div>`;
    }).join("");
}

// تُستدعى عند الضغط على زر "حفظ" في الـ HTML
function submitBunnyHighScore() {
    const nameInput = document.getElementById("bunnyLeaderboardNameInput");
    const container = document.getElementById("bunnySaveNameContainer");
    const name = nameInput.value.trim();
    
    if (!name) { alert("يرجى إدخال اسمك!"); return; }
    
    saveBunnyScore(name, window.currentBunnyScore || 0);
    if (container) container.classList.add("hidden");
}
