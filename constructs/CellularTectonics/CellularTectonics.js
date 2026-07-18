'use strict'
p5.disableFriendlyErrors = true;
let cells, cellsp, tmp;
let reset;
let num;
let s;
let ns;
let phase;
let ID;
let scale;
let paused;
let rotated;
let w,h;
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  s=1.0;
  restart();
}
function restart(){
rotated=windowWidth<windowHeight;
w=rotated?windowHeight:windowWidth;
h=rotated?windowWidth:windowHeight;
  num=floor(w/s+0.5)
  num=floor(num/2)*2+1
  cells =new Array(num);
  for (let i = 0; i <num; i++) {
    cells[i] = random() < 0.5?false:true;
  }
  cellsp =new Array(num);
  background(0);
  ID=floor(256.0*random());
  paused=false;
  ns=1.6*(random()-0.5);
  phase=0.5*PI*(random()-0.5);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  frameCount=0;
  restart();
}
function mousePressed(){
  paused=!paused; 
  if(!paused) loop();
 }
function draw() {
  translate(windowWidth / 2, windowHeight / 2);
  if (rotated) rotate(-HALF_PI);
  noStroke();
  for (let i = -num/2; i <= num/2; i++) { 
    fill(cells[i+num/2]?255:0);
    rect((i-0.5) * s, -h / 2 +s * (frameCount%(h/s)), s, s);
  }
  update();
  for (let i = -num/2; i <= num/2; i++) {
    fill(0,paused?255:0,cells[i+num/2]?255:0);
    rect((i-0.5) * s, -h / 2 +s * ((frameCount)%(h/s)+2), s, 2*s);
  }
  if(paused && (frameCount%(h/s)===(h/s)-1)){
   noLoop(); 
  }else if(frameCount%((h/s))===(h/s)-1){
    ns=1.2*(random()-0.5);
    phase=0.5*PI*(random()-0.5);
  }
}
function update(){
  scale=1.0-abs(ns)+ns*cos(radians(map(frameCount,0,h,0,180.0))+phase);
  if (testFullOrEmpty()) {
    for (let i = 0; i <num; i++) {
      cells[i] = (random(100) < 5)?!cells[i]:cells[i];
    }
  } else {
    for (let i = 0; i <num; i++) {
      cellsp[i] =(rule((int)((ID+256+(int)(-150+300*noise((i-num/2)*0.004*scale, i*0.0014*cos(radians(0.013*frameCount)),0.0023*cos(radians(0.00063*frameCount)),0.002*scale*cos(radians(0.0037*frameCount)))))%256), i, noise(0.012*i,0.0017*sin(radians(0.0011*frameCount)))<0.5)?0:1);
    }
  }
  swap();
   for (let i = 0; i <num; i++) {
      cells[i] = (random(100) < 0.05)?1.0-cells[i]:cells[i];
    } 
}
function swap() {
  tmp = cells;
  cells = cellsp;
  cellsp = tmp;
}
function rule(ID, i, mirror) {
  let state = cells[(i +num-1)%num] ? (mirror?1:4) : 0;
  state += cells[i] ? 2 : 0;
  state += cells[(i + 1)%num] ? (mirror?4:1) : 0;
  return ((ID >> state) & 1) === 1;
}
function testFullOrEmpty() {
  let count = 0;
  for (let i = 0; i <num; i++) {
    count += (cells[i] ? 1 : 0);
  }
  return (count <0.01*num) || (count > 0.99* num);
}