const game = document.getElementById("game");
const bunny = document.getElementById("bunny");
const obstacle = document.getElementById("obstacle");
const heartTemplate = document.getElementById("heartTemplate");

const scoreEl = document.getElementById("score");
const gameOverUI = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let running = false;
let score = 0;

let y = 0;
let velocity = 0;
const gravity = 0.8;
const jumpPower = -12;

let obsX = 600;
let hearts = [];

function startGame(){
  running = true;
  score = 0;
  y = 0;
  velocity = 0;
  obsX = game.clientWidth + 100;

  scoreEl.textContent = "Score: 0";
  gameOverUI.classList.add("hidden");

  loop();
}

function jump(){
  if(!running) return;
  if(y === 0){
    velocity = jumpPower;
  }
}

function spawnHeart(){
  const h = heartTemplate.cloneNode(true);
  h.classList.remove("hidden");

  let x = game.clientWidth + 50;
  let yPos = 60 + Math.random() * 120;

  h.style.left = x + "px";
  h.style.top = yPos + "px";

  game.appendChild(h);

  hearts.push({el:h, x, y:yPos});
}

function collide(a,b){
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function gameOver(){
  running = false;
  gameOverUI.classList.remove("hidden");
  finalScore.textContent = "Score: " + score;
}

function loop(){
  if(!running) return;

  // gravity
  velocity += gravity;
  y += velocity;

  if(y < 0){
    y = 0;
    velocity = 0;
  }

  bunny.style.bottom = y + "px";

  // obstacle movement
  obsX -= 3;
  if(obsX < -100){
    obsX = game.clientWidth + 200;
  }

  obstacle.style.left = obsX + "px";

  // obstacle collision
  const bBox = bunny.getBoundingClientRect();
  const oBox = obstacle.getBoundingClientRect();

  if(collide(bBox, oBox)){
    gameOver();
  }

  // hearts
  hearts.forEach((h,i)=>{
    h.x -= 2;
    h.el.style.left = h.x + "px";

    const hBox = h.el.getBoundingClientRect();

    if(collide(bBox, hBox)){
      score++;
      scoreEl.textContent = "Score: " + score;
      h.el.remove();
      hearts.splice(i,1);
    }
  });

  if(Math.random() < 0.02){
    spawnHeart();
  }

  requestAnimationFrame(loop);
}

// controls
document.addEventListener("keydown",(e)=>{
  if(e.code === "Space"){
    e.preventDefault();
    jump();
  }
});

game.addEventListener("click", jump);

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);