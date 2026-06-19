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


function initGameSystem() {
    const savedName = localStorage.getItem("xoPlayerName");
    if (savedName) {
        // كود تشغيل الواجهة هنا...
    }
}

window.addEventListener('load', () => {
    // 1. تهيئة النظام العام
    if (typeof initGameSystem === 'function') {
        initGameSystem();
    }

    // 2. التحقق من وجود سكور معلق للعبة الأرنب
    checkPendingBunnyScore();
});

function checkPendingBunnyScore() {
    let savedName = window.getCurrentUserName();

    if (savedName && pendingScore) {
        console.log("تم اكتشاف سكور معلق، جاري حفظه...");
        // استخدام parseInt للتأكد من أن القيمة رقم
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
// 💬 محرك الشات العالمي المباشر (Online Global Chat Room) - المطور
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

  // الاستماع المستمر لقاعدة البيانات
  database.ref("global_chat").on("value", (snapshot) => {
    box.innerHTML = ""; // تنظيف الشات
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const div = document.createElement("div");
      div.className = "chat-message";
      // عرض الاسم والرسالة كما هي مخزنة في القاعدة
      div.textContent = data.name + ": " + data.msg;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight; // النزول لآخر رسالة
  });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("المستخدم مسجل الآن باسم:", user.displayName);
    } else {
        console.log("لا يوجد مستخدم مسجل");
    }
});

// دالة واحدة تعوضك عن كل تعب الـ localStorage
function getMyName() {
    // إذا كان المستخدم مسجلاً في Firebase، هات اسمه، وإلا ارجعي بـ null
    return auth.currentUser ? auth.currentUser.displayName : null;
}

function send() {
  const msgField = document.getElementById("msg");
  const msg = msgField.value.trim();
  
  // 1. جلب المستخدم الحالي من Firebase Auth مباشرة
  const user = auth.currentUser;

  // 2. التحقق من وجود مستخدم (إذا لم يسجل دخول، نفتح نافذة التسجيل)
  if (!user) {
      alert("سجل دخولك أولاً لتتمكن من الدردشة!");
      if (typeof window.showAuthOverlay === 'function') {
          window.showAuthOverlay('login');
      }
      return;
  }

  // 3. استخدام اسم المستخدم من حساب Firebase
  const senderName = user.displayName || "مستخدم";

  if(msg === ""){ alert("لا يمكنك ترك رسالة فارغة"); return; }

  // 4. الإرسال إلى Firebase (هذا سيظهر للجميع فوراً)
  database.ref("global_chat").push({ 
      name: senderName, 
      msg: msg,
      timestamp: firebase.database.ServerValue.TIMESTAMP // إضافة وقت للرسالة
  });
  
  msgField.value = "";
}

// تحديث واجهة الشات عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const nameField = document.getElementById("name");
    const savedName = window.getCurrentUserName();
    
    // إذا كان المستخدم مسجلاً، نعطل حقل الاسم ونملأه تلقائياً
    if (savedName && nameField) {
        nameField.value = savedName;
        nameField.readOnly = true;
        nameField.style.opacity = "0.7";
    }
});

// =================================================================
// ❌ محرك لعبة XO المطورة (نسخة محسنة: بوت متوازن + أونلاين مستقر)
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

    // حفظ النتيجة في Firebase (بنفس منطق الألعاب الأخرى)
    const userKey = encodeURIComponent(chosenName);
    database.ref("leaderboards/xo/" + userKey).set({
        name: chosenName,
        wins: xoWins, // xoWins هو المتغير الموجود لديك حالياً
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert("تم حفظ نتيجتك في الصدارة!");
        document.getElementById("xoSaveNameContainer").classList.add("hidden");
        updateXOLeaderboardView(); // دالة تحديث العرض
    });
};

window.updateXOLeaderboardView = function() {
    const view = document.getElementById("onlineLeaderboardView");
    if (!view) return;

    database.ref("leaderboards/xo")
        .orderByChild("wins")
        .limitToLast(5)
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => scores.push(child.val()));
            scores.sort((a, b) => b.wins - a.wins);

            view.innerHTML = scores.length > 0 ? scores.map((u, i) => {
                return `<div style="margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.wins} فوز)</div>`;
            }).join("") : "لا توجد نتائج مسجلة.";
        });
};

window.playAgain = function() {
    xoGameOver = false; // فك قفل اللعبة محلياً
    
    database.ref("online_xo/room").update({
        board: ["", "", "", "", "", "", "", "", ""],
        turn: "X",
        winner: "",
        isDraw: false,
        statusMessage: "بدأت الجولة!" // إضافة الرسالة لـ Firebase
    }).then(() => {
        document.getElementById("xoMessage").classList.add("hidden");
        document.getElementById("xoReset").classList.add("hidden");
    });
};

function updateWinnerScore() {
    const user = auth.currentUser;
    if (!user) return;
    
    // تأكدي أن هذا المسار يطابق قاعدة بياناتك
    const userRef = database.ref('users/' + user.uid + '/wins');
    userRef.transaction((currentWins) => {
        return (currentWins || 0) + 1;
    });
}

async function switchXOMode(mode) {
    const boardDiv = document.getElementById("xoBoard");
    const statusDiv = document.getElementById("xoStatusInfo");
    const leaderboardBox = document.getElementById("xoLeaderboardContainer");

    // 1. تنظيف أي استماع سابق وفك القفل فوراً عند التبديل
    database.ref("online_xo/room").off("value");
    activeXOMode = mode;
    
    // فك قفل اللوحة عند أي تغيير للنمط
    if (boardDiv) {
        boardDiv.style.pointerEvents = "auto";
        boardDiv.style.opacity = "1";
    }

    // 2. تحديث الأزرار
    document.getElementById("xoModeBot")?.classList.toggle("active", mode === "bot");
    document.getElementById("xoModeOnline")?.classList.toggle("active", mode === "online");

    if (mode === "bot") {
        statusDiv.textContent = "الوضع الحالي: اللعب ضد البوت";
        if (leaderboardBox) leaderboardBox.classList.add("hidden");
        // استدعاء دالة resetXO خارج أي transaction
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
        
        // استخدام transaction لضمان عدم حدوث تضارب في الدخول
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
                // عند نجاح الاتصال، نبدأ الاستماع
                listenToOnlineXORoom();
            }
        });
    }
}

// دالة resetXO يجب أن تكون خارج switchXOMode وتعرف مرة واحدة فقط
function resetXO() {
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;
    xoWins = 0; 
    
    // تحديث الواجهة
    updateLocalBoard(board); 
    
    document.getElementById("xoStatusInfo").textContent = "الوضع الحالي: اللعب ضد البوت";
}
function leaveOnlineRoom() {
    const roomRef = database.ref("online_xo/room");
    // حذف الغرفة عند الخروج الطوعي
    roomRef.remove().then(() => {
        console.log("تم إغلاق الغرفة بنجاح");
        // هنا يمكنك إعادة تفعيل الواجهة الأصلية أو الليدربورد
    });
}

function draw() {
    const b = document.getElementById("xoBoard");
    if (!b) return;

    // دائماً اجعليها تظهر (أو اتركي الـ CSS يتحكم بها)
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
    console.log("تم الضغط على زر إعادة اللعب!"); // لنتأكد هل يعمل الزر فعلاً عند الضغط عليه

    // 1. تصفير مصفوفة اللعبة
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;

    // 2. إخفاء رسائل النتيجة
    const messageDiv = document.getElementById("xoMessage");
    if (messageDiv) {
        messageDiv.textContent = "";
        messageDiv.classList.add("hidden"); // إخفاء الرسالة
    }

    // 3. إخفاء الزر نفسه بعد الضغط
    const resetBtn = document.getElementById("xoReset");
    if (resetBtn) {
        resetBtn.classList.add("hidden"); 
    }

    // 4. إعادة رسم اللوحة (هذه أهم خطوة)
    draw(); 
}

function smartBotMove() {
  // محاولة الفوز
  for (let line of winLines) {
    let cells = line.map(idx => board[idx]);
    if (cells.filter(c => c === "O").length === 2 && cells.filter(c => c === "").length === 1) {
      board[line[cells.indexOf("")]] = "O"; return;
    }
  }
  // محاولة دفاع ذكية بنسبة 70% (لجعل البوت متوسط الصعوبة)
  if (Math.random() < 0.7) {
    for (let line of winLines) {
      let cells = line.map(idx => board[idx]);
      if (cells.filter(c => c === "X").length === 2 && cells.filter(c => c === "").length === 1) {
        board[line[cells.indexOf("")]] = "O"; return;
      }
    }
  }
  // حركة عشوائية لضمان عدم التجميد وسهولة التغلب عليه أحياناً
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

function handleXOCellClick(i) {
  // إذا كانت الخانة مشغولة أو اللعبة منتهية، نخرج
  if (board[i] !== "" || xoGameOver) return;

  // عند الضغط على خانة، يجب التأكد أن اللوحة "مفتوحة" (pointerEvents)
  // هذا السطر يضمن أن اللوحة تستجيب للضغط
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
    // كود الأونلاين يظل كما هو دون تغيير
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

function resetGame(isOnline = false) {
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;
    
    draw(); 
    updateXOReset();
    const msg = document.getElementById("xoMessage");
    if (msg) { msg.textContent = ""; msg.classList.add("hidden"); }

    if (isOnline) {
        database.ref("online_xo/room").update({
            board: board,
            winner: "",
            isDraw: false,
            turn: "X"
        });
    }
}

function listenToOnlineXORoom() {
    const statusDiv = document.getElementById("xoStatusInfo");
    const boardDiv = document.getElementById("xoBoard");
    const roomRef = database.ref("online_xo/room");

    // 1. الحارس: إذا لم نكن في وضع الأونلاين، لا تفعل شيئاً
    if (activeXOMode !== "online") {
        roomRef.off("value");
        return;
    }

    // إضافة خاصية "الحذف التلقائي للغرفة" عند انقطاع اتصال اللاعب
    roomRef.onDisconnect().remove();

    // 2. البدء بالاستماع للتحديثات
    roomRef.on("value", (snapshot) => {
        if (activeXOMode !== "online") {
            roomRef.off("value");
            return;
        }

        const room = snapshot.val();
        
        // معالجة خروج الخصم أو حذف الغرفة
        if (!room) {
            statusDiv.innerHTML = "انقطع اتصال الخصم. جاري العودة للوضع الرئيسي...";
            boardDiv.style.pointerEvents = "none";
            setTimeout(() => switchXOMode('bot'), 3000);
            return;
        }

        // 3. تحديث واجهة الحالة واللوحة
        if (!room.player2) {
            statusDiv.innerHTML = `بانتظار انضمام الخصم...<br>أنت: <b>${room.player1}</b>`;
            boardDiv.style.pointerEvents = "none"; 
            boardDiv.style.opacity = "0.5";
        } else {
            boardDiv.style.pointerEvents = "auto"; 
            boardDiv.style.opacity = "1";

            // التعامل مع رسالة "بدأت الجولة" إذا تم تفعيلها من Play Again
            if (room.statusMessage) {
                statusDiv.innerHTML = `<b>${room.statusMessage}</b>`;
                // مسح الرسالة بعد ثانيتين من Firebase
                setTimeout(() => {
                    database.ref("online_xo/room/statusMessage").remove();
                }, 2000);
            } 
            // تحديد الحالة (انتهت الجولة أم دور من؟)
            else if (room.winner || room.isDraw) {
                statusDiv.innerHTML = "<b>انتهت الجولة!</b>";
            } else {
                const isMyTurn = (room.turn === onlineXOSymbol);
                const turnName = isMyTurn ? "دورك الآن!" : "انتظار الخصم...";
                statusDiv.innerHTML = `<b>${room.player1}</b> vs <b>${room.player2}</b><br>الحالة: ${turnName}`;
            }
        }

        // 4. تحديث الخانات محلياً
        updateLocalBoard(room.board);

        // 5. فحص النتيجة (هذه هي التي تُحرك نظام الـ Wins والصدارة)
        checkGameResult(room);
    });
}

// دالة تحديث اللوحة بشكل بسيط
function updateLocalBoard(newBoard) {
    if (newBoard && newBoard.join("") !== board.join("")) {
        board = newBoard;
        draw();
    }
}

function updateUIStatus(room) {
    const statusDiv = document.getElementById("xoStatusInfo");
    if (!statusDiv) return;

    // 1. حالة الفوز
    if (room.winner) {
        statusDiv.textContent = (room.winner === onlineXOSymbol) ? "فزت! 🎉" : "خسرت! 😢";
    } 
    // 2. إذا كان هناك لاعبان في الغرفة (إظهار أسماء اللاعبين)
    else if (room.player1 && room.player2) {
        const opponent = (onlineXOSymbol === "X") ? room.player2 : room.player1;
        
        // إظهار: فلان يلعب مع فلان
        let infoText = `جاري اللعب: ${room.player1} vs ${room.player2} | `;
        
        // إظهار: دور مَن؟
        infoText += (room.turn === onlineXOSymbol) ? "دورك الآن!" : `دور ${opponent}..`;
        
        statusDiv.textContent = infoText;
    }
    // 3. إذا كان اللاعب ينتظر
    else {
        statusDiv.textContent = "بانتظار انضمام الخصم...";
    }
}

function checkGameResult(room) {
    // 1. التأكد من انتهاء الجولة وأن النتيجة لم تُسجل محلياً بعد
    if ((room.winner || room.isDraw) && !xoGameOver) {
        xoGameOver = true; // قفل اللعبة محلياً لمنع التكرار
        
        // 2. فحص النتيجة
        if (room.winner === onlineXOSymbol) {
            handleXOResult("win");
            
            // تحديث الـ wins الخاص بك في بروفايلك الشخصي
            updateWinnerScore(); 
            
            // تحديث الصدارة العالمية
            const myName = window.getCurrentUserName();
            if (myName) {
                updateGlobalLeaderboard(myName);
            }
        } else if (room.isDraw) {
            handleXOResult("draw");
        } else {
            handleXOResult("lose");
        }
        
        // 3. إظهار زر اللعب مرة أخرى
        const resetBtn = document.getElementById("xoReset");
        if (resetBtn) resetBtn.classList.remove("hidden");
    }
}

function updateGlobalLeaderboard(name) {
    if (!name) return;
    // تحديث الصدارة في مسار online_xo/players
    database.ref("online_xo/players/" + encodeURIComponent(name)).transaction((p) => {
        return p ? { wins: (p.wins || 0) + 1 } : { wins: 1 };
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

// Online memory game state
let onlineMemoryScores = { p1: 0, p2: 0 };
let onlineMemoryGameOver = false;

function switchMemoryMatchMode(matchMode) {
  // 1. حارس الدخول (كما هو)
  if (matchMode === "online" && !window.getCurrentUserName()) {
    alert("يجب عليك تسجيل الدخول أولا للعب أونلاين!");
    if (typeof window.showAuthOverlay === 'function') {
        window.showAuthOverlay('login');
    }
    return;
  }

  // --- التغيير الجوهري هنا: تنظيف الغرفة إذا كنا نخرج من الأونلاين ---
  if (activeMemoryMode === "online" && matchMode === "solo") {
    // نقوم بمسح البيانات الحالية للغرفة حتى لا يظهر اللاعب "معلقاً" فيها
    memoryRoomRef.set({
        p1_name: "",
        p2_name: "",
        gameState: "finished",
        board: []
    });
    // إيقاف أي استماع سابق للغرفة
    memoryRoomRef.off("value");
  }
  // -------------------------------------------------------------

  activeMemoryMode = matchMode;
  document.getElementById("memoryPlaySolo").classList.toggle("active", matchMode === "solo");
  document.getElementById("memoryPlayOnline").classList.toggle("active", matchMode === "online");
  
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
    // تأكيد إيقاف الاستماع في حال لم يكن قد توقف
    memoryRoomRef.off("value");
    if (diffControls) diffControls.classList.remove("hidden");
    if (leaderboardBox) leaderboardBox.classList.remove("hidden");
    setMemoryMode(memoryMode);
  } else {
    if (diffControls) diffControls.classList.add("hidden");
    if (leaderboardBox) leaderboardBox.classList.add("hidden");
    
    updateMemoryStatus("جاري البحث عن خصم..");
    // هذه الدوال ستتولى إعادة الاتصال بـ Firebase
    listenToOnlineMemoryRoom(); 
    joinMemoryGameOnline(); 
  }
}
function setMemoryMode(mode) {
  memoryMode = mode;
  
  // تحديث حالة الأزرار (تأكد من وجود هذه العناصر في HTML)
  document.getElementById("memoryEasy").classList.toggle("active", mode === "easy");
  document.getElementById("memoryMedium").classList.toggle("active", mode === "medium");
  document.getElementById("memoryHard").classList.toggle("active", mode === "hard");
  
  document.getElementById("memoryLeaderboardTitle").textContent = `🏆 لوحة الصدارة (${mode.toUpperCase()})`;
  
  updateMemoryStatus(""); 
  startMemoryGame();
  
  // استدعاء دالة التحديث بعد تغيير الوضع
  updateMemoryLeaderboardView(); 
}

window.updateMemoryLeaderboardView = function() {
    const view = document.getElementById("memoryOnlineLeaderboardView");
    if (!view) return;

    // عرض مؤشر التحميل فوراً
    view.innerHTML = " جاري التحميل..";

    // جلب البيانات من Firebase حسب المستوى (memoryMode)
    database.ref("leaderboards/memory/" + memoryMode)
        .orderByChild("score")
        .limitToLast(5)
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => scores.push(child.val()));
            
            // ترتيب تنازلي (الأعلى فوزاً في الأعلى)
            scores.sort((a, b) => b.score - a.score);

            let myName = window.getCurrentUserName();

            view.innerHTML = scores.length > 0 ? scores.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let glow = "text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);";
                let style = isMe 
                    ? `color: #FFD700; font-weight: bold; ${glow}` 
                    : `color: #fff; ${glow}`;
                
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score} فوز)</div>`;
            }).join("") : "لا توجد نتائج مسجلة في هذا المستوى بعد.";
        });
};

window.saveMemoryScoreToFirebase = function(score) {
    let savedName = window.getCurrentUserName();
    if (!savedName) return;

    const userKey = encodeURIComponent(savedName);
    // حفظ النتيجة في المسار الخاص بالمستوى الحالي
    database.ref("leaderboards/memory/" + memoryMode + "/" + userKey).set({
        name: savedName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        // تحديث الليدربورد بعد الحفظ
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

// 1. دالة إنشاء لوحة اللعب (دائماً 20 بطاقة)
function generateBoard() {
    const emojis = memoryEmojis.slice(0, 10);
    return [...emojis, ...emojis].sort(() => Math.random() - 0.5);
}

// 2. دالة الانضمام (بسيطة ومباشرة)
function joinMemoryGameOnline() {
    const myName = window.getCurrentUserName();
    onlineMemoryGameOver = false;
    onlineMemoryScores = { p1: 0, p2: 0 };
    
    // تنظيف زر المحاولة وبطاقة النتيجة
    const retryEl = document.getElementById("memoryRetry");
    if (retryEl) retryEl.classList.add("hidden");
    const resultEl = document.getElementById("memoryOnlineResult");
    if (resultEl) resultEl.classList.add("hidden");

    memoryRoomRef.once("value", (snapshot) => {
        const room = snapshot.val() || {};

        // الحالة أ: الغرفة فاضية أو منتهية -> أنت اللاعب الأول (p1)
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
        // الحالة ب: الغرفة تنتظر -> أنت اللاعب الثاني (p2)
        else if (room.gameState === "waiting" && room.p1_name !== myName) {
            myMemoryPlayerSymbol = "p2";
            memoryRoomRef.update({
                p2_name: myName,
                gameState: "playing",
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
            updateMemoryStatus("⚔️  ! ابدأ اللعب");
        }
    });
    
    // عند انقطاع الاتصال: تعليم الغرفة بالخروج
    memoryRoomRef.onDisconnect().update({ gameState: "abandoned" });
}

// دالة المراقبة الموحدة (يجب أن تكون واحدة فقط)
function listenToOnlineMemoryRoom() {
    memoryRoomRef.off("value"); // تنظيف أي استماع قديم
    
    memoryRoomRef.on("value", (snapshot) => {
        if (activeMemoryMode !== "online") return;
        
        const room = snapshot.val();
        if (!room) return;

        // حالة: خصمك غادر
        if (room.gameState === "abandoned" && !onlineMemoryGameOver) {
            onlineMemoryGameOver = true;
            memoryRoomRef.off("value");
            updateMemoryStatus("❌ خصمك غادر!");
            showOnlineMemoryResult("abandoned");
            return;
        }

        // الحالة 1: انتظار الخصم
        if (room.gameState === "waiting") {
            updateMemoryStatus("جاري البحث عن خصم..");
            return;
        }

        // الحالة 2: اللعبة بدأت
        if ((room.gameState === "playing" || room.gameState === "finished") && room.board) {
            memoryBoardState = room.board;

            // تحديث النقاط محلياً
            if (room.scores) {
                onlineMemoryScores = room.scores;
            }

            // مزامنة البطاقات المقلوبة من الخصم
            const opponentFlipped = room.flippedByOpponent || [];

            // تحديد اسم الخصم
            let opponentName = (myMemoryPlayerSymbol === "p1") ? room.p2_name : room.p1_name;
            let myName = window.getCurrentUserName();

            // تحديد رسالة الدور
            const isMyTurn = (room.currentTurn === myMemoryPlayerSymbol);
            let statusMsg;
            if (isMyTurn) {
                statusMsg = `⚔️ ضد ${opponentName || "..."} | نقاطك: ${onlineMemoryScores[myMemoryPlayerSymbol] || 0} | نقاطه: ${onlineMemoryScores[myMemoryPlayerSymbol === "p1" ? "p2" : "p1"] || 0} | 🟢 دورك!`;
            } else {
                statusMsg = `⚔️ ضد ${opponentName || "..."} | نقاطك: ${onlineMemoryScores[myMemoryPlayerSymbol] || 0} | نقاطه: ${onlineMemoryScores[myMemoryPlayerSymbol === "p1" ? "p2" : "p1"] || 0} | ⏳ دور الخصم...`;
            }
            updateMemoryStatus(statusMsg);

            // رسم اللوحة مع البطاقات المقلوبة من الخصم مرئية
            renderMemoryBoardOnline(opponentFlipped, isMyTurn);

            // التحقق من انتهاء اللعبة
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

// رسم اللوحة في الوضع الأونلاين (يُظهر بطاقات الخصم المقلوبة)
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
    else if (isFlippedByOpponent) className += " flipped opponent-flip"; // بطاقة الخصم مرئية

    let showEmoji = isMatched || isFlippedByMe || isFlippedByOpponent;
    card.className = className;
    card.textContent = showEmoji ? emoji : "";

    // تعطيل اللوحة إذا ليس دوري
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


// عرض نتيجة اللعبة الأونلاين
function showOnlineMemoryResult(result) {
  const retryEl = document.getElementById("memoryRetry");
  const resultEl = document.getElementById("memoryOnlineResult");
  const winsEl = document.getElementById("memoryWins");

  // تنظيف الزر بشكل صحيح
  const newRetryEl = retryEl.cloneNode(true);
  retryEl.parentNode.replaceChild(newRetryEl, retryEl);

  let msg = "";
  if (result === "win") {
    msg = "🎉 أنت الفائز! ";
    memoryWins++;
    if (winsEl) winsEl.textContent = "Wins: " + memoryWins;
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

    // توقيت التحويل للوضع الفردي
    const autoSolo = setTimeout(() => {
        switchMemoryMatchMode("solo");
    }, 5000);

    newRetryEl.addEventListener("click", async () => {
      // 1. إلغاء التحويل التلقائي فوراً
      clearTimeout(autoSolo);
      
      newRetryEl.classList.add("hidden");
      if (resultEl) resultEl.classList.add("hidden");

      // 2. ضبط حالة Firebase للخروج من الغرفة الحالية
      // هذا يضمن أن السيرفر لا يراك داخل الغرفة القديمة
      await memoryRoomRef.update({
          gameState: "finished",
          p1_name: "", 
          p2_name: ""
      });

      // 3. إعادة تعيين الحالة للبحث عن مباراة جديدة
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
    // مزامنة البطاقات المقلوبة مع Firebase حتى يراها الخصم
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

function checkMemoryMatch() {
  const [first, second] = memoryFlipped;
  const isMatch = memoryBoardState[first] === memoryBoardState[second];

  if (isMatch) {
    memoryMatched.push(first, second);
  }

  memoryFlipped = [];
  memoryLocked = false;

  if (activeMemoryMode === "online") {
    // مسح البطاقات المقلوبة من Firebase
    const updates = { flippedByOpponent: [] };

    if (isMatch) {
      // زيادة نقطة اللاعب الحالي
      onlineMemoryScores[myMemoryPlayerSymbol] = (onlineMemoryScores[myMemoryPlayerSymbol] || 0) + 1;
      updates.scores = onlineMemoryScores;
      // التحقق من انتهاء اللعبة (جميع البطاقات متطابقة)
      if (memoryMatched.length === memoryBoardState.length) {
        updates.gameState = "finished";
      }
      // الفائز بالزوج يحتفظ بدوره
    } else {
      // تبديل الدور عند الخطأ
      updates.currentTurn = (myMemoryPlayerSymbol === "p1") ? "p2" : "p1";
    }

    memoryRoomRef.update(updates);
    renderMemoryBoardOnline([], isMatch); // إذا طابق، دوره يبقى
  } else {
    renderMemoryBoard();

    if (memoryMatched.length === memoryBoardState.length) {
      memoryWins++;
      document.getElementById("memoryWins").textContent = "Wins: " + memoryWins;
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
        // الاتصال المباشر بـ Firebase كما في لعبة الأرنب
        const userKey = encodeURIComponent(savedName);
        const ref = database.ref("leaderboards/memory/" + memoryMode + "/" + userKey);

        ref.once("value", (snapshot) => {
            const oldData = snapshot.val();
            const oldScore = oldData ? oldData.score : 0;

            if (scoreToCheck > oldScore) {
                ref.set({
                    name: savedName,
                    score: scoreToCheck,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    console.log("✅ تم حفظ نتيجة الذاكرة بنجاح!");
                    updateMemoryLeaderboardView();
                });
            }
        });
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

// 2. الدالة المسؤولة عن تحديث القائمة (باللون الذهبي للاعب)
function saveScoreToLeaderboard(name, score) {
    
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

window.updateMemoryLeaderboardView = function() {
    const view = document.getElementById("memoryOnlineLeaderboardView");
    if (!view) return;

    view.innerHTML = "جاري التحميل...";

    database.ref("leaderboards/memory/" + memoryMode)
        .orderByChild("score")
        .limitToLast(5)
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => scores.push(child.val()));
            scores.sort((a, b) => b.score - a.score);

            let myName = window.getCurrentUserName();

            view.innerHTML = scores.length > 0 ? scores.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe ? "color: #FFD700; font-weight: bold; text-shadow: 0 0 5px #FFD700;" : "color: #fff;";
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score} فوز) ${isMe ? ' 👑' : ''}</div>`;
            }).join("") : "لا توجد نتائج مسجلة بعد.";
        });
};

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
// 🖱️ محرك لعبة Clicker  
// =================================================================
let score = 0;
let treeWins = 0;

window.onload = function() {
    let name = window.getCurrentUserName();
    if (name) {
        database.ref("users/" + encodeURIComponent(name) + "/treeWins").once("value").then((snapshot) => {
            treeWins = snapshot.val() || 0;
            document.getElementById("treeCount").textContent = "Tree count: " + treeWins;
        });
    }
    // استدعاء الدالة بدون وسيط
    window.updateClickerLeaderboardView();
};

function clickMe() {
    score++;
    document.getElementById("clickScore").textContent = "Score: " + score;
    window.saveClickerScore(score);

    let treeStage = "🌱";
    if (score >= 95) treeStage = "🌳";
    else if (score >= 70) treeStage = "🌲";
    else if (score >= 30) treeStage = "🌿";
    
    document.getElementById("treeVisualization").textContent = treeStage;

    // الشرط الجديد: الوصول لـ 100
    if (score === 100) {
        // 1. إظهار العناصر المخفية (إزالة الإخفاء)
        document.getElementById("treeCount").style.display = "block"; 
        document.getElementById("treeRetry").style.display = "block"; // إذا كان display: none في CSS
        document.getElementById("treeMessage").classList.remove("hidden");
        
        // 2. زيادة عدد الأشجار
        treeWins++;
        document.getElementById("treeCount").textContent = "Tree count: " + treeWins;
        
        // 3. حفظ التحديث في الحساب
        let name = window.getCurrentUserName();
        if (name) {
            database.ref("users/" + encodeURIComponent(name) + "/treeWins").set(treeWins);
            // حفظ أعلى سكور في ليدربورد الأشجار
            window.saveTreeScore(treeWins); 
        }
    }
}

// دالة إعادة اللعب (Retry)
function retryTree() {
    score = 0;
    document.getElementById("clickScore").textContent = "Score: 0";
    document.getElementById("treeVisualization").textContent = "🌱";
    document.getElementById("treeMessage").classList.add("hidden");
    document.getElementById("treeRetry").classList.add("hidden");
}

window.saveClickerScore = function(currentScore) {
    let name = window.getCurrentUserName();
    if (!name) return;

    const userKey = encodeURIComponent(name);
    const scoreRef = database.ref("leaderboards/clicker/" + userKey);

    // جلب السكور القديم للمقارنة
    scoreRef.once("value").then((snapshot) => {
        const oldData = snapshot.val();
        const oldScore = oldData ? (oldData.score || 0) : 0;

        // الحفظ فقط إذا كان السكور الجديد أعلى
        if (currentScore > oldScore) {
            scoreRef.set({
                name: name,
                score: currentScore,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                console.log("✅ تم تحديث أعلى سكور في Firebase!");
                window.updateClickerLeaderboardView(); // تحديث اللوحة بعد الحفظ
            });
        }
    });
};

window.updateClickerLeaderboardView = function() {
    const viewEl = document.getElementById("clickerOnlineLeaderboardView");
    if (!viewEl) return;

    database.ref("leaderboards/clicker")
        .orderByChild("score")
        .limitToLast(5)
        .once("value")
        .then((snapshot) => {
            let scores = [];
            snapshot.forEach(child => {
                let data = child.val();
                if(data.name) scores.push(data);
            });
            
            scores.sort((a, b) => b.score - a.score);
            let myName = window.getCurrentUserName();

            viewEl.innerHTML = scores.length > 0 ? scores.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe 
                    ? "color: #FFD700; text-shadow: 0 0 5px #FFD700; font-weight: bold;" 
                    : "color: #ffffff;";
                
                // هنا التعديل: إضافة كلمة SCORE داخل الأقواس
                return `<div style="${style} margin-bottom: 3px;">${i + 1}. <b>${u.name}</b>: (سكور: ${u.score})</div>`;
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

    let myName = window.getCurrentUserName();
    const userKey = encodeURIComponent(myName);

    // 1. جلب الـ 5 الأوائل
    const topScoresPromise = database.ref("leaderboards/bunny")
        .orderByChild("score")
        .limitToLast(5)
        .once("value");

    // 2. جلب نتيجتك الخاصة (لضمان وجودك دائماً)
    const myScorePromise = database.ref("leaderboards/bunny/" + userKey).once("value");

    Promise.all([topScoresPromise, myScorePromise]).then(([topSnap, mySnap]) => {
        let scoresMap = new Map();

        // إضافة الـ 5 الأوائل للقائمة
        topSnap.forEach(child => {
            scoresMap.set(child.key, child.val());
        });

        // إضافة نتيجتك (سواء كنت ضمن الـ 5 أو لا)
        if (mySnap.exists()) {
            scoresMap.set(mySnap.key, mySnap.val());
        }

        // تحويل الخريطة إلى مصفوفة وترتيبها
        let scores = Array.from(scoresMap.values());
        scores.sort((a, b) => b.score - a.score);

        // أخذ أول 5 فقط بعد الترتيب
        let displayScores = scores.slice(0, 5);

        view.innerHTML = displayScores.length > 0 ? displayScores.map((u, i) => {
            let isMe = (myName && u.name === myName);
            let glow = "text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);";
            let style = isMe 
                ? `color: #FFD700; font-weight: bold; ${glow}` 
                : `color: #fff; ${glow}`;
            
            return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score} قلوب)</div>`;
        }).join("") : "لا توجد نتائج بعد.";
    });
};
// استدعاء الدالة عند تحميل الصفحة
window.addEventListener('load', () => {
    updateBunnyLeaderboardView(); 
});

window.saveBunnyScoreToLeaderboard = function(score) {
    let savedName = window.getCurrentUserName();

    // نستخدم encodeURIComponent لجعل اسم المستخدم "مساراً" آمناً في قاعدة البيانات
    const userKey = encodeURIComponent(savedName);

    // .set() هي المفتاح لحل مشكلة التكرار (تكتب فوق النتيجة القديمة)
    database.ref("leaderboards/bunny/" + userKey).set({
        name: savedName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log("✅ تم تحديث نتيجتك بنجاح دون تكرار!");
    }).catch(err => {
        console.error("خطأ:", err);
        alert("حدث خطأ أثناء الحفظ");
    });
};
function resetMemoryRoom() {
    // تصفير الغرفة لتصبح متاحة للاعبين جدد
    memoryRoomRef.set({
        p1_name: "",
        p2_name: "",
        gameState: "waiting",
        board: []
    });
}
