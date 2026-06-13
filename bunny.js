// متغير عالمي لحفظ السكور للفايربيز
let temporaryBunnyScore = 0;

window.addEventListener("DOMContentLoaded", () => {
  const game = document.getElementById("game");
  const bunny = document.getElementById("bunny");
  const obstacle = document.getElementById("obstacle");
  const heartTemplate = document.getElementById("heartTemplate");

  // UI tracking elements
  const scoreEl = document.getElementById("score");
  const gameOverUI = document.getElementById("gameOver");
  const finalScore = document.getElementById("finalScore");
  
  const startScreen = document.getElementById("startScreen") || document.getElementById("startUI") || document.getElementById("startMenu");

  const restartBtn = document.getElementById("restartBtn");

  let running = false;
  let gameStartedOnce = false; // Tracks if the initial start screen is gone
  let heartsCount = 0; // Tracks collected hearts

  // --- SLOWER / FLOATIER PHYSICS VARIABLES ---
  let y = 0;
  let velocity = 0;
  const gravity = -0.32;     // Bunny falls slower
  const jumpPower = 7.8;     // Bunny launches upward slower
  const groundLevel = 0;

  // --- DOUBLE JUMP CAPACITY ---
  let jumpsAvailable = 2;    

  let obsX = 600;

  // Heart/Collectible tracking
  let hearts = [];
  let heartSpawnTimer = 0;

  // FORCE WINDOW FOCUS: Ensures the browser registers space key immediately on load
  window.focus();

  function startGame() {
    if (running) return; 
    
    running = true;
    gameStartedOnce = true;
    heartsCount = 0;
    y = groundLevel;
    velocity = 0;
    obsX = game.clientWidth + 100;
    jumpsAvailable = 2; 

    // Sync screen updates
    if (scoreEl) scoreEl.textContent = "Hearts: 0";
    
    gameOverUI.classList.add("hidden");
    
    // إخفاء صندوق حفظ الاسم عند البدء من جديد
    const saveContainer = document.getElementById("bunnySaveNameContainer");
    if (saveContainer) saveContainer.classList.add("hidden");

    if (startScreen) {
      startScreen.classList.add("hidden");
    }

    // Clean up old hearts from previous rounds
    hearts.forEach(h => h.element.remove());
    hearts = [];
    heartSpawnTimer = 0;

    bunny.style.bottom = y + "px";
    
    // Grounded obstacle configuration
    obstacle.style.bottom = "0px"; 
    obstacle.style.left = obsX + "px";

    loop();
  }

  function jump() {
    if (!running) return;
    
    if (jumpsAvailable > 0) {
      velocity = jumpPower;
      jumpsAvailable--; 
    }
  }

function gameOver() {
    running = false;
    gameOverUI.classList.remove("hidden");
    finalScore.textContent = "القلوب المجمعة : " + heartsCount;

    // تحديث السكور المؤقت
    temporaryBunnyScore = heartsCount;

    // إظهار واجهة حفظ الاسم إذا جمعتِ قلوباً
    if (heartsCount > 0) {
      document.getElementById("bunnySaveNameContainer").classList.remove("hidden");
    }
  }

  function spawnHeart() {
    if (!heartTemplate) return;
    const clone = heartTemplate.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.remove("hidden");
    clone.style.display = "block"; 
    game.appendChild(clone);

    // Random spotted heights accessible by the slower jump settings
    const randomHeight = Math.floor(Math.random() * 100) + 30;

    hearts.push({
      element: clone,
      x: game.clientWidth + 50,
      y: randomHeight 
    });
  }

  function loop() {
    if (!running) return; 

    // --- 1. BUNNY PHYSICS ---
    velocity += gravity;
    y += velocity;

    if (y <= groundLevel) {
      y = groundLevel;
      velocity = 0;
      jumpsAvailable = 2; // Reset double-jump on landing
    }
    bunny.style.bottom = y + "px";

    // --- 2. OBSTACLE MOVEMENT ---
    obsX -= 2.5; 
    if (obsX < -50) {
      obsX = game.clientWidth + Math.random() * 300 + 100; 
    }
    obstacle.style.left = obsX + "px";

    // --- 3. HEART COIN MECHANIC ---
    heartSpawnTimer++;
    if (heartSpawnTimer > 120) { 
      spawnHeart();
      heartSpawnTimer = 0;
    }

    const bBox = bunny.getBoundingClientRect();

    for (let i = hearts.length - 1; i >= 0; i--) {
      const heart = hearts[i];
      heart.x -= 2.2; 
      heart.element.style.left = heart.x + "px";
      heart.element.style.bottom = heart.y + "px";

      const hBox = heart.element.getBoundingClientRect();

      // Check collision with floating heart item
      if (!(bBox.right < hBox.left || bBox.left > hBox.right || bBox.bottom < hBox.top || bBox.top > hBox.bottom)) {
        heartsCount++; 
        if (scoreEl) {
          scoreEl.textContent = "Hearts: " + heartsCount;
        }
        heart.element.remove();
        hearts.splice(i, 1);
        continue;
      }

      if (heart.x < -50) {
        heart.element.remove();
        hearts.splice(i, 1);
      }
    }

    // --- 4. OBSTACLE COLLISION DETECTION ---
    const oBox = obstacle.getBoundingClientRect();
    if (!(bBox.right < oBox.left || bBox.left > oBox.right || bBox.bottom < oBox.top || bBox.top > oBox.bottom)) {
      gameOver();
      return; 
    }

    requestAnimationFrame(loop);
  }

  // Event Listeners
  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Stops event bubbling triggers
      startGame();
    });
  }

  // MASTER KEYBOARD LISTENER (Handles Start, Jump, and Restart)
  document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return; // تجاهل إذا كان يكتب اسمه

    if (e.code === "Space") {
      e.preventDefault(); 
      
      if (!gameStartedOnce) {
        startGame(); // Press Space to Start (First run)
      } else if (!running && !gameOverUI.classList.contains("hidden")) {
        startGame(); // Press Space to Restart (Game Over screen)
      } else {
        jump(); // Press Space to Jump (While running)
      }
    }
  });

  // SCREEN INTERACTION FALLBACKS
  game.addEventListener("click", (e) => {
    if (e.target.id === "restartBtn" || e.target.closest("#gameOver")) return;
    if (!gameStartedOnce) {
      startGame();
    } else {
      jump();
    }
  });

  if (startScreen) {
    startScreen.addEventListener("click", () => {
      if (!gameStartedOnce) startGame();
    });
  }

  // تشغيل الاستماع للفايربيز فوراً عند تحميل الصفحة
  if (typeof listenToBunnyLeaderboard === "function") {
    listenToBunnyLeaderboard();
  }
});

// =================================================================
// 🏆 وظائف الفايربيز (خارج نطاق الـ DOMContentLoaded لتعمل مع أزرار الـ HTML)
// =================================================================

function checkBunnyLeaderboardEligibility(scoreToCheck) {
  if (typeof database === "undefined") return;
  database.ref("bunny_leaderboard").once("value", (snapshot) => {
    let records = [];
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        records.push(child.val());
      });
    }
    if (records.length < 5 || scoreToCheck > Math.min(...records.map(r => r.score))) {
      const saveContainer = document.getElementById("bunnySaveNameContainer");
      if (saveContainer) saveContainer.classList.remove("hidden");
    }
  });
}

function submitBunnyHighScore() {
  const nameInput = document.getElementById("bunnyLeaderboardNameInput");
  if (!nameInput || typeof database === "undefined") return;

  const chosenName = nameInput.value.trim();
  if (!chosenName) {
    alert("أدخلي اسمكِ أولاً لتسجيل السكور! 🩷");
    return;
  }

  database.ref("bunny_leaderboard").push({
    name: chosenName,
    score: temporaryBunnyScore
  }).then(() => {
    const saveContainer = document.getElementById("bunnySaveNameContainer");
    if (saveContainer) saveContainer.classList.add("hidden");
    nameInput.value = "";
  }).catch(err => console.error("حدث خطأ في الفايربيز:", err));
}

function listenToBunnyLeaderboard() {
  if (typeof database === "undefined") return;
  database.ref("bunny_leaderboard").orderByChild("score").limitToLast(5).on("value", (snapshot) => {
    const view = document.getElementById("bunnyLeaderboardView");
    if (!view) return;

    let leaderboardList = [];
    snapshot.forEach((childSnapshot) => {
      leaderboardList.push(childSnapshot.val());
    });

    leaderboardList.sort((a, b) => b.score - a.score);

    if (leaderboardList.length === 0) {
      view.textContent = "لا توجد نتائج مسجلة في هذه اللعبة بعد.";
      return;
    }

    view.innerHTML = leaderboardList.map((player, index) => {
      return `${index + 1}. <b>${player.name}</b>: ${player.score} قلب 🩷<br>`;
    }).join("");
  });
}
