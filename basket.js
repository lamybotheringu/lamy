// --- Canvas & Core Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BASE_WIDTH = 640, BASE_HEIGHT = 480;
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;
ctx.imageSmoothingEnabled = false;

// --- Dynamic Font Injection ---
if (!document.getElementById('pixelFontLink')) {
  const link = document.createElement('link');
  link.id = 'pixelFontLink';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
  document.head.appendChild(link);
}

// --- DOM Setup & Element Injection ---
const gameOverScreenEl = document.getElementById('gameOverScreen');
let finalScoreLabelEl = document.getElementById('finalScoreLabel') || gameOverScreenEl?.querySelector('p');
if (gameOverScreenEl && finalScoreLabelEl && !finalScoreLabelEl.id) finalScoreLabelEl.id = 'finalScoreLabel';

let finalStatsEl = document.getElementById('finalStats');
if (gameOverScreenEl && !finalStatsEl) {
  finalStatsEl = document.createElement('div');
  finalStatsEl.id = 'finalStats';
  finalStatsEl.style.color = '#ffffff';
  const restartBtn = document.getElementById('restartBtn');
  restartBtn ? gameOverScreenEl.insertBefore(finalStatsEl, restartBtn) : gameOverScreenEl.appendChild(finalStatsEl);
}

const langToggleBtn = document.getElementById('langToggleBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
let fullScreenBtn = document.getElementById('fullScreenBtn');
let bottomRightControls = document.getElementById('bottomRightControls');

// Create bottom-right flex container if it doesn't exist
if (!bottomRightControls && soundToggleBtn && soundToggleBtn.parentNode) {
  bottomRightControls = document.createElement('div');
  bottomRightControls.id = 'bottomRightControls';
  soundToggleBtn.parentNode.appendChild(bottomRightControls);
  bottomRightControls.appendChild(soundToggleBtn);
}

// Create Fullscreen button inside the flex container
if (!fullScreenBtn) {
  fullScreenBtn = document.createElement('button');
  fullScreenBtn.id = 'fullScreenBtn';
  if (bottomRightControls && soundToggleBtn) {
    bottomRightControls.insertBefore(fullScreenBtn, soundToggleBtn);
  } else if (langToggleBtn && langToggleBtn.parentNode) {
    langToggleBtn.parentNode.appendChild(fullScreenBtn);
  }
}

// ==========================================
// --- Fullscreen Controller ---
// ==========================================
fullScreenBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  fullScreenBtn.blur();
  
  const gameContainer = document.getElementById('gameContainer') || canvas.parentElement;
  
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !gameContainer.classList.contains('is-fullscreen-fallback')) {
    if (gameContainer.requestFullscreen) {
      gameContainer.requestFullscreen().catch(() => {
        gameContainer.classList.add('is-fullscreen-fallback');
      });
    } else if (gameContainer.webkitRequestFullscreen) {
      gameContainer.webkitRequestFullscreen();
    } else {
      gameContainer.classList.add('is-fullscreen-fallback');
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    gameContainer.classList.remove('is-fullscreen-fallback');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const gameContainer = document.getElementById('gameContainer') || canvas.parentElement;
    gameContainer?.classList.remove('is-fullscreen-fallback');
  }
});

// --- i18n Translations ---
let currentLang = 'en';
const i18n = {
  en: {
    scoreLabel: "SCORE", targetLabel: "TARGET", apple: "APPLE", carrot: "CARROT",
    soundOn: "🔊 SOUND", soundMuted: "🔇 MUTED", fullScreen: "⛶",
    startTitle: "Lamy's Basket",
    startDesc: "In this game you must catch the fruits in the basket based on the target or you'll lose",
    startSubText: "Good luck!", startBtn: "START GAME",
    gameOverTitle: "GAME OVER!", finalScoreLabel: "FINAL SCORE", restartBtn: "TRY AGAIN", langBtn: "العربية"
  },
  ar: {
    scoreLabel: "النقاط", targetLabel: "الهدف", apple: "تفاحة", carrot: "جزرة",
    soundOn: "🔊 الصوت", soundMuted: "صامت 🔇", fullScreen: "⛶",
    startTitle: "لعبة سلة لايمي",
    startDesc: "في هذه اللعبة يجب إلتقاط الغلال في السلة بناء على الهدف وإلا سوف تخسر",
    startSubText: "حظ موفق!", startBtn: "ابدأ اللعبة",
    gameOverTitle: "انتهت اللعبة!", finalScoreLabel: " النتيجة النهائية", restartBtn: "حاول مجدداً", langBtn: "English"
  }
};

// --- Retro Audio Synthesizer ---
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmTimer = null;
    this.noteIdx = 0;
    this.melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 698.46, 880.00, 1046.50, 880.00, 698.46, 523.25];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCatchSFX() {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playDamageSFX() {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playSwitchSFX() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
  }

  startBGM() {
    this.init();
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = setInterval(() => {
      if (this.muted || !this.ctx || !gameRunning) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = this.melody[this.noteIdx];
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      this.noteIdx = (this.noteIdx + 1) % this.melody.length;
    }, 333);
  }

  stopBGM() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
  }
}

const audio = new RetroAudio();

document.getElementById('soundToggleBtn')?.addEventListener('click', () => {
  audio.muted = !audio.muted;
  document.getElementById('soundToggleBtn').innerText = audio.muted ? i18n[currentLang].soundMuted : i18n[currentLang].soundOn;
});

document.getElementById('langToggleBtn')?.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.documentElement.lang = currentLang;
  applyLanguage();
});

function applyLanguage() {
  const t = i18n[currentLang];
  document.getElementById('scoreLabel').innerText = t.scoreLabel;
  document.getElementById('targetLabel').innerText = t.targetLabel;
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) soundBtn.innerText = audio.muted ? t.soundMuted : t.soundOn;
  if (fullScreenBtn) fullScreenBtn.innerText = t.fullScreen;
  document.getElementById('langToggleBtn').innerText = t.langBtn;
  
  const startTitleEl = document.getElementById('startTitle');
  startTitleEl.innerText = t.startTitle;
  startTitleEl.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

  document.getElementById('startDesc').innerText = t.startDesc;
  document.getElementById('startSubText').innerHTML = t.startSubText;
  document.getElementById('startBtn').innerText = t.startBtn;
  
  const gameOverTitleEl = document.getElementById('gameOverTitle');
  gameOverTitleEl.innerText = t.gameOverTitle;
  gameOverTitleEl.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

  document.getElementById('finalScoreLabel').innerText = t.finalScoreLabel;
  document.getElementById('restartBtn').innerText = t.restartBtn;

  const targetRuleEl = document.getElementById('targetRule');
  targetRuleEl.style.cssText = 'background:transparent;border:none;box-shadow:none;';

  const targetTextEl = document.getElementById('targetText');
  targetTextEl.innerText = t[targetType];

  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const isEn = currentLang === 'en';
  
  startScreen.style.fontFamily = isEn ? "'Press Start 2P', monospace" : '';
  gameOverScreen.style.fontFamily = isEn ? "'Press Start 2P', monospace" : '';
  startScreen.setAttribute('dir', isEn ? 'ltr' : 'rtl');
  gameOverScreen.setAttribute('dir', isEn ? 'ltr' : 'rtl');

  if (gameOverScreen.style.display === 'flex') updateGameOverStats();
}

// --- Asset Loader ---
const assets = {
  bg: Object.assign(new Image(), { src: 'day.png' }),
  player: Object.assign(new Image(), { src: 'minilamy.png' }),
  apple: Object.assign(new Image(), { src: 'apple.png' }),
  carrot: Object.assign(new Image(), { src: 'carrot.png' }),
  heart: Object.assign(new Image(), { src: 'heart.svg' })
};
const isLoaded = img => img.complete && img.naturalWidth !== 0;

// --- Game State & Models ---
let score = 0, lives = 5, targetType = 'apple', frameCount = 0, gameRunning = false, pendingTargetSwitch = false;
let applesCaught = 0, carrotsCaught = 0, items = [];

const player = { width: 118, height: 118, x: BASE_WIDTH / 2 - 59, y: BASE_HEIGHT - 148, speed: 5, dx: 0 };
const keys = { left: false, right: false };

// --- Input Handlers ---
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = true;
});
window.addEventListener('keyup', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
});

let touchTargetX = null;
function handleTouch(e) {
  if (!gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = BASE_WIDTH / rect.width;
  const clientX = e.touches[0].clientX;
  touchTargetX = (clientX - rect.left) * scaleX;
}

canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', () => { touchTargetX = null; });

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// --- Game Logic Classes & Functions ---
class FallingItem {
  constructor() {
    this.type = Math.random() < 0.5 ? 'apple' : 'carrot';
    this.radius = 20;
    
    const minX = 80;
    const maxX = BASE_WIDTH - 80;
    const rawX = Math.random() * (maxX - minX) + minX;
    this.x = Math.round(rawX / 40) * 40;

    this.y = -this.radius;
    this.speed = 2.2 + Math.min(score / 250, 1.2);
  }
  update() { this.y += this.speed; }
  draw() {
    const img = this.type === 'apple' ? assets.apple : assets.carrot;
    if (isLoaded(img)) {
      ctx.drawImage(img, this.x - 20, this.y - 20, 40, 40);
    } else {
      ctx.fillStyle = this.type === 'apple' ? '#ff3333' : '#ff8800';
      ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
    }
  }
}

function isSkyAbovePlayerClear() {
  const pLeft = player.x - 30, pRight = player.x + player.width + 30;
  return !items.some(item => item.x >= pLeft && item.x <= pRight && item.y > 100 && item.y < player.y);
}

function performTargetSwitch() {
  targetType = targetType === 'apple' ? 'carrot' : 'apple';
  const targetRuleEl = document.getElementById('targetRule');
  targetRuleEl.style.cssText = 'background:transparent;border:none;box-shadow:none;';

  const targetTextEl = document.getElementById('targetText');
  const t = i18n[currentLang];
  targetTextEl.innerText = t[targetType];
  targetTextEl.style.color = targetType === 'apple' ? '#ff5555' : '#ffaa00';
  
  targetRuleEl.classList.remove('target-flash');
  void targetRuleEl.offsetWidth;
  targetRuleEl.classList.add('target-flash');

  audio.playSwitchSFX();
  pendingTargetSwitch = false;
}

function startGame() {
  score = 0;
  lives = 5;
  applesCaught = 0;
  carrotsCaught = 0;
  items = [];
  frameCount = 0;
  pendingTargetSwitch = false;
  touchTargetX = null;
  player.x = BASE_WIDTH / 2 - player.width / 2;
  targetType = 'carrot';
  performTargetSwitch();

  audio.startBGM();
  updateUI();

  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function updateUI() {
  const scoreEl = document.getElementById('score');
  scoreEl.innerText = score;

  ['appleCount', 'carrotCount'].forEach((id, idx) => {
    const el = document.getElementById(id);
    el.innerText = `x${idx === 0 ? applesCaught : carrotsCaught}`;
    el.style.cssText = 'font-size:20px;font-weight:bold;';
  });

  document.getElementById('hearts').innerHTML = Array.from({ length: lives }, () => 
    '<img src="heart.svg" alt="heart">'
  ).join('');
}

function takeDamage() {
  lives--;
  audio.playDamageSFX();
  updateUI();
  if (lives <= 0) gameOver();
}

function updateGameOverStats() {
  const finalScoreEl = document.getElementById('finalScore');
  if (finalScoreEl) {
    finalScoreEl.innerText = score;
    finalScoreEl.style.cssText = 'font-size:23px;font-weight:bold;';    
  }

  if (finalScoreLabelEl) {
    finalScoreLabelEl.style.cssText = 'font-size:20px;font-weight:bold;margin-bottom:8px;';
    finalScoreLabelEl.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  }

  if (finalStatsEl) {
    const t = i18n[currentLang];
    finalStatsEl.innerHTML = currentLang === 'ar' 
      ? `<span dir="ltr" style="display:inline-block;">🍎 ${t.apple}: ${applesCaught}</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span dir="ltr" style="display:inline-block;">🥕 ${t.carrot}: ${carrotsCaught}</span>`
      : `🍎 ${t.apple}: ${applesCaught} &nbsp;&nbsp;|&nbsp;&nbsp; 🥕 ${t.carrot}: ${carrotsCaught}`;
    finalStatsEl.style.cssText = `font-size:${currentLang === 'ar' ? '20px' : '16px'};margin:22px 0;font-weight:bold;color:#ffffff;`;
  }
}

function gameOver() {
  gameRunning = false;
  audio.stopBGM();
  updateGameOverStats();
  document.getElementById('gameOverScreen').style.display = 'flex';
}

function gameLoop() {
  if (!gameRunning) return;
  frameCount++;

  if (frameCount % 600 === 0) pendingTargetSwitch = true;
  if (pendingTargetSwitch && isSkyAbovePlayerClear()) performTargetSwitch();

  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  if (isLoaded(assets.bg)) {
    ctx.drawImage(assets.bg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  } else {
    ctx.fillStyle = '#70c5ce'; ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.fillStyle = '#388e3c'; ctx.fillRect(0, BASE_HEIGHT - 35, BASE_WIDTH, 35);
  }

  if (touchTargetX !== null) {
    const centerOffset = player.width / 2;
    const destX = touchTargetX - centerOffset;
    player.x += (destX - player.x) * 0.25;
  } else {
    player.dx = keys.left ? -player.speed : (keys.right ? player.speed : 0);
    player.x += player.dx;
  }
  player.x = Math.max(0, Math.min(BASE_WIDTH - player.width, player.x));

  if (isLoaded(assets.player)) {
    ctx.drawImage(assets.player, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = '#2196F3'; ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  const isTopAreaClear = items.length === 0 || items.every(item => item.y > 140);
  if (isTopAreaClear && (frameCount % 45 === 0)) {
    items.push(new FallingItem());
  }

  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    item.update();
    item.draw();

    if (item.y + item.radius >= player.y + 15 && item.y - item.radius <= player.y + player.height && item.x >= player.x && item.x <= player.x + player.width) {
      if (item.type === targetType) {
        score += 10;
        item.type === 'apple' ? applesCaught++ : carrotsCaught++;
        audio.playCatchSFX();
      } else {
        takeDamage();
      }
      updateUI();
      items.splice(i, 1);
      continue;
    }
    
    if (item.y - item.radius > player.y + player.height) {
      items.splice(i, 1);
    }
  }

  requestAnimationFrame(gameLoop);
}

// --- Initialization ---
document.documentElement.lang = 'en';
applyLanguage();
