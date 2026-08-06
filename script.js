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
const auth = firebase.auth();

console.log("✅ النظام الآن يعمل باسم: tester lamy");

auth.onAuthStateChanged((user) => {
    window.updateAuthUI();

    if (user) {
        console.log("المستخدم مسجل الآن باسم:", user.displayName);

        // 1. تصفير النقرات (Score) محلياً وفي اللوحة مع كل تسجيل دخول
        score = 0;
        const scoreEl = document.getElementById("clickScore");
        if (scoreEl) scoreEl.textContent = "Score: 0";
        const treeVis = document.getElementById("treeVisualization");
        if (treeVis) treeVis.textContent = "🌱";

        // 2. جلب عدد الأشجار (trees) وعدد الـ Wins المخزنة في حساب المستخدم
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value').then((snapshot) => {
            const data = snapshot.val() || {};
            
            // جلب الأشجار
            treeWins = data.treeWins || 0;
            const treeCountEl = document.getElementById("treeCount");
            if (treeCountEl) {
                treeCountEl.textContent = "Tree count: " + treeWins;
                treeCountEl.style.display = "block";
            }

            // جلب الـ Wins العامة للـ XO
            xoWins = data.xoWins || data.wins || 0;
            const xoWinsEl = document.getElementById("xoWins");
            if (xoWinsEl) xoWinsEl.textContent = "Wins: " + xoWins;

            // جلب الـ Wins العامة للذاكرة
            memoryWins = data.memoryWins || 0;
            const memoryWinsEl = document.getElementById("memoryWins");
            if (memoryWinsEl) memoryWinsEl.textContent = "Wins: " + memoryWins;
        });
    } else {
        // إذا قام بتسجيل الخروج، نعيد التصفير
        score = 0;
        treeWins = 0;
        xoWins = 0;
        memoryWins = 0;
    }
});

function initGameSystem() {
    const savedName = localStorage.getItem("xoPlayerName");
    if (savedName) {
        // كود تشغيل الواجهة هنا...
    }
}

window.addEventListener('load', () => {
    if (typeof initGameSystem === 'function') {
        initGameSystem();
    }
    checkPendingBunnyScore();
});

function checkPendingBunnyScore() {
    let savedName = window.getCurrentUserName();

    if (savedName && pendingScore) {
        console.log("تم اكتشاف سكور معلق، جاري حفظه...");
        window.saveBunnyScoreToLeaderboard(parseInt(pendingScore));
        localStorage.removeItem("pendingBunnyScore");
    }
}
let currentUsername = localStorage.getItem(chatNameKey) || "AnonymouS"; 
let activeXOMode = "bot"; 
let activeMemoryMode = "solo"; 
let onlineXOSymbol = ""; 

// 🧠 متغيرات لعبة الذاكرة ونظام الانتظار والليدربورد المؤقت
let myMemoryPlayerSymbol = ""; 
const memoryRoomRef = database.ref("online_memory/room");

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

  database.ref("global_chat").on("value", (snapshot) => {
    box.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const div = document.createElement("div");
      div.className = "chat-message";
      div.textContent = data.name + ": " + data.msg;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  });
}

function getMyName() {
    return auth.currentUser ? auth.currentUser.displayName : null;
}

function send() {
  const msgField = document.getElementById("msg");
  const msg = msgField.value.trim();
  const user = auth.currentUser;

  if (!user) {
      alert("سجل دخولك أولاً لتتمكن من الدردشة!");
      if (typeof window.showAuthOverlay === 'function') {
          window.showAuthOverlay('login');
      }
      return;
  }

  const senderName = user.displayName || "مستخدم";
  if(msg === ""){ alert("لا يمكنك ترك رسالة فارغة"); return; }

  database.ref("global_chat").push({ 
      name: senderName, 
      msg: msg,
      timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  
  msgField.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const nameField = document.getElementById("name");
    const savedName = window.getCurrentUserName();
    
    if (savedName && nameField) {
        nameField.value = savedName;
        nameField.readOnly = true;
        nameField.style.opacity = "0.7";
    }
});

// =================================================================
// ❌ محرك لعبة XO
// =================================================================

let board = ["", "", "", "", "", "", "", "", ""];
let xoWins = 0;
let xoGameOver = false;
const winLines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];

window.submitXOHighScore = function() {
    const nameInput = document.getElementById("xoLeaderboardNameInput");
    const chosenName = nameInput.value ? nameInput.value.trim() : "";
    
    if (!chosenName) { 
        alert("يرجى إدخال اسمك!"); 
        return; 
    }

    const userKey = encodeURIComponent(chosenName);
    database.ref("leaderboards/xo/" + userKey).set({
        name: chosenName,
        wins: xoWins,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert("تم حفظ نتيجتك في الصدارة!");
        document.getElementById("xoSaveNameContainer").classList.add("hidden");
        updateXOLeaderboardView();
    });
};

// إصلاح عرض أعلى 5 لاعبين في XO
window.updateXOLeaderboardView = function() {
    const view = document.getElementById("onlineLeaderboardView");
    if (!view) return;

    database.ref("leaderboards/xo")
        .orderByChild("wins")
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                if (child.val() && child.val().name) {
                    scores.push(child.val());
                }
            });
            // ترتيب تنازلي حسب الفوز
            scores.sort((a, b) => (b.wins || 0) - (a.wins || 0));
            // أخذ أفضل 5 لاعبين
            let top5 = scores.slice(0, 5);

            let myName = window.getCurrentUserName();

            view.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe ? "color: #FFD700; font-weight: bold;" : "color: #fff;";
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.wins || 0} فوز)</div>`;
            }).join("") : "لا توجد نتائج مسجلة.";
        });
};

window.playAgain = function() {
    xoGameOver = false;
    
    database.ref("online_xo/room").update({
        board: ["", "", "", "", "", "", "", "", ""],
        turn: "X",
        winner: "",
        isDraw: false,
        statusMessage: "بدأت الجولة!"
    }).then(() => {
        document.getElementById("xoMessage").classList.add("hidden");
        document.getElementById("xoReset").classList.add("hidden");
    });
};

function updateWinnerScore() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = database.ref('users/' + user.uid + '/xoWins');
    userRef.transaction((currentWins) => {
        return (currentWins || 0) + 1;
    });
}

async function switchXOMode(mode) {
    const boardDiv = document.getElementById("xoBoard");
    const statusDiv = document.getElementById("xoStatusInfo");
    const leaderboardBox = document.getElementById("xoLeaderboardContainer");

    database.ref("online_xo/room").off("value");
    activeXOMode = mode;
    
    if (boardDiv) {
        boardDiv.style.pointerEvents = "auto";
        boardDiv.style.opacity = "1";
    }

    document.getElementById("xoModeBot")?.classList.toggle("active", mode === "bot");
    document.getElementById("xoModeOnline")?.classList.toggle("active", mode === "online");

    if (mode === "bot") {
        statusDiv.textContent = "الوضع الحالي: اللعب ضد البوت";
        if (leaderboardBox) leaderboardBox.classList.add("hidden");
        resetXO();
    } else {
        const user = auth.currentUser;
        const myName = user ? user.displayName : null;
        if (!myName) {
            alert("سجلي دخولك أولاً!");
            window.showAuthOverlay('login');
            switchXOMode('bot');
            return;
        }

        statusDiv.textContent = "جاري الاتصال...";
        if (leaderboardBox) leaderboardBox.classList.remove("hidden");

        const roomRef = database.ref("online_xo/room");
        
        roomRef.transaction((room) => {
            if (!room) {
                return {
                    board: ["", "", "", "", "", "", "", "", ""],
                    turn: "X",
                    winner: "",
                    player1: myName,
                    player2: ""
                };
            }
            if (!room.player2 && room.player1 !== myName) {
                room.player2 = myName;
                return room;
            }
            return room;
        }, (error, committed, snapshot) => {
            if (committed) {
                const data = snapshot.val();
                onlineXOSymbol = (data.player1 === myName) ? "X" : "O";
                listenToOnlineXORoom();
            }
        });
    }
}

function resetXO() {
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;
    updateLocalBoard(board); 
    document.getElementById("xoStatusInfo").textContent = "الوضع الحالي: اللعب ضد البوت";
}

function draw() {
    const b = document.getElementById("xoBoard");
    if (!b) return;
    b.style.display = "grid"; 

    const cells = b.getElementsByClassName("cell");
    if (cells.length === 9) {
        board.forEach((c, i) => { cells[i].textContent = c; });
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

function checkWinnerInBoard(currentBoard) {
  for (const [a, b, c] of winLines) {
    if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c])
      return currentBoard[a];
  }
  return null;
}

function handleXOResetClick() {
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;

    const messageDiv = document.getElementById("xoMessage");
    if (messageDiv) {
        messageDiv.textContent = "";
        messageDiv.classList.add("hidden");
    }

    const resetBtn = document.getElementById("xoReset");
    if (resetBtn) resetBtn.classList.add("hidden"); 

    draw(); 
}

function smartBotMove() {
  for (let line of winLines) {
    let cells = line.map(idx => board[idx]);
    if (cells.filter(c => c === "O").length === 2 && cells.filter(c => c === "").length === 1) {
      board[line[cells.indexOf("")]] = "O"; return;
    }
  }
  if (Math.random() < 0.7) {
    for (let line of winLines) {
      let cells = line.map(idx => board[idx]);
      if (cells.filter(c => c === "X").length === 2 && cells.filter(c => c === "").length === 1) {
        board[line[cells.indexOf("")]] = "O"; return;
      }
    }
  }
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
    updateWinnerScore();
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

function handleXOCellClick(i) {
  if (board[i] !== "" || xoGameOver) return;
  document.getElementById("xoBoard").style.pointerEvents = "auto";

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
      if (room.turn !== onlineXOSymbol) return;
      
      let newBoard = [...board];
      newBoard[i] = onlineXOSymbol;
      let nextTurn = (onlineXOSymbol === "X") ? "O" : "X";
      let winner = checkWinnerInBoard(newBoard);
      let isDraw = !winner && newBoard.every(cell => cell !== "");
      
      database.ref("online_xo/room").update({
        board: newBoard, turn: nextTurn, winner: winner || "", isDraw: isDraw
      });
    });
  }
}

function listenToOnlineXORoom() {
    const statusDiv = document.getElementById("xoStatusInfo");
    const boardDiv = document.getElementById("xoBoard");
    const roomRef = database.ref("online_xo/room");

    if (activeXOMode !== "online") {
        roomRef.off("value");
        return;
    }

    roomRef.onDisconnect().remove();

    roomRef.on("value", (snapshot) => {
        if (activeXOMode !== "online") {
            roomRef.off("value");
            return;
        }

        const room = snapshot.val();
        
        if (!room) {
            statusDiv.innerHTML = "انقطع اتصال الخصم. جاري العودة للوضع الرئيسي...";
            boardDiv.style.pointerEvents = "none";
            setTimeout(() => switchXOMode('bot'), 3000);
            return;
        }

        if (!room.player2) {
            statusDiv.innerHTML = `بانتظار انضمام الخصم...<br>أنت: <b>${room.player1}</b>`;
            boardDiv.style.pointerEvents = "none"; 
            boardDiv.style.opacity = "0.5";
        } else {
            boardDiv.style.pointerEvents = "auto"; 
            boardDiv.style.opacity = "1";

            if (room.statusMessage) {
                statusDiv.innerHTML = `<b>${room.statusMessage}</b>`;
                setTimeout(() => {
                    database.ref("online_xo/room/statusMessage").remove();
                }, 2000);
            } 
            else if (room.winner || room.isDraw) {
                statusDiv.innerHTML = "<b>انتهت الجولة!</b>";
            } else {
                const isMyTurn = (room.turn === onlineXOSymbol);
                const turnName = isMyTurn ? "دورك الآن!" : "انتظار الخصم...";
                statusDiv.innerHTML = `<b>${room.player1}</b> vs <b>${room.player2}</b><br>الحالة: ${turnName}`;
            }
        }

        updateLocalBoard(room.board);
        checkGameResult(room);
    });
}

function updateLocalBoard(newBoard) {
    if (newBoard && newBoard.join("") !== board.join("")) {
        board = newBoard;
        draw();
    }
}

function checkGameResult(room) {
    if ((room.winner || room.isDraw) && !xoGameOver) {
        xoGameOver = true;
        
        if (room.winner === onlineXOSymbol) {
            handleXOResult("win");
            updateWinnerScore(); 
            const myName = window.getCurrentUserName();
            if (myName) {
                updateGlobalLeaderboard(myName);
            }
        } else if (room.isDraw) {
            handleXOResult("draw");
        } else {
            handleXOResult("lose");
        }
        
        const resetBtn = document.getElementById("xoReset");
        if (resetBtn) resetBtn.classList.remove("hidden");
    }
}

function updateGlobalLeaderboard(name) {
    if (!name) return;
    database.ref("online_xo/players/" + encodeURIComponent(name)).transaction((p) => {
        return p ? { wins: (p.wins || 0) + 1 } : { wins: 1 };
    });
}

// =================================================================
// 🧠 محرك لعبة الذاكرة (إصلاح عرض أول 5 لاعبين)
// =================================================================
const memoryEmojis = ["🩷", "🌸", "🍣", "😝", "🌹", "🎥", "🎮", "🎧", "🐰", "🐇"];
let memoryMode = "easy"; 
let memoryBoardState = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLocked = false;
let memoryWins = 0;

let onlineMemoryScores = { p1: 0, p2: 0 };
let onlineMemoryGameOver = false;

function switchMemoryMatchMode(matchMode) {
  if (matchMode === "online" && !window.getCurrentUserName()) {
    alert("يجب عليك تسجيل الدخول أولا للعب أونلاين!");
    if (typeof window.showAuthOverlay === 'function') {
        window.showAuthOverlay('login');
    }
    return;
  }

  if (activeMemoryMode === "online" && matchMode === "solo") {
    memoryRoomRef.set({
        p1_name: "",
        p2_name: "",
        gameState: "finished",
        board: []
    });
    memoryRoomRef.off("value");
  }

  activeMemoryMode = matchMode;
  document.getElementById("memoryPlaySolo")?.classList.toggle("active", matchMode === "solo");
  document.getElementById("memoryPlayOnline")?.classList.toggle("active", matchMode === "online");
  
  const diffControls = document.getElementById("memoryDifficultyControls");
  const leaderboardBox = document.getElementById("memoryLeaderboardContainer");
  const saveNameBox = document.getElementById("memorySaveNameContainer");
  
  memoryFlipped = [];
  memoryMatched = [];
  memoryLocked = false;
  
  const boardEl = document.getElementById("memoryBoard");
  if (boardEl) boardEl.innerHTML = "";
  if (saveNameBox) saveNameBox.classList.add("hidden");

  if (matchMode === "solo") {
    memoryRoomRef.off("value");
    if (diffControls) diffControls.classList.remove("hidden");
    if (leaderboardBox) leaderboardBox.classList.remove("hidden");
    setMemoryMode(memoryMode);
  } else {
    if (diffControls) diffControls.classList.add("hidden");
    if (leaderboardBox) leaderboardBox.classList.add("hidden");
    
    updateMemoryStatus("جاري البحث عن خصم..");
    listenToOnlineMemoryRoom(); 
    joinMemoryGameOnline(); 
  }
}

function setMemoryMode(mode) {
  memoryMode = mode;
  
  document.getElementById("memoryEasy")?.classList.toggle("active", mode === "easy");
  document.getElementById("memoryMedium")?.classList.toggle("active", mode === "medium");
  document.getElementById("memoryHard")?.classList.toggle("active", mode === "hard");
  
  const titleEl = document.getElementById("memoryLeaderboardTitle");
  if(titleEl) titleEl.textContent = `🏆 لوحة الصدارة (${mode.toUpperCase()})`;
  
  updateMemoryStatus(""); 
  startMemoryGame();
  updateMemoryLeaderboardView(); 
}

// تعديل الدالة لضمان تجميع وجلب كامل القائمة وإرجاع أول 5 لاعبين
window.updateMemoryLeaderboardView = function() {
    const view = document.getElementById("memoryOnlineLeaderboardView");
    if (!view) return;

    view.innerHTML = "جاري التحميل...";

    database.ref("leaderboards/memory/" + memoryMode)
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                if (child.val() && child.val().name) {
                    scores.push(child.val());
                }
            });

            // فرز تنازلي بأعلى النتائج
            scores.sort((a, b) => (b.score || 0) - (a.score || 0));

            // اقتطاع أول 5 فقط
            let top5 = scores.slice(0, 5);
            let myName = window.getCurrentUserName();

            view.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let glow = "text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);";
                let style = isMe 
                    ? `color: #FFD700; font-weight: bold; ${glow}` 
                    : `color: #fff;`;
                
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score || 0} فوز)</div>`;
            }).join("") : "لا توجد نتائج مسجلة في هذا المستوى بعد.";
        });
};

window.saveMemoryScoreToFirebase = function(score) {
    let savedName = window.getCurrentUserName();
    if (!savedName) return;

    const userKey = encodeURIComponent(savedName);
    database.ref("leaderboards/memory/" + memoryMode + "/" + userKey).set({
        name: savedName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        updateMemoryLeaderboardView();
    });
};

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

function generateBoard() {
    const emojis = memoryEmojis.slice(0, 10);
    return [...emojis, ...emojis].sort(() => Math.random() - 0.5);
}

function joinMemoryGameOnline() {
    const myName = window.getCurrentUserName();
    onlineMemoryGameOver = false;
    onlineMemoryScores = { p1: 0, p2: 0 };
    
    const retryEl = document.getElementById("memoryRetry");
    if (retryEl) retryEl.classList.add("hidden");
    const resultEl = document.getElementById("memoryOnlineResult");
    if (resultEl) resultEl.classList.add("hidden");

    memoryRoomRef.once("value", (snapshot) => {
        const room = snapshot.val() || {};

        if (!room.p1_name || room.gameState === "finished") {
            myMemoryPlayerSymbol = "p1";
            memoryRoomRef.set({
                p1_name: myName,
                gameState: "waiting",
                board: generateBoard(),
                currentTurn: "p1",
                flippedByOpponent: [],
                scores: { p1: 0, p2: 0 },
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
        } 
        else if (room.gameState === "waiting" && room.p1_name !== myName) {
            myMemoryPlayerSymbol = "p2";
            memoryRoomRef.update({
                p2_name: myName,
                gameState: "playing",
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            updateMemoryStatus("⚔️ ! ابدأ اللعب");
        }
    });
    
    memoryRoomRef.onDisconnect().update({ gameState: "abandoned" });
}

function listenToOnlineMemoryRoom() {
    memoryRoomRef.off("value");
    
    memoryRoomRef.on("value", (snapshot) => {
        if (activeMemoryMode !== "online") return;
        
        const room = snapshot.val();
        if (!room) return;

        if (room.gameState === "abandoned" && !onlineMemoryGameOver) {
            onlineMemoryGameOver = true;
            memoryRoomRef.off("value");
            updateMemoryStatus("❌ خصمك غادر!");
            showOnlineMemoryResult("abandoned");
            return;
        }

        if (room.gameState === "waiting") {
            updateMemoryStatus("جاري البحث عن خصم..");
            return;
        }

        if ((room.gameState === "playing" || room.gameState === "finished") && room.board) {
            memoryBoardState = room.board;

            if (room.scores) {
                onlineMemoryScores = room.scores;
            }

            const opponentFlipped = room.flippedByOpponent || [];
            let opponentName = (myMemoryPlayerSymbol === "p1") ? room.p2_name : room.p1_name;

            const isMyTurn = (room.currentTurn === myMemoryPlayerSymbol);
            let statusMsg;
            if (isMyTurn) {
                statusMsg = `⚔️ ضد ${opponentName || "..."} | نقاطك: ${onlineMemoryScores[myMemoryPlayerSymbol] || 0} | نقاطه: ${onlineMemoryScores[myMemoryPlayerSymbol === "p1" ? "p2" : "p1"] || 0} | 🟢 دورك!`;
            } else {
                statusMsg = `⚔️ ضد ${opponentName || "..."} | نقاطك: ${onlineMemoryScores[myMemoryPlayerSymbol] || 0} | نقاطه: ${onlineMemoryScores[myMemoryPlayerSymbol === "p1" ? "p2" : "p1"] || 0} | ⏳ دور الخصم...`;
            }
            updateMemoryStatus(statusMsg);

            renderMemoryBoardOnline(opponentFlipped, isMyTurn);

            if (room.gameState === "finished" && !onlineMemoryGameOver) {
                onlineMemoryGameOver = true;
                memoryRoomRef.off("value");
                const myScore = onlineMemoryScores[myMemoryPlayerSymbol] || 0;
                const oppScore = onlineMemoryScores[myMemoryPlayerSymbol === "p1" ? "p2" : "p1"] || 0;
                if (myScore > oppScore) {
                    showOnlineMemoryResult("win");
                } else if (myScore < oppScore) {
                    showOnlineMemoryResult("lose");
                } else {
                    showOnlineMemoryResult("draw");
                }
            }
        }
    });
}

function updateMemoryStatus(text) {
  const statusEl = document.getElementById("memoryStatus");
  if (statusEl) statusEl.textContent = text;
}

function renderMemoryBoardOnline(opponentFlipped = [], isMyTurn = false) {
  const boardEl = document.getElementById("memoryBoard");
  if (!boardEl) return;
  boardEl.innerHTML = "";

  memoryBoardState.forEach((emoji, idx) => {
    const card = document.createElement("button");
    const isMatched = memoryMatched.includes(idx);
    const isFlippedByMe = memoryFlipped.includes(idx);
    const isFlippedByOpponent = opponentFlipped.includes(idx);

    let className = "memory-card";
    if (isMatched) className += " matched";
    else if (isFlippedByMe) className += " flipped";
    else if (isFlippedByOpponent) className += " flipped opponent-flip";

    let showEmoji = isMatched || isFlippedByMe || isFlippedByOpponent;
    card.className = className;
    card.textContent = showEmoji ? emoji : "";

    if (!isMyTurn || onlineMemoryGameOver) {
      card.disabled = true;
      card.style.cursor = "not-allowed";
      card.style.opacity = isMyTurn ? "1" : "0.6";
    }

    card.onclick = () => {
      if (isMyTurn && !onlineMemoryGameOver) flipMemoryCard(idx);
    };
    boardEl.appendChild(card);
  });
}

function showOnlineMemoryResult(result) {
  const retryEl = document.getElementById("memoryRetry");
  const resultEl = document.getElementById("memoryOnlineResult");
  const winsEl = document.getElementById("memoryWins");

  const newRetryEl = retryEl.cloneNode(true);
  retryEl.parentNode.replaceChild(newRetryEl, retryEl);

  let msg = "";
  if (result === "win") {
    msg = "🎉 أنت الفائز! ";
    memoryWins++;
    if (winsEl) winsEl.textContent = "Wins: " + memoryWins;
    updateMemoryUserWins();
    checkMemoryLeaderboardEligibility(memoryWins);
  } else if (result === "lose") {
    msg = "😢 لقد خسرت! حظ أوفر المرة القادمة";
  } else if (result === "draw") {
    msg = "🤝 تعادلتما! ";
  } else if (result === "abandoned") {
    msg = "..إنقطع الإتصال";
    updateMemoryStatus(msg);
  }

  if (resultEl) {
    resultEl.textContent = msg;
    resultEl.classList.remove("hidden");
  }

  if (newRetryEl) {
    newRetryEl.classList.remove("hidden");
    newRetryEl.textContent = (result === "abandoned") ? "حاول ثانية" : "العب مرة أخرى";

    const autoSolo = setTimeout(() => {
        switchMemoryMatchMode("solo");
    }, 5000);

    newRetryEl.addEventListener("click", async () => {
      clearTimeout(autoSolo);
      newRetryEl.classList.add("hidden");
      if (resultEl) resultEl.classList.add("hidden");

      await memoryRoomRef.update({
          gameState: "finished",
          p1_name: "", 
          p2_name: ""
      });

      updateMemoryStatus("جاري البحث عن خصم ...");
      joinMemoryGameOnline(); 
    });
  }
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

  if (activeMemoryMode === "online") {
    memoryRoomRef.update({ flippedByOpponent: memoryFlipped });
    renderMemoryBoardOnline([], true);
  } else {
    renderMemoryBoard();
  }

  if (memoryFlipped.length === 2) {
    memoryLocked = true;
    setTimeout(checkMemoryMatch, 700);
  }
}

function updateMemoryUserWins() {
    const user = auth.currentUser;
    if (!user) return;
    database.ref('users/' + user.uid + '/memoryWins').set(memoryWins);
}

function checkMemoryMatch() {
  const [first, second] = memoryFlipped;
  const isMatch = memoryBoardState[first] === memoryBoardState[second];

  if (isMatch) {
    memoryMatched.push(first, second);
  }

  memoryFlipped = [];
  memoryLocked = false;

  if (activeMemoryMode === "online") {
    const updates = { flippedByOpponent: [] };

    if (isMatch) {
      onlineMemoryScores[myMemoryPlayerSymbol] = (onlineMemoryScores[myMemoryPlayerSymbol] || 0) + 1;
      updates.scores = onlineMemoryScores;
      if (memoryMatched.length === memoryBoardState.length) {
        updates.gameState = "finished";
      }
    } else {
      updates.currentTurn = (myMemoryPlayerSymbol === "p1") ? "p2" : "p1";
    }

    memoryRoomRef.update(updates);
    renderMemoryBoardOnline([], isMatch);
  } else {
    renderMemoryBoard();

    if (memoryMatched.length === memoryBoardState.length) {
      memoryWins++;
      const memoryWinsEl = document.getElementById("memoryWins");
      if (memoryWinsEl) memoryWinsEl.textContent = "Wins: " + memoryWins;
      
      updateMemoryUserWins();
      updateMemoryStatus("كفو! أنهيت اللعبة بنجاح 🎉");
      
      checkMemoryLeaderboardEligibility(memoryWins);

      const retryEl = document.getElementById("memoryRetry");
      if (retryEl) {
        retryEl.textContent = "العب ثانية";
        retryEl.classList.remove("hidden");
        retryEl.onclick = () => retryMemoryGame();
      }
    }
  }
}

function checkMemoryLeaderboardEligibility(scoreToCheck) {
    let savedName = window.getCurrentUserName();

    if (savedName) {
        window.saveMemoryScoreToFirebase(scoreToCheck);
    } else {
        updateMemoryStatus("🎉 كفو! سجل دخولك لحفظ نتيجتك.");
        const saveNameBox = document.getElementById("memorySaveNameContainer");
        if (saveNameBox) {
            saveNameBox.classList.remove("hidden");
            saveNameBox.innerHTML = `
                <div style="text-align:center; padding:10px;">
                    <p style="color:#ff4fd8;">تريد تسجيل رقمك؟</p>
                    <button onclick="window.showAuthOverlay('login')" style="background:#ff4fd8; border:none; padding:10px 20px; border-radius:10px; color:white; cursor:pointer;">سجل دخولك الآن</button>
                </div>
            `;
        }
    }
}

function retryMemoryGame() {
  const retryEl = document.getElementById("memoryRetry");
  if (retryEl) {
    retryEl.classList.add("hidden");
  }
  
  updateMemoryStatus(""); 

  if (activeMemoryMode === "solo") {
    startMemoryGame();
  } else {
    joinMemoryGameOnline(); 
  }
}
// =================================================================
// 🖱️ محرك لعبة Clicker Game (حفظ وتحديث السكور مع كل كبسة)
// =================================================================
let score = 0;
let treeWins = 0;

// دالة حفظ السكور المحدثة مع كل كبسة
window.saveClickerScore = function(currentScore) {
    let name = window.getCurrentUserName();
    if (!name) return; // يجب تسجيل الدخول ليتم الحفظ باسم اللاعب

    const userKey = encodeURIComponent(name);
    const scoreRef = database.ref("leaderboards/clicker/" + userKey);

    scoreRef.once("value").then((snapshot) => {
        const oldData = snapshot.val();
        const oldScore = oldData ? (oldData.score || 0) : 0;

        // نقوم بتحديث السكور في قاعدة البيانات إذا كانت النتيجة الحالية أعلى من السابقة
        if (currentScore > oldScore) {
            scoreRef.set({
                name: name,
                score: currentScore,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                window.updateClickerLeaderboardView();
            });
        }
    });
};

function clickMe() {
    score++;
    
    // 1. تحديث نص السكور محلياً
    const clickScoreEl = document.getElementById("clickScore");
    if (clickScoreEl) clickScoreEl.textContent = "Score: " + score;

    // 2. تحديث شكل الشجرة حسب السكور
    let treeStage = "🌱";
    if (score >= 95) treeStage = "🌳";
    else if (score >= 70) treeStage = "🌲";
    else if (score >= 30) treeStage = "🌿";
    
    const treeVis = document.getElementById("treeVisualization");
    if (treeVis) treeVis.textContent = treeStage;

    // ⚡ 3. حفظ السكور المباشر وتحديث الليدربورد فورا مع كل كبسة!
    window.saveClickerScore(score);

    // 4. الاحتفاظ بمنطق الفوز واكتساب الشجرة عند النقرة 100
    if (score === 100) {
        const treeCountEl = document.getElementById("treeCount");
        const treeRetryEl = document.getElementById("treeRetry");
        const treeMsg = document.getElementById("treeMessage");

        if (treeCountEl) treeCountEl.style.display = "block"; 
        if (treeRetryEl) treeRetryEl.style.display = "block"; 
        if (treeMsg) treeMsg.classList.remove("hidden");
        
        treeWins++;
        if (treeCountEl) treeCountEl.textContent = "Tree count: " + treeWins;
        
        const user = auth.currentUser;
        if (user) {
            database.ref("users/" + user.uid + "/treeWins").set(treeWins);
        }
    }
}

function retryTree() {
    score = 0;
    const clickScoreEl = document.getElementById("clickScore");
    if (clickScoreEl) clickScoreEl.textContent = "Score: 0";
    const treeVis = document.getElementById("treeVisualization");
    if (treeVis) treeVis.textContent = "🌱";
    
    const treeMsg = document.getElementById("treeMessage");
    if (treeMsg) treeMsg.classList.add("hidden");
    const treeRetry = document.getElementById("treeRetry");
    if (treeRetry) treeRetry.classList.add("hidden");
}

// عرض أعلى 5 نتائج في الليدربورد مع تمييز اسمك بالذهبي
window.updateClickerLeaderboardView = function() {
    const viewEl = document.getElementById("clickerOnlineLeaderboardView");
    if (!viewEl) return;

    database.ref("leaderboards/clicker")
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                let data = child.val();
                if (data && data.name) scores.push(data);
            });
            
            // ترتيب تنازلي حسب السكور
            scores.sort((a, b) => (b.score || 0) - (a.score || 0));
            let top5 = scores.slice(0, 5);
            let myName = window.getCurrentUserName();

            viewEl.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe 
                    ? "color: #FFD700; text-shadow: 0 0 5px #FFD700; font-weight: bold;" 
                    : "color: #ffffff;";
                
                return `<div style="${style} margin-bottom: 3px;">${i + 1}. <b>${u.name}</b>: (سكور: ${u.score || 0})</div>`;
            }).join("") : "لا توجد نتائج مسجلة.";
        });
};
// تعديل الدالة لترتيب وعرض أفضل 5 لاعبين بشكل صحيح
window.updateClickerLeaderboardView = function() {
    const viewEl = document.getElementById("clickerOnlineLeaderboardView");
    if (!viewEl) return;

    database.ref("leaderboards/clicker")
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                let data = child.val();
                if(data && data.name) scores.push(data);
            });
            
            // ترتيب تنازلي حسب النقاط
            scores.sort((a, b) => (b.score || 0) - (a.score || 0));
            // أخذ أفضل 5 لاعبين فقط
            let top5 = scores.slice(0, 5);
            let myName = window.getCurrentUserName();

            viewEl.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe 
                    ? "color: #FFD700; text-shadow: 0 0 5px #FFD700; font-weight: bold;" 
                    : "color: #ffffff;";
                
                return `<div style="${style} margin-bottom: 3px;">${i + 1}. <b>${u.name}</b>: (سكور: ${u.score || 0})</div>`;
            }).join("") : "لا توجد نتائج مسجلة.";
        });
};

// =================================================================
// ⚙️ بوابات التشغيل والتهيئة (Initialization)
// =================================================================
window.addEventListener("DOMContentLoaded", () => {
  try {
    draw();
    listenToOnlineChat();
    listenToOnlineXORoom();
    window.updateClickerLeaderboardView();

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

window.updateBunnyLeaderboardView = function() {
    const view = document.getElementById("bunnyLeaderboardView");
    if (!view) return;

    database.ref("leaderboards/bunny")
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                if (child.val() && child.val().name) {
                    scores.push(child.val());
                }
            });

            scores.sort((a, b) => (b.score || 0) - (a.score || 0));
            let top5 = scores.slice(0, 5);
            let myName = window.getCurrentUserName();

            view.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let glow = "text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);";
                let style = isMe 
                    ? `color: #FFD700; font-weight: bold; ${glow}` 
                    : `color: #fff;`;
                
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score || 0} قلوب)</div>`;
            }).join("") : "لا توجد نتائج بعد.";
        });
};

window.addEventListener('load', () => {
    updateBunnyLeaderboardView(); 
});

window.saveBunnyScoreToLeaderboard = function(score) {
    let savedName = window.getCurrentUserName();
    if (!savedName) return;

    const userKey = encodeURIComponent(savedName);

    database.ref("leaderboards/bunny/" + userKey).set({
        name: savedName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        updateBunnyLeaderboardView();
    }).catch(err => {
        console.error("خطأ:", err);
    });
};

function resetMemoryRoom() {
    memoryRoomRef.set({
        p1_name: "",
        p2_name: "",
        gameState: "waiting",
        board: []
    });
}
