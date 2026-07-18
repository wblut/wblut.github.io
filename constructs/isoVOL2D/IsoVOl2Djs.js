//Find all triangles between two isolevel contours for a grid of values
//https://www.goodreads.com/book/show/16195572-isosurfaces

let isotriangles,isotriangles2,isotriangles3;//triangles between two isolevel contours
let resx, resy;//resolution of grid
let cx, cy;//center of grid
let dx, dy;//size of grid cell
let zFactor;//(grid values) x zFactor = height of triangle vertices


function setup() {
  createCanvas(windowWidth, windowHeight,WEBGL);
  
  initialize();
 }

function initialize(){
  resx=32;
  resy=32;  
  cx=0;
  cy=0;
  dx=min(windowWidth,windowHeight)/48;
  dy=dx;
  zFactor=400.0;

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initialize();
}

//This function returns the values of (resX+1)x(resY+1) data points
function getValue(i, j) {
  return 1.5-3.0*noise(0.025*i, 0.025*j,0.005*frameCount) ;
}

function draw() {
  background(255);
  lights();
  rotateY(map(mouseX, 0, windowWidth, -PI, PI));
  rotateX(map(mouseY, 0, windowHeight, PI, -PI));
  isotriangles2=getTriangles((frameCount%200)*0.01-0.85, 2.0, color(255));
  isotriangles3=getTriangles(-2,(frameCount%200)*0.01-1.0, color(255));
  isotriangles2.forEach (triangle => {
    triangle.drawStroke();
  });
  
  isotriangles3.forEach (triangle => {
    triangle.drawStroke();
  });
  noStroke();
  isotriangles=getTriangles((frameCount%200)*0.01-.98,(frameCount%200)*0.01-0.87, color(255,0,0));
  isotriangles.forEach (triangle => {
    triangle.drawFill();
  });


   
  
}


let ONVERTEX = 0;
let ONEDGE = 1;
let NEGATIVE = 0;
let EQUAL = 1;
let POSITIVE = 2;
let digits;
let gridvertices=[[0, 0], [1, 0], [0, 1], [1, 1]];
let edges = [ [ 0, 1 ],  [ 0, 2 ], [ 1, 3 ]];
let isovertices = [ [ 1, 0, 0 ], [ 1, 0, 1 ], [ 1, 1, 0 ], [ 1, 1, 1 ], [ 1, 2, 0 ],
      [ 1, 2, 1 ], [ 1, 3, 0 ], [ 1, 3, 1 ], [ 0, 0 ], [ 0, 1 ], [ 0, 2 ], [ 0, 3 ] ];
let entries=
  [[0], 
  [1, 0, 2, 8], 
  [2, 1, 0, 2, 3, 1, 2], 
  [1, 0, 9, 4], 
  [2, 4, 2, 8, 9, 4, 8], 
  [3, 1, 4, 3, 9, 4, 1, 4, 2, 3], 
  [2, 1, 4, 0, 5, 4, 1], 
  [3, 1, 5, 2, 8, 1, 2, 4, 2, 5], 
  [2, 4, 3, 5, 4, 2, 3], 
  [1, 2, 6, 10], 
  [2, 6, 8, 0, 10, 8, 6], 
  [3, 6, 3, 1, 10, 3, 6, 6, 1, 0], 
  [4, 6, 9, 4, 10, 9, 6, 10, 2, 9, 2, 0, 9], 
  [3, 4, 6, 9, 9, 6, 10, 9, 10, 8], 
  [4, 4, 6, 1, 9, 4, 1, 1, 6, 3, 6, 10, 3], 
  [5, 6, 5, 4, 10, 5, 6, 10, 1, 5, 10, 2, 1, 2, 0, 1], 
  [4, 8, 1, 10, 1, 5, 10, 4, 6, 5, 6, 10, 5], 
  [3, 4, 6, 5, 10, 3, 5, 6, 10, 5], 
  [2, 3, 2, 6, 7, 3, 6], 
  [3, 3, 0, 7, 8, 0, 3, 6, 7, 0], 
  [2, 6, 7, 1, 6, 1, 0], 
  [5, 6, 7, 4, 9, 7, 3, 4, 7, 9, 9, 3, 0, 2, 0, 3], 
  [4, 9, 3, 8, 9, 7, 3, 9, 4, 7, 4, 6, 7], 
  [3, 4, 6, 7, 9, 4, 7, 1, 9, 7], 
  [4, 6, 7, 5, 6, 5, 4, 2, 1, 3, 2, 0, 1], 
  [3, 8, 1, 3, 5, 4, 6, 7, 5, 6], 
  [2, 4, 6, 5, 5, 6, 7], 
  [1, 4, 11, 6], 
  [4, 6, 2, 8, 11, 6, 8, 11, 8, 4, 4, 8, 0], 
  [5, 6, 2, 3, 11, 6, 3, 11, 3, 1, 11, 1, 4, 4, 1, 0], 
  [2, 6, 0, 9, 11, 6, 9], 
  [3, 2, 8, 6, 6, 8, 11, 9, 11, 8], 
  [4, 2, 3, 6, 1, 11, 3, 9, 11, 1, 6, 3, 11], 
  [3, 6, 1, 5, 11, 6, 5, 6, 0, 1], 
  [4, 2, 1, 6, 8, 1, 2, 1, 5, 6, 6, 5, 11], 
  [3, 2, 3, 6, 5, 11, 3, 6, 3, 11], 
  [2, 4, 10, 2, 11, 10, 4], 
  [3, 0, 4, 8, 4, 11, 8, 10, 8, 11], 
  [4, 0, 4, 1, 1, 11, 3, 4, 11, 1, 10, 3, 11], 
  [3, 2, 0, 9, 10, 2, 9, 10, 9, 11], 
  [2, 9, 11, 10, 9, 10, 8], 
  [3, 9, 11, 1, 1, 11, 3, 11, 10, 3], 
  [4, 2, 0, 1, 10, 2, 1, 10, 1, 5, 10, 5, 11], 
  [3, 8, 1, 10, 1, 5, 10, 11, 10, 5], 
  [2, 5, 10, 3, 5, 11, 10], 
  [3, 4, 7, 3, 11, 7, 4, 4, 3, 2], 
  [4, 0, 4, 3, 8, 0, 3, 3, 4, 7, 4, 11, 7], 
  [3, 0, 4, 1, 7, 1, 11, 4, 11, 1], 
  [4, 0, 9, 3, 2, 0, 3, 3, 9, 7, 9, 11, 7], 
  [3, 9, 3, 8, 9, 7, 3, 9, 11, 7], 
  [2, 11, 7, 9, 9, 7, 1], 
  [3, 2, 0, 1, 2, 1, 3, 7, 5, 11], 
  [2, 11, 7, 5, 8, 1, 3], 
  [1, 5, 11, 7], 
  [2, 5, 6, 4, 7, 6, 5], 
  [5, 6, 2, 7, 8, 5, 7, 2, 8, 7, 8, 0, 5, 4, 5, 0], 
  [4, 6, 3, 7, 6, 2, 3, 4, 5, 1, 4, 1, 0], 
  [3, 5, 7, 0, 9, 5, 0, 6, 0, 7], 
  [4, 2, 7, 6, 8, 7, 2, 5, 7, 8, 9, 5, 8], 
  [3, 9, 5, 1, 3, 6, 2, 7, 6, 3], 
  [2, 6, 1, 7, 6, 0, 1], 
  [3, 2, 7, 6, 8, 7, 2, 1, 7, 8], 
  [2, 7, 6, 3, 3, 6, 2], 
  [3, 4, 5, 2, 5, 7, 2, 10, 2, 7], 
  [4, 0, 4, 5, 8, 0, 5, 8, 5, 7, 10, 8, 7], 
  [3, 10, 3, 7, 1, 0, 4, 5, 1, 4], 
  [4, 0, 9, 5, 2, 0, 5, 2, 5, 7, 10, 2, 7], 
  [3, 8, 7, 10, 5, 7, 8, 9, 5, 8], 
  [2, 9, 5, 1, 7, 10, 3], 
  [3, 2, 0, 1, 10, 2, 1, 10, 1, 7], 
  [2, 7, 8, 1, 7, 10, 8], 
  [1, 7, 10, 3], 
  [2, 4, 5, 3, 4, 3, 2], 
  [3, 0, 4, 5, 8, 0, 5, 3, 8, 5], 
  [2, 5, 1, 4, 1, 0, 4], 
  [3, 0, 9, 3, 2, 0, 3, 9, 5, 3], 
  [2, 8, 5, 3, 9, 5, 8], 
  [1, 9, 5, 1], 
  [2, 2, 0, 1, 2, 1, 3], 
  [1, 8, 1, 3], 
  [0]];

class Triangle {
  constructor(p1, p2, p3, col) {
    this.p1=new p5.Vector(p1.x, p1.y, p1.z);
    this.p2=new p5.Vector(p2.x, p2.y, p2.z);
    this.p3=new p5.Vector(p3.x, p3.y, p3.z);
    this.col=col;
  }

  drawStroke() {
    push();
    noFill();
    stroke(0);
    beginShape();
    vertex(this.p1.x, this.p1.y, this.p1.z);  
    vertex(this.p2.x, this.p2.y, this.p2.z); 
    vertex(this.p3.x, this.p3.y, this.p3.z);
    endShape(CLOSE);
    pop();
  }
  
  drawFill() {
    push();
    fill(this.col);
    noStroke();
    beginShape();
    vertex(this.p1.x, this.p1.y, this.p1.z);  
    vertex(this.p2.x, this.p2.y, this.p2.z); 
    vertex(this.p3.x, this.p3.y, this.p3.z);
    endShape(CLOSE);
    pop();
  }
}

let xedges;
let yedges;
let vertices;
let isolevelmin;
let isolevelmax;
let triangles;

function index(i,j) {
  return i+1 +(resx+2)*(j+1);
}



function isovertex(i,j,offset) {
  let idx=index(i,j);
  if (vertices.has(idx)) {
    return vertices.get(idx);
  }
  let vertex = new p5.Vector(i * dx+offset.x, j * dy+offset.y, zFactor * getValue(i, j)+offset.z);
  vertices.set(idx, vertex);
  return vertex;
}

function interp(isolevel, p1, p2, valp1, 
  valp2, offset) {
  if (isolevel===valp1) {
    return new p5.Vector(p1.x +offset.x, p1.y+offset.y, zFactor * isolevel);
  }
  if (isolevel===valp2) {
    return new p5.Vector(p2.x+offset.x, p2.y+offset.y, zFactor * isolevel);
  }
  if (valp1===valp2) {
    return new p5.Vector(p1.x+offset.x, p1.y+offset.y, zFactor * isolevel);
  }
  let mu = (isolevel - valp1) / (valp2 - valp1);
  return new p5.Vector(p1.x + mu * (p2.x - p1.x)+offset.x, p1.y + mu * (p2.y - p1.y)+offset.y, zFactor * isolevel);
}

function xedge(i, j, offset, isolevel) {
  let idx=index(i,j);
  if (xedges.has(idx)) {
    return xedges.get(idx);
  }
  let p0 = new p5.Vector(i * dx, j * dy, 0);
  let p1 = new p5.Vector(i * dx + dx, j * dy, 0);
  let val0 = getValue(i, j);
  let val1 = getValue(i + 1, j);
  let xedge = interp(isolevel, p0, p1, val0, val1, offset);
  xedges.set(idx, xedge);
  return xedge;
}

function yedge(i, j, offset, isolevel) {
  let idx=index(i,j);
  if (yedges.has(idx)) {
    return yedges.get(idx);
  }
  let p0 = new p5.Vector(i * dx, j * dy, 0);
  let p1 = new p5.Vector(i * dx, j * dy + dy, 0);
  let val0 = getValue(i, j);
  let val1 = getValue(i, j + 1);
  let yedge =interp(isolevel, p0, p1, val0, val1, offset);
  yedges.set(idx, yedge);
  return yedge;
}

function classifyCell(i, j) {
  if (i < 0 || j < 0 || i >= resx || j >= resy) {
    return -1;
  }
  digits = [];
  let cubeindex = 0;
  let offset = 1;
  if (getValue(i, j) > isolevelmax) {
    cubeindex += 2 * offset;
    digits[0] = POSITIVE;
  } else if (getValue(i, j) >= isolevelmin) {
    cubeindex += offset;
    digits[0] = EQUAL;
  }
  offset *= 3;
  if (getValue(i + 1, j) > isolevelmax) {
    cubeindex += 2 * offset;
    digits[1] = POSITIVE;
  } else if (getValue(i + 1, j) >= isolevelmin) {
    cubeindex += offset;
    digits[1] = EQUAL;
  }
  offset *= 3;
  if (getValue(i, j + 1) > isolevelmax) {
    cubeindex += 2 * offset;
    digits[2] = POSITIVE;
  } else if (getValue(i, j + 1) >= isolevelmin) {
    cubeindex += offset;
    digits[2] = EQUAL;
  }
  offset *= 3;
  if (getValue(i + 1, j + 1) > isolevelmax) {
    cubeindex += 2 * offset;
    digits[3] = POSITIVE;
  } else if (getValue(i + 1, j + 1) >= isolevelmin) {
    cubeindex += offset;
    digits[3] = EQUAL;
  }
  return cubeindex;
}

function getTriangles(isomin, isomax, col) {
  
  isolevelmin=isomin;
  isolevelmax=isomax;
  xedges = new Map();
  yedges = new Map();
  vertices = new Map();
  let offset = new p5.Vector(cx - 0.5 * resx * dx, cy - 0.5 * resy * dy, 0);
  triangles = [];
  for (let i = 0; i < resx; i++) {
    for (let j = 0; j < resy; j++) {
      triangulate(i, j, classifyCell(i, j), offset, col);
    }
  }
  return triangles;
}

function triangulate(i, j, cubeindex, offset, col) {
  let indices = entries[cubeindex];
  let numtris = indices[0];
  let currentindex = 1;
  for (let t = 0; t < numtris; t++) {
    let v2 = getIsoVertex(indices[currentindex++], i, j, offset);
    let v1 = getIsoVertex(indices[currentindex++], i, j, offset);
    let v3 = getIsoVertex(indices[currentindex++], i, j, offset);
    triangles.push(new Triangle(v1, v2, v3,col));
  }
 
}

function getIsoVertex(isopointindex, i, j, offset) {
  if (isovertices[isopointindex][0] == ONVERTEX) {
    switch (isovertices[isopointindex][1]) {
    case 0:
      return isovertex(i, j, offset);
    case 1:
      return isovertex(i + 1, j, offset);
    case 2:
      return isovertex(i, j + 1, offset);
    case 3:
      return isovertex(i + 1, j + 1, offset);
    default:
      return null;
    }
  } else if (isovertices[isopointindex][0] == ONEDGE) {
    if (isovertices[isopointindex][2] == 0) {
      switch (isovertices[isopointindex][1]) {
      case 0:
        return xedge(i, j, offset, isolevelmin);
      case 1:
        return yedge(i, j, offset, isolevelmin);
      case 2:
        return yedge(i + 1, j, offset, isolevelmin);
      case 3:
        return xedge(i, j + 1, offset, isolevelmin);
      default:
        return null;
      }
    } else {
      switch (isovertices[isopointindex][1]) {
      case 0:
        return xedge(i, j, offset, isolevelmax);
      case 1:
        return yedge(i, j, offset, isolevelmax);
      case 2:
        return yedge(i + 1, j, offset, isolevelmax);
      case 3:
        return xedge(i, j + 1, offset, isolevelmax);
      default:
        return null;
      }
    }
  }
  return null;
}
