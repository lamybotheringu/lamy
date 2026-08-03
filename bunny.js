window.addEventListener("DOMContentLoaded", () => {
  // --- 1. العناصر والبيانات الأساسية ---
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 400;

  const elements = {
    game: document.getElementById("game"),
    bunny: document.getElementById("bunny"),
    obstacle: document.getElementById("obstacle"),
    heartTemplate: document.getElementById("heartTemplate"),
    score: document.getElementById("score"),
    gameOverUI: document.getElementById("gameOver"),
    finalScore: document.getElementById("finalScore"),
    startScreen: document.getElementById("startScreen"),
    restartBtn: document.getElementById("restartBtn")
  };

  const state = {
    running: false,
    started: false,
    isMuted: false,
    isCustomFullscreen: false,
    heartsCount: 0,
    distanceScore: 0,
    y: 0,
    velocity: 0,
    gravity: -0.0031,
    jumpPower: 0.78,
    baseObsSpeed: 0.31,   // السرعة الأساسية
    baseHeartSpeed: 0.25, // سرعة القلوب الأساسية
    obsSpeed: 0.31,
    heartSpeed: 0.25,
    obsX: 600,
    jumps: 2,
    hearts: [],
    heartTimer: 0,
    lastTime: 0,
    upperPlatformActive: false,
    upperPlatformX: 0,
    platformHearts: [],
    obstacleCountSinceLastPlatform: 0,
    hasTriggeredFirstPlatform: false,
    activeTimeouts: []
  };

  elements.game.style.overflow = "hidden";
  elements.game.style.position = "relative";

  // --- 2. إعداد عناصر الواجهة الديناميكية ---
  const distanceScoreEl = document.createElement("div");
  distanceScoreEl.style.cssText = "position:absolute; top:32px; left:10px; color:#ff4fd8; font-family:'Courier New',monospace; font-size:14px; z-index:10; image-rendering:pixelated;";
  distanceScoreEl.textContent = "Score: 0";
  elements.game.appendChild(distanceScoreEl);

  const controlsContainer = document.createElement("div");
  controlsContainer.style.cssText = "position:absolute; top:10px; right:10px; display:flex; gap:6px; z-index:20;";

  const btnStyle = "background:rgba(30,20,40,0.75); border:1px solid #d8b4fe; color:#fff; padding:5px 8px; font-family:'Courier New',monospace; font-size:14px; cursor:pointer; outline:none; image-rendering:pixelated;";
  
  const muteBtn = createButton("🔊", btnStyle);
  const fullscreenBtn = createButton("⛶", btnStyle);
  controlsContainer.append(fullscreenBtn, muteBtn);
  elements.game.appendChild(controlsContainer);

  const vnBox = document.createElement("div");
  vnBox.style.cssText = "position:absolute; top:15%; left:50%; transform:translateX(-50%); width:80%; max-width:300px; background:rgba(30,20,40,0.75); border:1px solid #d8b4fe; padding:6px 10px; z-index:10; pointer-events:none; opacity:0; transition:opacity 0.5s ease; display:none;";
  const quoteEl = document.createElement("div");
  quoteEl.style.cssText = "color:#fff; font-family:'Courier New',monospace; font-size:12px; text-align:center; word-break:break-word;";
  vnBox.appendChild(quoteEl);
  elements.game.appendChild(vnBox);

  // المنصة العلوية والأشواك
  const upperPlatform = document.createElement("div");
  upperPlatform.style.cssText = "position:absolute; bottom:120px; width:450px; height:18px; border:1px solid #d8b4fe; box-shadow:inset 0 0 0 1px #1e1428; background:repeating-linear-gradient(45deg, rgba(216,180,254,0.25), rgba(216,180,254,0.25) 8px, rgba(30,20,40,0.85) 8px, rgba(30,20,40,0.85) 16px); display:none; z-index:4; image-rendering:pixelated; transform:translateZ(0); will-change:left;";
  elements.game.appendChild(upperPlatform);

  const spikeContainer = document.createElement("div");
  spikeContainer.style.cssText = "position:absolute; bottom:0px; width:450px; height:45px; display:none; z-index:5; pointer-events:none; overflow:hidden; image-rendering:pixelated; transform:translateZ(0); will-change:left;";
  spikeContainer.innerHTML = `<svg width="100%" height="100%"><defs><pattern id="pixelSpikePattern" width="18" height="45" patternUnits="userSpaceOnUse"><polygon points="0,45 9,0 18,45" fill="#252730" stroke="#121318" stroke-width="1.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#pixelSpikePattern)"/></svg>`;
  elements.game.appendChild(spikeContainer);

  function createButton(text, style) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.setAttribute("tabindex", "-1");
    btn.style.cssText = style;
    return btn;
  }

// إنشاء الخلفية السوداء إن لم تكن موجودة
const overlay = document.getElementById("gameOverlay") || Object.assign(document.body.appendChild(document.createElement("div")), {
  id: "gameOverlay", style: "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:none;z-index:2147483646;"
});

// --- 3. Full Screen بسيط بأسطر أقل ---
function updateGameScale() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement) || state.isCustomFullscreen;
  overlay.style.display = isFS ? "block" : "none";
  document.body.style.overflow = isFS ? "hidden" : "";

  if (isFS) {
    const scale = window.innerHeight / BASE_HEIGHT;
    Object.assign(elements.game.style, {
      width: `${window.innerWidth / scale}px`, height: `${BASE_HEIGHT}px`,
      position: "fixed", left: "50%", top: "50%",
      transform: `translate(-50%, -50%) scale(${scale})`,
      margin: "0", border: "none", borderRadius: "0px", boxShadow: "none", zIndex: "2147483647"
    });
  } else {
    Object.assign(elements.game.style, { width: "", height: "", position: "relative", left: "", top: "", transform: "", margin: "", zIndex: "", border: "", borderRadius: "", boxShadow: "" });
  }
}

  window.addEventListener("resize", updateGameScale);
  window.addEventListener("orientationchange", () => setTimeout(updateGameScale, 200));
  document.addEventListener("fullscreenchange", updateGameScale);

  fullscreenBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fullscreenBtn.blur();
    if (!document.fullscreenElement && !state.isCustomFullscreen) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      state.isCustomFullscreen = true;
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      state.isCustomFullscreen = false;
    }
    updateGameScale();
  });

  // --- 4. الصوت والمؤثرات ---
  let audioCtx = null, bgmInterval = null;

  function beep(freq, duration, type = 'sine', vol = 0.03, ignoreMute = false) {
    if (state.isMuted && !ignoreMute) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const audio = {
    jump: () => beep(350, 0.1, 'sine', 0.03, true),
    keyboard: () => beep(state.isMuted ? 400 : 1200, 0.015, state.isMuted ? 'sine' : 'triangle', 0.015, true),
    heart: () => beep(650, 0.05, 'triangle', 0.04),
    gameOver: () => {
      beep(450, 0.15, 'sine', 0.04, true);
      setTimeout(() => beep(350, 0.2, 'sine', 0.04, true), 120);
      setTimeout(() => beep(250, 0.35, 'sine', 0.04, true), 260);
    }
  };

  function startBGM() {
    if (state.isMuted || bgmInterval) return;
    const notes = [220, 261, 329, 392];
    let i = 0;
    bgmInterval = setInterval(() => {
      if (state.running && !state.isMuted) {
        beep(notes[i], 0.4, 'sine', 0.015);
        i = (i + 1) % notes.length;
      }
    }, 700);
  }

  function stopBGM() {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    muteBtn.blur();
    state.isMuted = !state.isMuted;
    muteBtn.textContent = state.isMuted ? "🔇" : "🔊";
    state.isMuted ? stopBGM() : (state.running && startBGM());
  });

  // --- 5. نظام الحِكم والتكست (Quotes Engine) ---
  const quotes = [
  "استمر ولا توقف قفزاتك 🌸",
  "الخطوة الصغيرة تصنع طريقاً طويلاً 🌿",
  "الوقت الممتع لا يُحسب بالساعة ☕",
  "كل سقوط هو مجرد تمهيد للقفزة الأكبر 🐰",
  "كل خطوة للأمام تقربك لحلمك البراق 🌟",
  "صنع السعادة هو فن أتقنته اليوم 🎨",
  "استمتع بالرحلة ولا تستعجل الوصول 🌙"
  ];
  let quoteIndex = 0;

  function clearQuoteTimers() {
    state.activeTimeouts.forEach(clearTimeout);
    state.activeTimeouts = [];
  }

  function scheduleQuote(delay) {
    if (!state.running) return;
    state.activeTimeouts.push(setTimeout(() => {
      if (state.running) showQuote();
    }, delay));
  }

  function showQuote() {
    if (!state.running) return;
    const text = quotes[quoteIndex];
    quoteIndex = (quoteIndex + 1) % quotes.length;

    quoteEl.textContent = "";
    vnBox.style.display = "block";
    state.activeTimeouts.push(setTimeout(() => { if (state.running) vnBox.style.opacity = "1"; }, 10));

    let i = 0;
    function typeNextChar() {
      if (!state.running) return;
      if (i < text.length) {
        quoteEl.textContent += text[i++];
        audio.keyboard();
        state.activeTimeouts.push(setTimeout(typeNextChar, 50));
      } else {
        state.activeTimeouts.push(setTimeout(() => {
          if (!state.running) return;
          vnBox.style.opacity = "0";
          state.activeTimeouts.push(setTimeout(() => {
            if (!state.running) return;
            vnBox.style.display = "none";
            scheduleQuote(9000);
          }, 500));
        }, 3000));
      }
    }
    typeNextChar();
  }

  // --- 6. آليات المنصة العلوية والقلوب ---
  function triggerUpperPlatform() {
    state.upperPlatformActive = true;
    state.upperPlatformX = BASE_WIDTH + 50;
    state.obstacleCountSinceLastPlatform = 0;

    state.platformHearts.forEach(h => h.element.remove());
    state.platformHearts = [];

    upperPlatform.style.left = `${state.upperPlatformX}px`;
    spikeContainer.style.left = `${state.upperPlatformX}px`;
    upperPlatform.style.display = "block";
    spikeContainer.style.display = "block";
    elements.obstacle.style.display = "none";

    [100, 225, 350].forEach(pos => {
      const clone = elements.heartTemplate.cloneNode(true);
      clone.classList.remove("hidden");
      Object.assign(clone.style, { position: "absolute", left: `${pos}px`, bottom: "22px" });
      upperPlatform.appendChild(clone);
      state.platformHearts.push({ element: clone, collected: false });
    });
  }

  function resetUpperPlatform() {
    state.upperPlatformActive = false;
    state.platformHearts.forEach(h => h.element.remove());
    state.platformHearts = [];
    upperPlatform.style.display = "none";
    spikeContainer.style.display = "none";
    elements.obstacle.style.display = "block";
  }

  function isColliding(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  // --- 7. بدء اللعبة والـ Game Loop ---
  function startGame() {
    if (state.running) return;
    
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    startBGM();
    Object.assign(state, {
      running: true, started: true, heartsCount: 0, distanceScore: 0,
      y: 0, velocity: 0, obsSpeed: state.baseObsSpeed, heartSpeed: state.baseHeartSpeed,
      obstacleCountSinceLastPlatform: 0, hasTriggeredFirstPlatform: false,
      obsX: BASE_WIDTH + 100, jumps: 2, lastTime: performance.now(), heartTimer: 0
    });

    quoteIndex = 0;
    clearQuoteTimers();
    vnBox.style.display = "none";
    vnBox.style.opacity = "0";
    scheduleQuote(5000);

    resetUpperPlatform();
    elements.score.textContent = "Hearts: 0";
    distanceScoreEl.textContent = "Score: 0";
    elements.gameOverUI.classList.add("hidden");
    elements.startScreen.classList.add("hidden");

    state.hearts.forEach(h => h.element.remove());
    state.hearts = [];

    requestAnimationFrame(loop);
  }

  function loop(time) {
    if (!state.running) return;
    const dt = time - state.lastTime;
    state.lastTime = time;

    // التسارع يبدأ بعد 1000 سكور وبشكل ناعم جداً
    const extraScore = Math.max(0, state.distanceScore - 1000);
    const speedBonus = extraScore * 0.000025; 

    state.obsSpeed = state.baseObsSpeed + speedBonus;
    state.heartSpeed = state.baseHeartSpeed + (speedBonus * 0.8);

    // تحديث النتيجة
    state.distanceScore += dt * state.obsSpeed * 0.1;
    distanceScoreEl.textContent = `Score: ${Math.floor(state.distanceScore)}`;

    // الحركة والفيزياء
    state.velocity += state.gravity * dt;
    state.y += state.velocity * dt;

    let currentGround = 0;
    if (state.upperPlatformActive) {
      if (50 >= state.upperPlatformX - 20 && 50 <= state.upperPlatformX + 450) {
        if (state.y >= 110 && state.velocity <= 0) currentGround = 120;
      }
    }

    if (state.y > 220) { state.y = 220; state.velocity = 0; }
    if (state.y <= currentGround) { state.y = currentGround; state.velocity = 0; state.jumps = 2; }
    elements.bunny.style.bottom = `${state.y}px`;

    const bunnyBox = elements.bunny.getBoundingClientRect();

    // تحديث حركة المعوقات والمنصات
    if (state.upperPlatformActive) {
      state.upperPlatformX -= state.obsSpeed * dt;
      upperPlatform.style.left = `${state.upperPlatformX}px`;
      spikeContainer.style.left = `${state.upperPlatformX}px`;

      state.platformHearts.forEach(h => {
        if (!h.collected && isColliding(bunnyBox, h.element.getBoundingClientRect())) {
          h.collected = true;
          state.heartsCount++;
          elements.score.textContent = `Hearts: ${state.heartsCount}`;
          audio.heart();
          h.element.style.display = "none";
        }
      });

      if (state.upperPlatformX < -480) {
        resetUpperPlatform();
        state.obsX = BASE_WIDTH + 100;
      }
    } else {
      state.obsX -= state.obsSpeed * dt;
      if (state.obsX < -50) {
        state.obsX = BASE_WIDTH + 100;
        state.obstacleCountSinceLastPlatform++;

        if (!state.hasTriggeredFirstPlatform) {
          if (state.heartsCount >= 15) {
            state.hasTriggeredFirstPlatform = true;
            triggerUpperPlatform();
          }
        } else if (state.heartsCount >= 15 && state.obstacleCountSinceLastPlatform >= 3 && Math.random() < 0.25) {
          triggerUpperPlatform();
        }
      }
      elements.obstacle.style.left = `${state.obsX}px`;

      // توليد القلوب العائمة (تظهر الآن كل 1.2 ثانية 0.8)
      state.heartTimer += dt;
      if (state.heartTimer > 1200) {
        const clone = elements.heartTemplate.cloneNode(true);
        clone.classList.remove("hidden");
        clone.style.position = "absolute";
        elements.game.appendChild(clone);
        state.hearts.push({ element: clone, x: BASE_WIDTH, y: Math.random() * 80 + 30 });
        state.heartTimer = 0;
      }
    }

    // القلوب العائمة
    for (let i = state.hearts.length - 1; i >= 0; i--) {
      const h = state.hearts[i];
      h.x -= state.heartSpeed * dt;
      h.element.style.left = `${h.x}px`;
      h.element.style.bottom = `${h.y}px`;

      if (isColliding(bunnyBox, h.element.getBoundingClientRect())) {
        state.heartsCount++;
        elements.score.textContent = `Hearts: ${state.heartsCount}`;
        audio.heart();
        h.element.remove();
        state.hearts.splice(i, 1);
      } else if (h.x < -50) {
        h.element.remove();
        state.hearts.splice(i, 1);
      }
    }

    // التحقق من التصادم وإعادة الخسارة
    if (state.upperPlatformActive) {
      const spikeBox = spikeContainer.getBoundingClientRect();
      if (!(bunnyBox.right < spikeBox.left || bunnyBox.left > spikeBox.right) && state.y <= 20) {
        gameOver();
        return;
      }
    } else {
      if (isColliding(bunnyBox, elements.obstacle.getBoundingClientRect())) {
        gameOver();
        return;
      }
    }

    requestAnimationFrame(loop);
  }

  function jump() {
    if (!state.running || state.jumps <= 0) return;
    state.velocity = state.jumpPower;
    state.jumps--;
    audio.jump();
  }

  function gameOver() {
    state.running = false;
    stopBGM();
    clearQuoteTimers();
    vnBox.style.opacity = "0";
    vnBox.style.display = "none";
    audio.gameOver();

    elements.gameOverUI.classList.remove("hidden");
    const finalVal = Math.floor(state.distanceScore);

    elements.finalScore.innerHTML = `
      <div style="font-size:22px; color:#fff; font-weight:bold; margin-bottom:10px;">القلوب المجمعة: ${state.heartsCount}</div>
      <div style="font-size:16px; color:#ff4fd8; font-family:'Courier New',monospace; margin-bottom:15px;">Score: ${finalVal}</div>
    `;

    if (typeof database !== 'undefined' && window.getCurrentUserName) {
      const name = window.getCurrentUserName();
      if (name) {
        database.ref(`leaderboards/bunny/${encodeURIComponent(name)}`).once("value", snap => {
          const oldScore = snap.val() ? snap.val().score : 0;
          if (finalVal > oldScore) {
            database.ref(`leaderboards/bunny/${encodeURIComponent(name)}`).set({
              name, score: finalVal, timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => { if (window.updateBunnyLeaderboardView) window.updateBunnyLeaderboardView(); });
          }
        });
      } else {
        elements.finalScore.innerHTML += `<div style="color:#ff4fd8; font-size:14px;">سجل دخولك لحفظ نتيجتك!</div>`;
      }
    }
  }

  // --- 8. إدارة مدخلات المستخدم ---
  const handleInput = (e) => {
    if (controlsContainer.contains(e.target) || e.target.id === "restartBtn") return;
    e.preventDefault();
    if (!state.started || (!state.running && !elements.gameOverUI.classList.contains("hidden"))) startGame();
    else jump();
  };

  elements.game.addEventListener("touchstart", handleInput, { passive: false });
  elements.game.addEventListener("mousedown", handleInput);
  if (elements.restartBtn) elements.restartBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });
  document.addEventListener("keydown", (e) => { if (e.code === "Space") handleInput(e); });
});
