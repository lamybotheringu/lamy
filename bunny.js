window.addEventListener("DOMContentLoaded", () => {
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

  function gameOver(){
    running = false;
    gameOverUI.classList.remove("hidden");
    finalScore.textContent = "Score: " + score;
  }

  function loop(){
    if(!running) return;

    velocity += gravity;
    y += velocity;

    if(y < 0){
      y = 0;
      velocity = 0;
    }

    bunny.style.bottom = y + "px";

    obsX -= 3;
    if(obsX < -100){
      obsX = game.clientWidth + 200;
    }

    obstacle.style.left = obsX + "px";

    const bBox = bunny.getBoundingClientRect();
    const oBox = obstacle.getBoundingClientRect();

    if(!(bBox.right < oBox.left || bBox.left > oBox.right || bBox.bottom < oBox.top || bBox.top > oBox.bottom)){
      gameOver();
    }

    requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", (e)=>{
    if(e.code === "Space") jump();
  });

  game.addEventListener("click", jump);
});
