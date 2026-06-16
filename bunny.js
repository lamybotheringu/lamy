window.addEventListener("DOMContentLoaded", () => {
  const game = document.getElementById("game");
  const bunny = document.getElementById("bunny");
  const obstacle = document.getElementById("obstacle");
  const heartTemplate = document.getElementById("heartTemplate");
  const scoreEl = document.getElementById("score");
  const gameOverUI = document.getElementById("gameOver");
  const finalScore = document.getElementById("finalScore");
  const startScreen = document.getElementById("startScreen");
  const restartBtn = document.getElementById("restartBtn");

  let running = false;
  let gameStartedOnce = false;
  let heartsCount = 0;
  
  let speedLevel = 0; 

  let gravity = -0.0031; 
  let jumpPower = 0.78; 
  let obsSpeed = 0.31;
  let heartSpeed = 0.25;

  let y = 0;
  let velocity = 0;
  const groundLevel = 0;
  let jumpsAvailable = 2;
  let obsX = 600;
  let hearts = [];
  let heartSpawnTimer = 0;
  let lastTime = 0;

function saveHighScore(score) {
    let name = localStorage.getItem("lamyUserName");
    if (!name) return;

    const userKey = encodeURIComponent(name);
    const ref = database.ref("leaderboards/bunny/" + userKey);

    // 1. اقرأ النتيجة الحالية مرة واحدة فقط
    ref.once("value", (snapshot) => {
        const oldData = snapshot.val();
        const oldScore = oldData ? oldData.score : 0;

        // 2. تحديث فقط إذا كان السكور الجديد أكبر
        if (score > oldScore) {
            ref.set({
                name: name,
                score: score,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                console.log("✅ تم تحديث الرقم القياسي!");
                // 3. تحديث الجدول فوراً بعد الحفظ الناجح
                if (window.updateBunnyLeaderboardView) window.updateBunnyLeaderboardView();
            });
        } else {
            console.log("⚠️ النتيجة ليست أعلى من نتيجتك الحالية.");
        }
    });
}

  function startGame() {
    if (running) return;
    
    running = true;
    gameStartedOnce = true;
    heartsCount = 0;
    speedLevel = 0;
    y = 0;
    velocity = 0;
    
   
    gravity = -0.0031; 
    jumpPower = 0.78; 
    obsSpeed = 0.31;
    heartSpeed = 0.25;

    obsX = game.clientWidth + 100;
    jumpsAvailable = 2;
    lastTime = performance.now();
    
    if (scoreEl) scoreEl.textContent = "Hearts: 0";
    gameOverUI.classList.add("hidden");
    if (startScreen) startScreen.classList.add("hidden");
    
    hearts.forEach(h => h.element.remove());
    hearts = [];
    heartSpawnTimer = 0;
    requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    if (!running) return;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // نظام المراحل التراكمي
    if (heartsCount >= 50 && speedLevel < 2) {
      speedLevel = 2;
      gravity = -0.0032; // زيادة بسيطة إضافية
      jumpPower = 0.82;
      obsSpeed = 0.47;
      heartSpeed = 0.40;
    } else if (heartsCount >= 15 && speedLevel < 1) {
      speedLevel = 1;
      gravity = -0.0034;
      jumpPower = 0.79;
      obsSpeed = 0.37;
      heartSpeed = 0.35;
    }

    velocity += gravity * deltaTime;
    y += velocity * deltaTime;
    if (y <= groundLevel) {
      y = groundLevel;
      velocity = 0;
      jumpsAvailable = 2;
    }
    bunny.style.bottom = y + "px";

    obsX -= obsSpeed * deltaTime;
    if (obsX < -50) obsX = game.clientWidth + 100;
    obstacle.style.left = obsX + "px";

    heartSpawnTimer += deltaTime;
    if (heartSpawnTimer > 800) {
      spawnHeart();
      heartSpawnTimer = 0;
    }

    const bBox = bunny.getBoundingClientRect();
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.x -= heartSpeed * deltaTime;
      h.element.style.left = h.x + "px";
      h.element.style.bottom = h.y + "px";

      const hBox = h.element.getBoundingClientRect();
      if (!(bBox.right < hBox.left || bBox.left > hBox.right || bBox.bottom < hBox.top || bBox.top > hBox.bottom)) {
        heartsCount++;
        scoreEl.textContent = "Hearts: " + heartsCount;
        h.element.remove();
        hearts.splice(i, 1);
      } else if (h.x < -50) {
        h.element.remove();
        hearts.splice(i, 1);
      }
    }

    const oBox = obstacle.getBoundingClientRect();
    if (!(bBox.right < oBox.left || bBox.left > oBox.right || bBox.bottom < oBox.top || bBox.top > oBox.bottom)) {
      gameOver();
    } else {
      requestAnimationFrame(loop);
    }
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
    
    finalScore.innerHTML = `
        <div style="font-size: 22px; color: #ffffff; font-weight: bold; margin-bottom: 15px;">
            القلوب المجمعة: ${heartsCount} 
        </div>
    `;

    let savedName = localStorage.getItem("lamyUserName");

    if (savedName && typeof database !== 'undefined') {
        const userKey = encodeURIComponent(savedName);
        const ref = database.ref("leaderboards/bunny/" + userKey);

        // 1. اقرأ النتيجة القديمة للمقارنة
        ref.once("value", (snapshot) => {
            const oldData = snapshot.val();
            const oldScore = oldData ? oldData.score : 0;

            // 2. الحفظ فقط إذا كان السكور الجديد أكبر من القديم (أو إذا كان أول سكور)
            if (heartsCount > oldScore) {
                ref.set({
                    name: savedName,
                    score: heartsCount,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    console.log("✅ تم تحديث الرقم القياسي!");
                    // تحديث الجدول فوراً إذا كانت الدالة معرفة
                    if (window.updateBunnyLeaderboardView) window.updateBunnyLeaderboardView();
                }).catch(err => console.error("خطأ:", err));
            } else {
                console.log("⚠️ النتيجة ليست أعلى، لن يتم التحديث.");
            }
        });
    } else if (!savedName) {
        finalScore.innerHTML += `
            <div style="margin-top: 15px; color: #ff4fd8; font-weight: normal; font-size: 15px;">
                سجل دخولك لحفظ النتيجة 
            </div>
        `;
        localStorage.setItem("pendingBunnyScore", heartsCount);
    }
}


  function spawnHeart() {
    const clone = heartTemplate.cloneNode(true);
    clone.classList.remove("hidden");
    clone.style.position = "absolute";
    game.appendChild(clone);
    hearts.push({ element: clone, x: game.clientWidth, y: Math.random() * 80 + 30 });
  }

  const handleInput = (e) => {
    if (e.target.id === "restartBtn") return;
    e.preventDefault();
    if (!gameStartedOnce) startGame();
    else if (!running && !gameOverUI.classList.contains("hidden")) startGame();
    else jump();
  };

  game.addEventListener("touchstart", handleInput, { passive: false });
  game.addEventListener("mousedown", handleInput);
  if (restartBtn) restartBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });
  document.addEventListener("keydown", (e) => { if (e.code === "Space") handleInput(e); });
});
