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
  
  // متغير لمتابعة مرحلة السرعة: 0 = بداية، 1 = بعد 15، 2 = بعد 30
  let speedLevel = 0; 

  // القيم الافتراضية للبداية
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

  async function saveHighScore(score) {
    const user = firebase.auth().currentUser;
    if (user) {
      const db = firebase.firestore();
      const userRef = db.collection("users").doc(user.uid);
      try {
        const doc = await userRef.get();
        const currentHigh = doc.exists ? (doc.data().highScore || 0) : 0;
        if (score > currentHigh) {
          await userRef.set({ highScore: score }, { merge: true });
        }
      } catch (e) { console.error("Error saving score: ", e); }
    }
  }

  function startGame() {
    if (running) return;
    
    running = true;
    gameStartedOnce = true;
    heartsCount = 0;
    speedLevel = 0; // إعادة ضبط المستوى
    y = 0;
    velocity = 0;
    
    // قيم البداية
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
    } else if (heartsCount >= 10 && speedLevel < 1) {
      speedLevel = 1;
      gravity = -0.0033;
      jumpPower = 0.80;
      obsSpeed = 0.38;
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
    finalScore.textContent = "القلوب المجمعة : " + heartsCount;
    saveHighScore(heartsCount);
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
