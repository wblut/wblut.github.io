'use strict'
let tracers;
let attractor;
let repulsors;
let MAX_STEER=0.01;
let MAX_VEL=1.0;
let NUM_REPULSORS = 160;
let NUM_TRACERS = 100;
let s;
let da;
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(15);
  smooth();
  noCursor();
  s=Math.min(windowWidth, windowHeight)/1080;
  createAttractor();
   tracers = [];
  randomTracers();
  repulsors = [];
  randomRepulsors();
  da=random(0.0005,0.002)*(random(100)<50?-1:1);
}


function draw(){
  translate(width/2, height/2);
  rotate((frameCount-1)*da);
  scale(s);
  for (let t=0; t<NUM_TRACERS; t++) {

    let steer = new p5.Vector();
    steer.add(attractor.steeringForce(tracers[t]));
    stroke(120, 0, 0, 2);
    for (let i=0; i<NUM_REPULSORS; i++) {
      steer.add(repulsors[i].steeringForce(tracers[t]));
    }
    let ss=steer.mag();
    if (ss > MAX_STEER) steer = steer.mult(MAX_STEER / ss);
    tracers[t].update(steer); 
    stroke(floor(random(120.0)), floor(random(40.0)), floor(random(40.0)), 20);
    let s = random(80.0);
    line(tracers[t].pos.x+s*tracers[t].vel.y, tracers[t].pos.y-s*tracers[t].vel.x, tracers[t].pos.x-s*tracers[t].vel.y, tracers[t].pos.y+s*tracers[t].vel.x);
    noStroke();
    let d=attractor.pos.dist(tracers[t].pos);
    let f=map(d, 0, 50, 0.0, 1.0);
    if (d<=480) {
      fill(255, 100);


      ellipse(tracers[t].pos.x, tracers[t].pos.y, f*4, f*4);
      fill(0);
      ellipse(tracers[t].pos.x, tracers[t].pos.y, f*2, f*2);
    }
    if (tracers[t].pos.mag()<random(tracers[t].age)) tracers[t] = randomTracer();
  }
  translate(0,0,10);
  for(let i=0;i<720;i++){
   noStroke();
   fill(15);
   rect(490,-100,100,100);
   rotate(radians(0.5*i));
  }

}

function randomTracers() {
 
  for (let i=0; i<NUM_TRACERS; i++) {
    tracers[i]=randomTracer();
  }
}

function randomTracer() {
  let angle=random(TWO_PI);
  let pos = new p5.Vector(cos(angle), sin(angle), 0);
  let vel= pos.copy();
  pos.mult(480);
  vel.mult(-MAX_VEL);
  return new Particle3D(pos, vel);
}

function createAttractor(){
  let angle=random(TWO_PI);
  let target = new p5.Vector(0, 0,0);
  attractor = new Attractor(target, 100.0, 1.0);
}

function randomRepulsors() {
  
  for (let i=0; i<NUM_REPULSORS; i++) {
    let angle=random(TWO_PI);

    let pos = new p5.Vector(cos(angle), sin(angle), 0);
    let roll=random(100);
    if (roll<75) {
      pos.mult(400);
      repulsors[i] = new Repulsor(pos, 50, 10);
    } else if (roll<95) {
      pos.mult(200);
      repulsors[i] = new Repulsor(pos, 30, 10);
    } else {
      pos.mult(random(50, 180));
      repulsors[i] = new Repulsor(pos, 20, 10);
    }
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  s=Math.min(windowWidth, windowHeight)/1080;
  background(15);
    tracers.length=0;
  randomTracers();

}

function mousePressed(){
  background(15);
  tracers.length=0;
  randomTracers();
  repulsors.length=0;
  randomRepulsors();
  da=random(0.0005,0.002)*(random(100)<50?-1:1);

}

class Attractor {

  constructor(pos, radius, multiplier) {
    this.pos =pos.copy();
    this.radius = radius;
    this.multiplier=multiplier;
  }

  steeringForce(p) {
    let desired = p5.Vector.sub(this.pos, p.pos);
    let d = desired.mag();
    desired.normalize();
    if (d<this.radius) {
      desired.mult(0.01*this.multiplier*d);
    } else {
      desired.mult(this.multiplier);
    }
    return p5.Vector.sub(desired, p.vel);
  }
}

class Repulsor {
  constructor(pos, radius, multiplier) {
    this.pos = pos.copy();
    this.radius = radius;
    this.multiplier=multiplier;
  }

  steeringForce(p) {
    let repulsed = p5.Vector.sub(p.pos, this.pos);
    let r =repulsed.mag();

    if (r>this.radius) {
      return new p5.Vector();
    } else {
      repulsed.normalize()
        repulsed.mult(this.multiplier*(this.radius-r));
      return p5.Vector.sub(repulsed, p.vel);
    }
  }
}

class Particle3D {
  constructor(pos, vel) {
    this.pos = pos.copy();
    this.vel = vel.copy();
    this.initPos = pos.copy();
    this.initVel = vel.copy();
    this.age=floor(random(300));
  }


  update(force) {
    this.vel.add(force);
    this.pos.add(this.vel);
  }
}
