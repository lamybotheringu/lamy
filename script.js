// =================================================================
// 🔑 إعدادات Firebase والاتصال الأساسي
// =================================================================

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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const auth = firebase.auth();

// تهيئة المتغيرات العامة في الذاكرة الحية
let score = 0;
let treeWins = 0;
let xoWins = 0;
let memoryWins = 0;
let pendingScore = null;

let activeXOMode = "bot"; 
let activeMemoryMode = "solo"; 
let onlineXOSymbol = ""; 
let myMemoryPlayerSymbol = ""; 

let localLeaderboards = {
    easy: [],
    medium: [],
    hard: []
};

let localMemoryWinsCount = 0;
let temporaryBunnyScore = 0;
let localXOWinsCount = 0;

function safeGetUserName() {
    if (typeof window.getCurrentUserName === 'function') {
        const name = window.getCurrentUserName();
        if (name) return name;
    }
    if (auth.currentUser) {
        return auth.currentUser.displayName || auth.currentUser.email || "Player";
    }
    return null;
}

function show(id) {
    document.querySelectorAll("section").forEach(s => {
        s.classList.add("hidden");
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    checkPendingBunnyScore();
    listenToOnlineChat();
    updateBunnyLeaderboardView();
    updateClickerLeaderboardView();

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadUserTreeWins(user.uid);
        } else {
            const treeCountEl = document.getElementById("treeCount");
            if (treeCountEl) treeCountEl.textContent = "KO count: 0";
        }
    });

    const nameField = document.getElementById("name");
    const savedName = safeGetUserName();
    
    if (savedName && nameField) {
        nameField.value = savedName;
        nameField.readOnly = true;
        nameField.style.opacity = "0.7";
    }
});

function checkPendingBunnyScore() {
    if (auth.currentUser && typeof pendingScore !== 'undefined' && pendingScore) {
        console.log("تم اكتشاف سكور معلق، جاري حفظه...");
        if (typeof window.saveBunnyScoreToLeaderboard === 'function') {
            window.saveBunnyScoreToLeaderboard(parseInt(pendingScore));
        }
        if (typeof pendingScore !== 'undefined') pendingScore = null;
    }
}

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
            let top50 = scores.slice(0, 50);
            let myName = safeGetUserName();

            view.innerHTML = top50.length > 0 ? top50.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let glow = "text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);";
                let style = isMe 
                    ? `color: #FFD700; font-weight: bold; ${glow}` 
                    : `color: #fff;`;
                
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.score || 0} قلوب)</div>`;
            }).join("") : "لا توجد نتائج بعد.";
        });
};

window.saveBunnyScoreToLeaderboard = function(score) {
    let savedName = safeGetUserName();
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

// =================================================================
// 💬 محرك الشات العالمي المباشر (Online Global Chat Room) - مُعدّل
// =================================================================

function addChatMessage(name, msg) {
  const box = document.getElementById("box");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = name + ": " + msg;
  box.prepend(div); // تم التغيير لتعرض الرسالة في الأعلى
}

function listenToOnlineChat() {
  const box = document.getElementById("box");
  if (!box) return;

  // 1. إظهار انيميشن التحميل فوراً
  box.innerHTML = `
    <div class="chat-loader-container">
      <div class="chat-spinner"></div>
      <span>جاري تحميل المحادثة...</span>
    </div>
  `;

  database.ref("global_chat").on("value", (snapshot) => {
    box.innerHTML = ""; 

    if (!snapshot.exists()) {
      box.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">لا توجد رسائل بعد.. كُن أول من يراسل!</div>`;
      return;
    }

    const currentUser = auth.currentUser;

    snapshot.forEach((childSnapshot) => {
      const msgKey = childSnapshot.key;
      const data = childSnapshot.val();
      if (!data) return;

      const div = document.createElement("div");
      div.className = "chat-message";
      
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.width = "100%";
      div.style.boxSizing = "border-box";

      let cleanName = (data.name || "مستخدم").replace(/^!+/, '').trim();

      // استخراج التاريخ والوقت منفصلين
      let dateString = "";
      let timeString = "";
      if (data.timestamp) {
        const msgDate = new Date(data.timestamp);
        
        const year = String(msgDate.getFullYear()).slice(-2);
        const month = String(msgDate.getMonth() + 1).padStart(2, '0');
        const day = String(msgDate.getDate()).padStart(2, '0');
        const hours = String(msgDate.getHours()).padStart(2, '0');
        const minutes = String(msgDate.getMinutes()).padStart(2, '0');

        dateString = `${year}-${month}-${day}`;
        timeString = `${hours}:${minutes}`;
      }

      // 1. التاريخ في أقصى اليمين
      const dateSpan = document.createElement("span");
      dateSpan.textContent = dateString;
      dateSpan.style.fontSize = "0.8em";
      dateSpan.style.color = "#aaa";
      dateSpan.style.whiteSpace = "nowrap";

      // 2. حاوية المنتصف (الاسم + الرسالة)
      const centerContainer = document.createElement("div");
      centerContainer.style.textAlign = "center";
      centerContainer.style.flex = "1";
      centerContainer.style.padding = "0 10px";
      centerContainer.style.unicodeBidi = "isolate";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = cleanName;
      nameSpan.style.fontWeight = "normal"; 
      nameSpan.style.textDecoration = "none"; 
      nameSpan.style.display = "inline-block";
      nameSpan.style.unicodeBidi = "isolate";

      if (data.uid) {
        nameSpan.style.color = "#ff4fd8";
        nameSpan.style.cursor = "pointer";
        nameSpan.onclick = () => {
          if (typeof window.openProfile === 'function') {
            window.openProfile(data.uid);
          } else {
            window.location.href = 'profile.html?uid=' + data.uid;
          }
        };
      } else {
        nameSpan.style.color = "#ffffff";
      }

      const msgSpan = document.createElement("span");
      msgSpan.textContent = " : " + (data.msg || "");
      msgSpan.style.unicodeBidi = "isolate";

      centerContainer.appendChild(nameSpan);
      centerContainer.appendChild(msgSpan);

      // 3. اليسار: الوقت + السلة الحمراء (إن كان المستخدم هو صاحب الرسالة)
      const leftContainer = document.createElement("div");
      leftContainer.style.display = "flex";
      leftContainer.style.alignItems = "center";
      leftContainer.style.gap = "6px";
      leftContainer.style.whiteSpace = "nowrap";

      // أيقونة الحذف (تظهر فقط لصاحب الرسالة)
      if (currentUser && data.uid && currentUser.uid === data.uid) {
        const deleteBtn = document.createElement("span");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.title = "حذف الرسالة";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "0.85em";
        deleteBtn.style.filter = "drop-shadow(0 0 2px rgba(255,0,0,0.5))";
        deleteBtn.onclick = () => {
          if (confirm("هل تريد حذف هذه الرسالة؟")) {
            database.ref("global_chat/" + msgKey).remove();
          }
        };
        leftContainer.appendChild(deleteBtn);
      }

      const timeSpan = document.createElement("span");
      timeSpan.textContent = timeString;
      timeSpan.style.fontSize = "0.8em";
      timeSpan.style.color = "#aaa";

      leftContainer.appendChild(timeSpan);

      // تجميع العناصر
      div.appendChild(dateSpan);
      div.appendChild(centerContainer);
      div.appendChild(leftContainer);

      // إدراج الرسائل الجديدة من الأعلى
      box.prepend(div); 
    });
  });
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

  const senderName = user.displayName || user.email || "مستخدم";
  if (msg === "") { alert("لا يمكنك ترك رسالة فارغة"); return; }

  // التأكد من رفع الـ uid دائماً للحسابات الحديثة
  database.ref("global_chat").push({ 
      uid: user.uid,
      name: senderName, 
      msg: msg,
      timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  
  msgField.value = "";
}


// =================================================================
// ❌ محرك لعبة XO
// =================================================================

let board = ["", "", "", "", "", "", "", "", ""];
let xoGameOver = false;
const winLines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];

window.submitXOHighScore = function() {
    const nameInput = document.getElementById("xoLeaderboardNameInput");
    const chosenName = nameInput ? nameInput.value.trim() : "";
    
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
        document.getElementById("xoSaveNameContainer")?.classList.add("hidden");
        updateXOLeaderboardView();
    });
};

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
            scores.sort((a, b) => (b.wins || 0) - (a.wins || 0));
            let top5 = scores.slice(0, 5);
            let myName = safeGetUserName();

            view.innerHTML = top5.length > 0 ? top5.map((u, i) => {
                let isMe = (myName && u.name === myName);
                let style = isMe ? "color: #FFD700; font-weight: bold;" : "color: #fff;";
                return `<div style="${style} margin-bottom: 5px;">${i + 1}. <b>${u.name}</b> (${u.wins || 0} فوز)</div>`;
            }).join("") : "لا توجد نتائج مسجلة.";
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

function resetXO() {
    board = ["", "", "", "", "", "", "", "", ""];
    xoGameOver = false;
    updateLocalBoard(board); 
    const statusDiv = document.getElementById("xoStatusInfo");
    if (statusDiv) statusDiv.textContent = "الوضع الحالي: اللعب ضد البوت";
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
    const xoWinsEl = document.getElementById("xoWins");
    if (xoWinsEl) xoWinsEl.textContent = "Wins: " + xoWins;
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
  board[i] = "X";
  let winner = checkWinner();
  if (!winner && !board.every(c => c !== "")) {
    smartBotMove();
    winner = checkWinner();
  }
  draw();
  evaluateLocalXOResults(winner);
}

function updateLocalBoard(newBoard) {
    if (newBoard && newBoard.join("") !== board.join("")) {
        board = newBoard;
        draw();
    }
}

// =================================================================
// 🥊 محرك لعبة Punching Clicker (مربوط بالكامل مع الفايربيس)
// =================================================================

function loadUserTreeWins(uid) {
    if (!uid) return;
    database.ref("users/" + uid + "/treeWins").once("value").then((snapshot) => {
        if (snapshot.exists()) {
            treeWins = snapshot.val() || 0;
        } else {
            treeWins = 0;
        }
        const treeCountEl = document.getElementById("treeCount");
        if (treeCountEl) {
            treeCountEl.style.display = "block";
            treeCountEl.textContent = "KO count: " + treeWins;
        }
    });
}

window.saveClickerScore = function(currentScore) {
    let name = safeGetUserName();
    if (!name) return;

    const userKey = encodeURIComponent(name);
    const scoreRef = database.ref("leaderboards/clicker/" + userKey);

    scoreRef.once("value").then((snapshot) => {
        const oldData = snapshot.val();
        const oldScore = oldData ? (oldData.score || 0) : 0;

        if (currentScore > oldScore) {
            scoreRef.set({
                name: name,
                score: currentScore,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
};

function clickMe() {
    score++;
    
    const clickScoreEl = document.getElementById("clickScore");
    if (clickScoreEl) clickScoreEl.textContent = "Score: " + score;

    const fighter = document.getElementById("fighterChar");
    const effect = document.getElementById("punchEffect");

    if (fighter) {
        let fighterStage = "🥊🧍🏾‍♂️";
        if (score >= 100) fighterStage = "💥🛌🏾";
        else if (score >= 70) fighterStage = "🥊🧎🏾‍♂️";
        else if (score >= 30) fighterStage = "🥊🏃🏾‍♂️";
        fighter.textContent = fighterStage;

        fighter.classList.add("punching");
        setTimeout(() => fighter.classList.remove("punching"), 100);
    }

    if (effect) {
        if (score >= 100) {
            effect.textContent = "!!KO";
        } else {
            effect.textContent = "💥 POW!";
        }
        
        // يظهر النص فوراً عند الكبس
        effect.classList.add("show");
    }

    window.saveClickerScore(score);

    if (score === 100) {
        const treeCountEl = document.getElementById("treeCount");
        const treeRetryEl = document.getElementById("treeRetry");
        const treeMsg = document.getElementById("treeMessage");

        if (treeCountEl) treeCountEl.style.display = "block"; 
        if (treeRetryEl) treeRetryEl.style.display = "block"; 
        if (treeMsg) treeMsg.classList.remove("hidden");
        
        treeWins++;
        if (treeCountEl) treeCountEl.textContent = "KO count: " + treeWins;
        
        const user = auth.currentUser;
        if (user) {
            database.ref("users/" + user.uid + "/treeWins").set(treeWins);
        }
    }
}

// إخفاء النص فور توقف الكبس أو رفع الإصبع عن الزر
document.addEventListener("mouseup", () => {
    const effect = document.getElementById("punchEffect");
    if (effect) effect.classList.remove("show");
});

document.addEventListener("touchend", () => {
    const effect = document.getElementById("punchEffect");
    if (effect) effect.classList.remove("show");
});

function retryTree() {
    score = 0;
    const clickScoreEl = document.getElementById("clickScore");
    if (clickScoreEl) clickScoreEl.textContent = "Score: 0";
    
    const fighter = document.getElementById("fighterChar");
    if (fighter) fighter.textContent = "🥊 🧍🏾‍♂️";
    
    const treeMsg = document.getElementById("treeMessage");
    if (treeMsg) treeMsg.classList.add("hidden");
    const treeRetry = document.getElementById("treeRetry");
    if (treeRetry) treeRetry.classList.add("hidden");
}

window.updateClickerLeaderboardView = function() {
    const viewEl = document.getElementById("clickerOnlineLeaderboardView");
    if (!viewEl) return;

    viewEl.innerHTML = "<div style='color:#aaa; text-align:center; font-family: \"Tajawal\", \"Cairo\", Arial, sans-serif;'>⏳ جاري التحميل...</div>";

    database.ref("leaderboards/clicker").on("value", (snapshot) => {
        let scores = [];
        snapshot.forEach(child => {
            let data = child.val();
            if (data && data.name) scores.push(data);
        });
        
        scores.sort((a, b) => (b.score || 0) - (a.score || 0));
        let top15 = scores.slice(0, 15);
        let myName = safeGetUserName();

        viewEl.innerHTML = top15.length > 0 ? top15.map((u, i) => {
            let isMe = (myName && u.name === myName);
            let style = isMe 
                ? "color: #FFD700; font-weight: bold; text-shadow: 0 0 8px rgba(255, 255, 255, 0.6); font-family: 'Tajawal', 'Cairo', Arial, sans-serif;" 
                : "color: #ffffff; font-family: 'Tajawal', 'Cairo', Arial, sans-serif;";
            
            return `<div style="${style} margin-bottom: 5px; text-align: right;">${i + 1}. <b>${u.name}</b> (${u.score || 0} نقطة)</div>`;
        }).join("") : "<div style='color:#aaa; text-align:center; font-family: \"Tajawal\", \"Cairo\", Arial, sans-serif;'>لا توجد نتائج مسجلة.</div>";
    });
};

function openDressupPopup() {
  document.getElementById('dressupModal').classList.remove('hidden');
}

function closeDressupPopup() {
  document.getElementById('dressupModal').classList.add('hidden');
}
