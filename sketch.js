let astros = []
let lasers = []
let ship;
let pu;

const COUNT_ASTROS = 4;
const MIN_R = 15;
const MAX_R = 40;
const SHIP_R = 15;
const BULLET_SIZE = 4;

let score = 0;
let highScore = 0;
let isGameOver = false;
let time = 0;


// POWER UP
const DURATION_POWER_UP = 10;
const RESPAWN_DELAY_POWER_UP = 5;
const PERSISTENCE_TIME_POWER_UP = 10;
let putimeout = DURATION_POWER_UP;
let puDelay = 0;

let isVisiblePu = false;
let hasPowerUp = false;
let bigBullet = false;
let threeBullet= false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  InitAstros();
  ship = new Ship();
  pu = new PowerUp();
}

function draw() {
  background(25);
  
  // segundos
  Timer();
  
  // -------- POWER UP ---------------------------------
  if(!hasPowerUp && isVisiblePu){
    pu.show();
    pu.update();
    if(pu.hits(ship)){
      hasPowerUp = true;
      
      let rnd = random(-1,1);
      if(rnd > 0){ bigBullet = true; }
      else { threeBullet = true; }
    }
  } else {
    pu.reLocate();
  } 

  //---- ASTROS ------------------------------------------
  for(let i = 0; i < astros.length; i++){
    astros[i].show();
    astros[i].move();
    if(ship.hits(astros[i])){
      isGameOver = true;
    }
  }
  
  if(isGameOver){
    GameOver();
  }

  //------ LASER ------------------------------------------
  for(let i = lasers.length-1; i > -1; i--){
    lasers[i].show();
    lasers[i].update();
    
    // Garbage collector
    if(lasers[i].isOutOfBounds){
      lasers.splice(i,1);
      break;
    }
    
    for(let j = astros.length -1 ; j > -1; j--){
       if(lasers[i].hits(astros[j])){
         if(astros[j].r > MIN_R){
           let pieces = astros[j].breakUp();
           astros.push(...pieces);
         }
         else {
          score += 10;
         }
         astros.splice(j,1) 
         lasers.splice(i,1);
         break;
       }
    }
  }
 
  // ------ SHIP -----------------------------------
  if(!isGameOver){
    ship.show();
    ship.update();
  }
  
  // Respawn
  if(astros.length < floor(COUNT_ASTROS*0.7)){
    let n = floor(random(1,3.5));
    for(i = 0;i < n; i++){
      astros.push(new Astro());
    }
  }
  
  GUI();
}

//===[INPUTS]=========================================
function keyPressed(){
  if(keyCode == RIGHT_ARROW){
    ship.setAngle(0.05);
  }
  else if (keyCode == LEFT_ARROW){
    ship.setAngle(-0.05);
  }
  else if(keyCode === UP_ARROW){
    ship.isBoosting = true;
  }
   else if(keyCode === ENTER && isGameOver){
    Restart();
  }
  else if(key === ' ' && !isGameOver) {
    lasers.push(new Laser(ship.pos,ship.header));
    if(threeBullet){
      lasers.push(new Laser(ship.pos,ship.header - PI/32));
      lasers.push(new Laser(ship.pos,ship.header + PI/32));
    }
  }
}

function keyReleased(){
  ship.setAngle(0);
  ship.isBoosting = false;
}


//====[SHIP]========================================
function Ship(){
  this.pos = createVector(width/2,height/2);
  this.header =0;
  this.angle = 0;
  this.r = SHIP_R;
  this.vel = createVector()
  this.isBoosting = false;
  
  this.show = function(){
    push();
    fill(25);
    stroke(255);   
    strokeWeight(1);
    translate(this.pos.x,this.pos.y);
    rotate(this.header + PI/2);
    triangle(-this.r,this.r,this.r,this.r,0,-this.r);
    if(hasPowerUp){
      let r = this.r * 0.4;
      triangle(-r,r,r,r,0,-r);
    }
    if(this.isBoosting && frameCount % 15 > 2){
      let r = this.r * 0.4;
      ellipse(0,this.r+r*2,r,r*2.5);
    }
    pop();
  }
  
  this.turn = function(){
    this.header += this.angle;
  }
  
  this.setAngle = function(a){
    this.angle = a;
  }
  
  this.boost = function(){
    let f = p5.Vector.fromAngle(this.header);
    f.mult(0.1);
    this.vel.add(f);
  }
  
  this.update = function(){
    this.turn();
    this.bounds();
    
    if(this.isBoosting){
      this.boost();
    }
    this.pos.add(this.vel);
    this.vel.mult(0.98);
  }
  
  this.hits = function(astro){
    let d = dist(this.pos.x,this.pos.y, astro.pos.x,astro.pos.y);
    return d < astro.r + this.r;
  }
  
  this.bounds = function(){
    // X
    if(this.pos.x > this.r + width){
      this.pos.x = -this.r;
    }else if(this.pos.x < -this.r){
      this.pos.x = this.r + width;
    }
    // Y
    if(this.pos.y > this.r + height){
      this.pos.y = -this.r;
    }else if(this.pos.y < -this.r){
      this.pos.y = this.r + height;
    }
  }
}

//====[ASTRO]=========================================
function Astro(pos,r){
  this.r = r ? r : random(MIN_R,MAX_R);
  this.pos = pos ? pos.copy() : createVector(
   RngPos(width,this.r),
   RngPos(height,this.r)
  );
  
  this.vx = random(4,16);
  this.offset = []
  this.vel = p5.Vector.random2D();
  
  for(let i = 0; i < this.vx; i++){
    this.offset[i] = random(-4,10);
  }
  
  this.show = function(){
    push();
    noFill();
    stroke(125);
    translate(this.pos.x,this.pos.y);
    noFill();
    beginShape();
    for(let i = 0; i < this.vx; i++){
      let angle = map(i,0,this.vx,0,TWO_PI);
      let r = this.r + this.offset[i];
      let nx = r * cos(angle);
      let ny = r * sin(angle);
      vertex(nx,ny);
    }
    endShape(CLOSE);
    pop();
    }
  
  this.move = function(){
    this.pos.add(this.vel);
    this.bounds();
  }
  
  this.breakUp = function(){
    let r = random(this.r * 0.4, this.r * 0.6);
    return [
      new Astro(this.pos.mult(1.05),r),
      new Astro(this.pos,this.r - r)
    ];
  }
  
  this.bounds = function(){
    // X
    if(this.pos.x > this.r + width){
      this.pos.x = -this.r;
    }else if(this.pos.x < -this.r){
      this.pos.x = this.r + width;
    }
    // Y
    if(this.pos.y > this.r + height){
      this.pos.y = -this.r;
    }else if(this.pos.y < -this.r){
      this.pos.y = this.r + height;
    }
  }
  
}

//======[LASERS]=================================
function Laser(shipPos, angle){
  this.pos = createVector(shipPos.x,shipPos.y);
  this.vel = p5.Vector.fromAngle(angle)
  this.vel.mult(8);
  this.isOutOfBounds = false;
  
  this.update = function(){
    this.pos.add(this.vel);
    this.CheckBounds();
  }
  this.show = function(){
    push();
    stroke(255);
    let r = BULLET_SIZE;
    if(bigBullet){ r = 10; }
    
    strokeWeight(r);
    point(this.pos.x,this.pos.y);
    pop();
  }
  
  this.hits = function(astro){
    let d = dist(this.pos.x,this.pos.y, astro.pos.x,astro.pos.y);
    return d <  astro.r + 5;
  }
  
  this.CheckBounds = function(){
    // X
    if(this.pos.x > width || this.pos.x < 0){
      this.isOutOfBounds = true;
    }
    // Y
    if(this.pos.y > this.r + height || this.pos.y < 0){
       this.isOutOfBounds = true;
    }
  }
}

//====[POWER UP]========================================
function PowerUp(){
  this.r = 5;
  this.duration = 10;
  this.a = 0.1;
  this.pos = createVector(
    random(4,width-this.r),
    random(4,height-this.r)
  );
  
  this.show = function(){ 
    push();
    noStroke();
    fill(255);
    rectMode(CENTER);
    translate(this.pos.x,this.pos.y)
    rotate(this.a);
    rect(0,0,this.r*2,this.r*2);
    pop();
  }
  
  this.reLocate = function(){
    this.pos = createVector(
    random(4,width-this.r),
    random(4,height-this.r)
  );
  }
  
  this.update = function(){
    this.a += 0.02;
  }
  
  this.hits = function(ship){
    let d = dist(this.pos.x,this.pos.y, ship.pos.x,ship.pos.y);
    return d <  ship.r * 2;
  }
  
}


//====[INITIALIZATION]=========================
function Restart(){
    if(score > highScore){
          highScore = score;
    }
    score = 0;
    ship.pos = createVector(width/2, height/2);
    isGameOver = false;
    astros = [];
    InitAstros();
  }

function InitAstros(){
  for(let i = 0; i < COUNT_ASTROS; i++){
    let r = random(MIN_R,40);
    astros[i] = new Astro();
  }
}


//======[GAME OVER]=======================================
function GameOver(){
  push();
        textSize(32);
        fill(225);
        stroke(25);
        strokeWeight(5);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text("¡GAME OVER!",width/2,height/2);
      pop();
    
    if(frameCount % 100 < 50){
     push();
        textSize(18)
        fill(160);
        stroke(25);
        strokeWeight(8);
        textStyle(ITALIC);
        textAlign(CENTER, CENTER);
        text("Press ENTER to start",width/2,height/2 + 35);
      pop();
      }
  InitPowerUp();
}

function GUI(){
  push();
    let offset = 20;
    let hs = "High Score: " + nf(highScore,4);
    let shootText ="Press Space Bar to shoot";
    textSize(18);
    fill(225);
    stroke(25);
    strokeWeight(8);
    text("Score: " + nf(score,4), offset,30);
    text(hs,width-textWidth(hs) - offset,30);
    fill(60);
    text("Time (sec): " + nf(time,4),20,height-10);
    text(shootText, (width - textWidth(shootText))/2,height-10 )
  pop();
}

function RngPos(mx,mi){
  let pos = [
    random(mi,mx/4),
    random(3*mx/4,mx-mi)
  ];
  return pos[floor(random(0,1.9))];
}

function InitPowerUp(){
  hasPowerUp = false;
  bigBullet = false;
  threeBullet = false;
  puDelay = 0;
  putimeout = DURATION_POWER_UP;
  isVisiblePu = 0;
}


function Timer(){
  if(frameCount % 60 === 0){
    time += 1;
    
    // POWER UP
    if(hasPowerUp){ 
      putimeout -= 1;
      if(putimeout === 0){ InitPowerUp(); }
    } 
    else {
      puDelay += 1;
      let hiddePu = puDelay >= RESPAWN_DELAY_POWER_UP + PERSISTENCE_TIME_POWER_UP;
      if(hiddePu){ puDelay = 0; }
      isVisiblePu = puDelay >= RESPAWN_DELAY_POWER_UP
    }   
  }
}
