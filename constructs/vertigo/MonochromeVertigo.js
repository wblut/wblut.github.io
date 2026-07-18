'use strict'

let OMEPS = 0.9999;
let EPS = 0.0001;
let OPEPS = 1.0001;
let numSlices;
let textureGenerator;
let textures;
let side;
let tree;
let rotationChance;
let translationChance;
let shearChance;
let stretchChance;
let explode;
let phase;
let counter;
let numFrames;
let gd,gt,ga;
let gl;
let tx,ty,tz;
let dux, duy;
let zoom;

const rndRng = (a,b) =>{
  return a+(b-a)*random();
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  gl = document.getElementById('defaultCanvas0').getContext('webgl');
  textureMode(NORMAL);
  textureWrap(MIRROR);
  smooth();
  background(15);
  textureGenerator = createGraphics(512,512);
  textures = [];
  explode = 5.0;
  numSlices = 16;
  initialGeometry();
  numFrames = 3200;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  zoom=min(windowWidth, windowHeight)/1080.0;
}

function initialGeometry() {
  dux=rndRng(0,100)<50?-1:1;
  duy=rndRng(0,100)<50?-1:1;
  let meshes = [];
  let mesh = new SliceMesh();
  side =600;
  zoom=min(windowWidth, windowHeight)/1080.0;
  mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, side / 2.0* rndRng(0.5,2.20), side /2.0* rndRng(0.5,2.5), side/2.0 * rndRng(0.5,2.5) , color(255)));
  meshes.push(mesh);
  createTextures();
  translationChance = 0.4;
  rotationChance =0.4;
  shearChance = 0.1;
  stretchChance = 0.1;
  tree = new FragmentTree(meshes);
  for (let r = 0; r < numSlices; r++) {
    slice(r+6);
  }
  counter = 0;
  tx=ty=tz=0;

}

function createTextures() {
  colorMode(HSB,255);
  textures.length = 0;

  for (let i = 0; i <6+numSlices; i++) {
    textureGenerator.background(color(0) );
   
      textureGenerator.push();
      textureGenerator.translate(textureGenerator.width/2, textureGenerator.height/2);
      let a =radians(rndRng(30, 60)) * (rndRng(0,100) < 50 ? -1 : 1);
      if(i===1) ga=a;
      textureGenerator.rotate(a);
    
      let d = rndRng(10, 50);
      if(i===1) gd=d;
      let t = rndRng(5, 50);
      if(i===1) gt=t;
      textureGenerator.noStroke();
      textureGenerator.fill(255);
      for (let j = -40; j <= 40; j++) {
        textureGenerator.rect(j * (d + t) - 0.5 * d, -10000, d, 20000);
      }
      textureGenerator.pop();
    
    textures.push(textureGenerator.get());
  }
  colorMode(RGB);
}

function slice(sliceCount) {
  let M;
  let trial = 0;
  do {
    let sliceRoll = rndRng(0.0,1.0);
    if (sliceRoll < translationChance) {
      M = sliceAndTranslate();
    } else if (sliceRoll < rotationChance + translationChance) {
      M = sliceAndRotate();
    } else if (sliceRoll < rotationChance + translationChance + shearChance) {
      M = sliceAndShear();
    } else {
      M = sliceAndStretch();
    }
    trial++;
  } while (tree.minDistance(M.plane) < 5 && trial < 20);
  M.level = sliceCount;
  tree.split(M);
}

function draw() {
  phase =sq(constrain( 0.5 - 0.52 *cos(radians(360.0 / numFrames * counter)),0,1));
  background(0);
  ortho();
  gl.disable(gl.DEPTH_TEST);
  push();
      rotate(ga+PI);
      let shift=map(max(counter-numFrames/2,0),0,numFrames/2,0,4*(gd+gt));
      noStroke();
      fill(240);
      for (let j = -100; j <= 100; j++) {
        rect(shift+j * (gd + gt) - 0.5 * gd, -10000, gd, 20000);
      }
  pop();
  gl.enable(gl.DEPTH_TEST);

  rotateY(map(max(counter-numFrames/2,0),0,numFrames/2,0,TWO_PI));
  
  tree.setPhase((numSlices + 1) * phase);
  let extents=tree.getExtents();
  tx=0.98*tx-0.01*(extents[0]+extents[3]);
  ty=0.98*ty-0.01*(extents[1]+extents[4]);
  tz=0.98*tz-0.01*(extents[2]+extents[5]);
  scale(zoom);
  translate(tx,ty,tz);
  tree.draw(textures);
  counter++;
  if (counter == numFrames) {
    counter=0;
    initialGeometry()
  }
}

class Plane {
  constructor(o, n) {
    this.origin = o;
    this.normal = n;
    this.normal.normalize();
    this.u = new p5.Vector(0, 0, 1).cross(this.normal);
    if (sqrt(this.u.dot(this.u)) < EPS) {
      this.u = new p5.Vector(0, 1, 0).cross(this.normal);
    }
    this.u.normalize();
    this.v = this.normal.cross(this.u);
  }

  offset(d) {
    return new Plane(p5.Vector.add(this.origin, p5.Vector.mult(this.normal, d)), this.normal);
  }

  flip() {
    return new Plane(this.origin, p5.Vector.mult(this.normal, -1));
  }

  local(x, y, z) {
    return new p5.Vector(this.u.x * (x - this.origin.x) + this.u.y * (y - this.origin.y) + this.u.z * (z - this.origin.z),
      this.v.x * (x - this.origin.x) + this.v.y * (y - this.origin.y) + this.v.z * (z - this.origin.z),
      this.normal.x * (x - this.origin.x) + this.normal.y * (y - this.origin.y) + this.normal.z * (z - this.origin.z));
  }

  draw(side) {
    beginShape();
    vertex(this.origin.x - 0.5 * side * this.u.x - 0.5 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y - 0.5 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z - 0.5 * side * this.v.z);
    vertex(this.origin.x + 0.5 * side * this.u.x - 0.5 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y - 0.5 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z - +0.5 * side * this.v.z);
    vertex(this.origin.x + 0.5 * side * this.u.x + 0.5 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y + 0.5 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z + 0.5 * side * this.v.z);
    vertex(this.origin.x - 0.5 * side * this.u.x + 0.5 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y + 0.5 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z + 0.5 * side * this.v.z);
    endShape();
  }

}

class Halfedge {
  constructor(i) {
    this.index = i;
    this.UV = new p5.Vector();
  }

  nextInVertex() {
    return this.pair.next;
  }

  prevInVertex() {
    return this.prev.pair;
  }
}

class HEVertex {

  constructor(x, y, z, i) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.index = i;
  }

  distance(P) {
    let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z));
    return abs(signedDistance);
  }

  sideOfPlane(P) {
    let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z));
    return (signedDistance > EPS) ? 1 : (signedDistance < -EPS) ? -1 : 0;
  }
}

class Face {
  constructor(i, c) {
    this.index = i;
    if (c) {
      this.col = c;
    } else {
      this.col = color(0, 255, 0);
    }

    this.textureId = 0;

  }

  order() {
    let lhe = this.he;
    let ord = 0;
    do {
      ord++;
      lhe = lhe.next;
    } while (lhe != this.he);
    return ord;
  }

  sideOfPlane(P) {
    let lhe = this.he;
    let sideOfVertex;
    let plus = 0;
    let minus = 0;
    do {
      sideOfVertex = lhe.v.sideOfPlane(P);
      if (sideOfVertex === 1) {
        plus++;
      } else if (sideOfVertex === -1) {
        minus++;
      }
      lhe = lhe.next;
    } while (lhe != this.he);
    if (plus > 0 && minus === 0) {
      return 1;
    } else if (plus === 0 && minus > 0) {
      return -1;
    } else {
      return 0;
    }
  }
}

class Edge {
  constructor(i) {
    this.index = i;
  }
}

class Mesh {

  constructor() {
    this.initialize();

  }

  initialize() {
    this.halfedges = [];
    this.vertices = [];
    this.faces = [];
    this.edges = [];
  }

  create(data) {
    this.createRaw(data.vertexArray, data.faceArray, data.halfedgePairArray, data.faceColor);
    if (data.faceTextureIds) this.setFaceTextureIds(data.faceTextureIds);
    if (data.UVs) this.setUVs(data.UVs);
  }

  createRaw(vertexArray, faceArray, halfedgePairArray, col) {
    this.initialize();
    let i = 0;
    vertexArray.forEach(vertex => this.createVertex(vertex));
    faceArray.forEach(face => this.createFace(face, col[i++]));
    this.createEdges(halfedgePairArray);
  }

  copy() {
    let copy = new Mesh();
    copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor());
    copy.setFaceTextureIds(this.copyFaceTextureIds());
    copy.setUVs(this.copyUVs());
    return copy;
  }

  copyVertexArray() {
    let copy = [];
    for (let i = 0; i < this.vertices.length; i++) {
      copy.push([this.vertices[i].x, this.vertices[i].y, this.vertices[i].z]);
    }
    return copy;
  }

  copyFaceArray() {
    let copy = [];
    for (let i = 0; i < this.faces.length; i++) {
      let cf = [];
      let he = this.faces[i].he;
      do {
        cf.push(he.v.index);
        he = he.next;
      } while (he != this.faces[i].he);
      copy.push(cf);
    }
    return copy;
  }

  copyFaceColor() {
    let copy = [];
    for (let i = 0; i < this.faces.length; i++) {
      copy.push(this.faces[i].col);
    }
    return copy;
  }

  copyFaceTextureIds() {
    let copy = [];
    for (let i = 0; i < this.faces.length; i++) {
      copy.push(this.faces[i].textureId)
    }
    return copy;
  }


  copyHalfedgePairArray() {
    let oldtonew = [];
    let newtoold = [];
    let copy = [];
    let he;
    let index = 0;
    for (let i = 0; i < this.faces.length; i++) {
      he = this.faces[i].he;
      do {
        oldtonew[he.index] = index;
        newtoold.push(he.index);
        index++;
        he = he.next;
      } while (he != this.faces[i].he);
    }

    for (let i = 0; i < this.halfedges.length; i++) {
      copy.push(oldtonew[this.halfedges[newtoold[i]].pair.index]);
    }
    return copy;
  }


  copyUVs() {
    let newtoold = [];
    let copy = [];
    let he;
    for (let i = 0; i < this.faces.length; i++) {
      he = this.faces[i].he;
      do {
        newtoold.push(he.index);
        he = he.next;
      } while (he != this.faces[i].he);
    }
    var UV;
    for (let i = 0; i < this.halfedges.length; i++) {
      UV = this.halfedges[newtoold[i]].UV;
      copy.push([UV.x, UV.y]);
    }
    return copy;
  }

  createVertex(vertex) {
    this.vertices.push(new HEVertex(vertex[0], vertex[1], vertex[2], this.vertices.length));
  }

  createFace(face, col) {
    let f = new Face(this.faces.length, col);
    this.faces.push(f);
    let v;
    let he;
    let faceHalfedges = [];
    for (let i = 0; i < face.length; i++) {
      v = this.vertices[face[i]];
      he = new Halfedge(this.halfedges.length);
      this.halfedges.push(he);
      faceHalfedges.push(he);
      this.connectVertex(v, he);
      this.connectFace(f, he);
    }
    for (let i = 0, j = faceHalfedges.length - 1; i < faceHalfedges.length; j = i, i++) {
      this.connectHalfedges(faceHalfedges[j], faceHalfedges[i]);
    }
  }

  createEdges(halfedgePairArray) {
    for (let i = 0; i < this.halfedges.length; i++) {
      let pairIndex = halfedgePairArray[this.halfedges[i].index];
      if (!this.halfedges[i].pair) {
        this.pairHalfedges(this.halfedges[i], this.halfedges[pairIndex]);
        this.createEdge(this.halfedges[i]);
      }
    }
  }

  pairHalfedges(he1, he2) {
    he1.pair = he2;
    he2.pair = he1;
  }

  createEdge(he) {
    let e = new Edge(this.edges.length);
    this.connectEdge(e, he);
    this.edges.push(e);
  }

  connectHalfedges(he1, he2) {
    he1.next = he2;
    he2.prev = he1;
  }

  connectVertex(v, he) {
    if (!v.he) v.he = he;
    he.v = v;
  }

  connectFace(f, he) {
    if (!f.he) f.he = he;
    he.f = f;
  }

  connectEdge(e, he) {
    if (!e.he) e.he = he;
    he.e = e;
    he.pair.e = e;
  }

  draw(textures) {
    let he;
    for (let i = 0; i < this.faces.length; i++) {
      beginShape();
      if (textures) {
        texture(textures[this.faces[i].textureId]);
      } else {
        fill(this.faces[i].col);
      }
      he = this.faces[i].he;
      do {
        if (textures) {
          vertex(he.v.x, he.v.y, he.v.z, he.UV.x+dux*map(counter,0,numFrames,0,2), he.UV.y+duy*map(counter,0,numFrames,0,2));
        } else {
          vertex(he.v.x, he.v.y, he.v.z);
        }
        he = he.next;
      } while (he != this.faces[i].he);
      endShape(CLOSE);
    }
  }

  drawEdges() {
    let he;
    for (let i = 0; i < this.faces.length; i++) {
      he = this.faces[i].he;
      do {
        line(he.v.x, he.v.y, he.v.z, he.next.v.x, he.next.v.y, he.next.v.z);
        he = he.next;
      } while (he != this.faces[i].he);
    }
  }

  indexVertices() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].index = i;
    }
  }

  indexHalfedges() {
    for (let i = 0; i < this.halfedges.length; i++) {
      this.halfedges[i].index = i;
    }
  }

  indexEdges() {
    for (let i = 0; i < this.edges.length; i++) {
      this.edges[i].index = i;
    }
  }

  indexFaces() {
    for (let i = 0; i < this.faces.length; i++) {
      this.faces[i].index = i;
    }
  }

  reconnectVertices() {
    for (let i = 0; i < this.halfedges.length; i++) {
      if (!this.halfedges[i].v.he) this.halfedges[i].v.he = this.halfedges[i];
    }
  }

  isValid() {
    for (let i = 0; i < this.halfedges.length; i++) {
      if (this.halfedges[i].v == null) return false;
      if (this.halfedges[i].pair == null) return false;
      if (this.halfedges[i].pair.pair == null) return false;
      if (this.halfedges[i].pair.pair != this.halfedges[i]) return false;
      if (this.halfedges[i].f == null) return false;
      if (this.halfedges[i].next == null) return false;
      if (this.halfedges[i].next.prev == null) return false;
      if (this.halfedges[i].next.prev != this.halfedges[i]) return false;
      if (this.halfedges[i].prev == null) return false;
      if (this.halfedges[i].prev.next == null) return false;
      if (this.halfedges[i].prev.next != this.halfedges[i]) return false;
    }
    for (let i = 0; i < this.vertices.length; i++) {
      if (this.vertices[i].he == null) return false;
    }
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].he == null) return false;
    }
    for (let i = 0; i < this.faces.length; i++) {
      if (this.faces[i].he == null) return false;
    }
    return true; //maybe
  }

  getExtents() {
    let extents = [1000000.0, 1000000.0, 1000000.0, -1000000.0, -1000000.0, -1000000.0];
    for (let i = 0; i < this.vertices.length; i++) {
      extents[0] = min(this.vertices[i].x, extents[0]);
      extents[1] = min(this.vertices[i].y, extents[1]);
      extents[2] = min(this.vertices[i].z, extents[2]);
      extents[3] = max(this.vertices[i].x, extents[3]);
      extents[4] = max(this.vertices[i].y, extents[4]);
      extents[5] = max(this.vertices[i].z, extents[5]);
    }
    return extents;
  }


  setFaceTextureIds(textureIds) {
    for (let i = 0; i < this.faces.length; i++) {
      this.faces[i].textureId = textureIds[i];
    }
  }

  setUVs(UVs) {
    for (let i = 0; i < this.halfedges.length; i++) {
      this.halfedges[i].UV = new p5.Vector(UVs[i][0], UVs[i][1]);
    }
  }



}

class MeshData {

  constructor(vertexArray, faceArray, halfedgePairArray, faceColor, faceTextureIds, UVs) {
    this.vertexArray = vertexArray;
    this.faceArray = faceArray;
    this.halfedgePairArray = halfedgePairArray;
    this.faceColor = faceColor;
    this.faceTextureIds = faceTextureIds;
    this.UVs = UVs;
  }
}

class MeshDataFactory {

  static createBoxWithCenterAndSize(x, y, z, width, height, depth, col) {
    let vertices = [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5]
    ];
    let faces = [
      [0, 1, 2, 3],
      [7, 6, 5, 4],
      [1, 0, 4, 5],
      [3, 2, 6, 7],
      [2, 1, 5, 6],
      [0, 3, 7, 4]
    ];
    let faceTextureIds = [1, 2, 3, 4, 5, 6];
    let halfedgePairs = [8, 16, 12, 20, 14, 18, 10, 22, 0, 23, 6, 17, 2, 19, 4, 21, 1, 11, 5, 13, 3, 15, 7, 9];
    let UVs = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ];
    let scaledVertices = [];
    for (let i = 0; i < vertices.length; i++) {
      scaledVertices.push([x + vertices[i][0] * width, y + vertices[i][1] * height, z + vertices[i][2] * depth]);
    }
    return new MeshData(scaledVertices, faces, halfedgePairs, [col, col, col, col, col, col], faceTextureIds, UVs);
  }



  static create(vertexArray, faceArray, col) {
    let numberOfEdges = 0;
    for (let i = 0; i < this.faces.length; i++) {
      numberOfEdges += this.faces[i].length;
    }
    let halfedgePairArray = [];
    let edges = [];

    for (let i = 0; i < this.faces.length; i++) {
      for (let j = 0; j < this.faces[i].length; j++) {
        edges.push([this.faces[i][j], this.faces[i][(j + 1) % this.faces[i].length]]);
        halfedgePairArray.push(-1);
      }
    }
    for (let i = 0; i < edges.length; i++) {
      if (halfedgePairArray[i] == -1) {
        for (let j = i + 1; j < edges.length; j++) {
          if (edges[i][0] === edges[j][1] && edges[i][1] === edges[j][0]) {
            halfedgePairArray[i] = j;
            halfedgePairArray[j] = i;
          }
        }
      }
    }
    return new MeshData(vertexArray, faceArray, halfedgePairArray, col);
  }
}

class EdgeIntersection {
  constructor(e, v) {
    this.e = e;
    this.v = v;
  }
}

class SliceMesh extends Mesh {
  copy() {
    let copy = new SliceMesh();
    copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor());
    copy.setFaceTextureIds(this.copyFaceTextureIds());
    copy.setUVs(this.copyUVs());
    return copy;
  }

  slice(P, offset, col, sliceId) {
    let offsetP = P.offset(-offset);
    let intersections = [];
    let es = this.edges.length;
    for (let i = 0; i < es; i++) {
      this.sliceEdge(this.edges[i], offsetP, intersections);
    }
    let fs = this.faces.length;
    for (let i = 0; i < fs; i++) {
      this.sliceFace(this.faces[i], intersections);
    }
    this.deleteFrontFaces(offsetP);
    this.capSlice(col, offsetP, sliceId);
  }

  sliceEdge(e, P, intersections) {
    let he = e.he;
    let hep = he.pair;
    let v = he.v;
    let vp = hep.v;
    let u = new p5.Vector(vp.x - v.x, vp.y - v.y, vp.z - v.z);
    let w = new p5.Vector(v.x - P.origin.x, v.y - P.origin.y, v.z - P.origin.z);
    let D = P.normal.dot(u);
    let N = -P.normal.dot(w);
    if (abs(D) < EPS) {
      return;
    }
    let f = N / D;
    if (f < -EPS || f > OPEPS) {
      return;
    } else if (f < EPS) {
      intersections.push(new EdgeIntersection(e, v));
    } else if (f > OMEPS) {
      intersections.push(new EdgeIntersection(e, vp));
    } else {
      this.splitEdge(e, f);
      let nv = this.vertices[this.vertices.length - 1];
      intersections.push(new EdgeIntersection(e, nv));
    }
  }

  splitEdge(e, f) {
    let he = e.he;
    let hep = he.pair;
    let hen = he.next;
    let hepn = hep.next;
    let v = he.v;
    let vp = hep.v;
    this.createVertex([(1.0 - f) * v.x + f * vp.x, (1.0 - f) * v.y + f * vp.y, (1.0 - f) * v.z + f * vp.z]);
    let splitv = this.vertices[this.vertices.length - 1];
    let heNew = new Halfedge(this.halfedges.length);
    this.halfedges.push(heNew);
    this.connectVertex(splitv, heNew);
    this.connectFace(he.f, heNew);
    let hepNew = new Halfedge(this.halfedges.length);
    this.halfedges.push(hepNew);
    this.connectVertex(splitv, hepNew);
    this.connectFace(hep.f, hepNew);
    this.connectHalfedges(he, heNew);
    this.connectHalfedges(heNew, hen);
    heNew.UV = p5.Vector.lerp(he.UV, hen.UV, f);
    this.connectHalfedges(hep, hepNew);
    this.connectHalfedges(hepNew, hepn);
    hepNew.UV = p5.Vector.lerp(hep.UV, hepn.UV, 1.0 - f);
    this.pairHalfedges(he, hepNew);
    this.connectEdge(e, he);
    this.pairHalfedges(hep, heNew);
    this.createEdge(hep);
  }

  sliceFace(f, intersections) {
    let vi;
    let vj;
    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i].e.he.f === f || intersections[i].e.he.pair.f === f) {
        if (!vi) {
          vi = intersections[i].v;
        } else
        if (vi != intersections[i].v) {
          vj = intersections[i].v;
          break;
        }
      }
    }
    if (vi && vj) this.splitFace(f, vi.index, vj.index);
  }

  splitFace(f, i, j) {
    let vi = this.vertices[i];
    let hei = f.he;
    while (hei.v != vi) {
      hei = hei.next;
      if (hei === f.he) return;
    }
    let vj = this.vertices[j];
    let hej = f.he;
    while (hej.v != vj) {
      hej = hej.next;
      if (hej === f.he) return;
    }
    if (hei.next === hej || hej.next === hei) return;
    let heip = hei.prev;
    let hejp = hej.prev;
    let heNew = new Halfedge(this.halfedges.length);
    let hepNew = new Halfedge(this.halfedges.length);
    heNew.UV = hej.UV.copy();
    hepNew.UV = hei.UV.copy();
    this.connectVertex(vi, hepNew);
    this.connectVertex(vj, heNew);
    this.pairHalfedges(heNew, hepNew);
    this.createEdge(heNew);
    this.halfedges.push(heNew);
    this.halfedges.push(hepNew);
    this.connectHalfedges(heip, hepNew);
    this.connectHalfedges(hepNew, hej);
    this.connectHalfedges(hejp, heNew);
    this.connectHalfedges(heNew, hei);
    heNew.f = f;
    let he = hej;
    let nf = new Face(this.faces.length, f.col);
    this.faces.push(nf);
    nf.textureId = f.textureId;
    do {
      this.connectFace(nf, he);
      he = he.next;
    } while (he != hej);
    f.he = hei;
  }

  removeVertex(v) {
    let index = this.vertices.indexOf(v);
    if (index > -1) {
      this.vertices.splice(index, 1);
    }
  }

  removeFace(f) {
    let index = this.faces.indexOf(f);
    if (index > -1) {
      this.faces.splice(index, 1);
    }
  }

  removeHalfedge(he) {
    let index = this.halfedges.indexOf(he);
    if (index > -1) {
      this.halfedges.splice(index, 1);
    }
  }

  removeEdge(e) {
    let index = this.edges.indexOf(e);
    if (index > -1) {
      this.edges.splice(index, 1);
    }
  }

  deleteFace(f) {
    let he = f.he;
    do {
      if (he.v.he === he) he.v.he = null;
      if (he.pair) {
        he.pair.pair = null;
        he.pair.e = null;
      }
      this.removeHalfedge(he);
      this.removeEdge(he.e);
      he = he.next;
    } while (he != f.he);
    this.removeFace(f);
    this.reconnectVertices();
    this.indexHalfedges();
    this.indexFaces();
    this.indexEdges();
    let checklist = this.vertices.slice();
    for (let i = 0; i < checklist.length; i++) {
      if (!checklist[i].he) this.removeVertex(checklist[i]);
    }
    this.indexVertices();
  }

  deleteFrontFaces(P) {
    let checklist = this.faces.slice();
    for (let i = 0; i < checklist.length; i++) {
      if (checklist[i].sideOfPlane(P) === 1) {
        this.deleteFace(checklist[i]);
      }
    }
  }

  capSlice(col, P, id) {
    let cap = new Face(this.faces.length, col);
    let caphe, trial;
    let capHalfedges = [];
    for (let i = 0; i < this.halfedges.length; i++) {
      if (this.halfedges[i].pair == null) {
        caphe = new Halfedge(this.halfedges.length + capHalfedges.length);
        capHalfedges.push(caphe);
        this.pairHalfedges(this.halfedges[i], caphe);
        this.createEdge(this.halfedges[i]);
        this.connectVertex(this.halfedges[i].next.v, caphe);
        let local = P.local(caphe.v.x, caphe.v.y, caphe.v.z);
        caphe.UV = new p5.Vector((local.x + 400.0) / 800.0, (local.y + 400.0) / 800.0);
        this.connectFace(cap, caphe);
        cap.textureId = id;
      }
    }
    for (let i = 0; i < capHalfedges.length; i++) {
      this.halfedges.push(capHalfedges[i]);
    }

    if (capHalfedges.length > 0) this.faces.push(cap);
    for (let i = 0; i < capHalfedges.length; i++) {
      caphe = capHalfedges[i];
      if (!caphe.next) {
        for (let j = 0; j < capHalfedges.length; j++) {
          trial = capHalfedges[j];
          if (i != j && trial.v === caphe.pair.v) {
            this.connectHalfedges(caphe, trial);
            break;
          }
        }
      }
    }
  }
}

class M33 {

  constructor(m11, m12, m13, m21, m22,
    m23, m31, m32, m33) {
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
  }

  set(matrix33) {
    this.m11 = matrix33[0][0];
    this.m12 = matrix33[0][1];
    this.m13 = matrix33[0][2];
    this.m21 = matrix33[1][0];
    this.m22 = matrix33[1][1];
    this.m23 = matrix33[1][2];
    this.m31 = matrix33[2][0];
    this.m32 = matrix33[2][1];
    this.m33 = matrix33[2][2];
  }

  set(m11, m12, m13, m21, m22,
    m23, m31, m32, m33) {
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
  }


  set(m) {
    this.m11 = m.m11;
    this.m12 = m.m12;
    this.m13 = m.m13;
    this.m21 = m.m21;
    this.m22 = m.m22;
    this.m23 = m.m23;
    this.m31 = m.m31;
    this.m32 = m.m32;
    this.m33 = m.m33;
  }

  copy() {
    let result = new M33(this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33);
    return result;
  }

  static tensor(ux, uy, uz, vx, vy, vz) {
    let result = new M33(ux * vx, ux * vy, ux * vz, uy * vx, uy * vy, uy * vz,
      uz * vx, uz * vy, uz * vz);
    return result;
  }

  div(f) {
    let invf = 1.0 / f;
    let result = new M33(
      this.m11 * invf,
      this.m12 * invf,
      this.m13 * invf,
      this.m21 * invf,
      this.m22 * invf,
      this.m23 * invf,
      this.m31 * invf,
      this.m32 * invf,
      this.m33 * invf);
    return result;
  }

  mul(n) {
    let result = new M33(this.m11 * n.m11 + this.m12 * n.m21 + this.m13 * n.m31, this.m11 * n.m12 + this.m12 * n.m22 + this.m13 * n.m32,
      this.m11 * n.m13 + this.m12 * n.m23 + this.m13 * n.m33, this.m21 * n.m11 + this.m22 * n.m21 + this.m23 * n.m31,
      this.m21 * n.m12 + this.m22 * n.m22 + this.m23 * n.m32, this.m21 * n.m13 + this.m22 * n.m23 + this.m23 * n.m33,
      this.m31 * n.m11 + this.m32 * n.m21 + this.m33 * n.m31, this.m31 * n.m12 + this.m32 * n.m22 + this.m33 * n.m32,
      this.m31 * n.m13 + this.m32 * n.m23 + this.m33 * n.m33);
    return result;
  }

  det() {
    return this.m11 * (this.m22 * this.m33 - this.m23 * this.m32) + this.m12 * (this.m23 * this.m31 - this.m21 * this.m33) + this.m13 * (this.m21 * this.m32 - this.m22 * this.m31);
  }

  transpose() {
    let tmp = this.m12;
    this.m12 = this.m21;
    this.m21 = tmp;
    tmp = this.m13;
    this.m13 = this.m31;
    this.m31 = tmp;
    tmp = this.m23;
    this.m23 = this.m32;
    this.m32 = tmp;
  }

  getTranspose() {
    let result = new M33(this.m11, this.m21, this.m31, this.m12, this.m22, this.m32, this.m13, this.m23, this.m33);
    return result;
  }

  inverse() {
    let d = this.det();
    if (abs(d) < EPS) {
      return null;
    }
    let I = new M33(this.m22 * this.m33 - this.m23 * this.m32, this.m13 * this.m32 - this.m12 * this.m33, this.m12 * this.m23 - this.m13 * this.m22,
      this.m23 * this.m31 - this.m21 * this.m33, this.m11 * this.m33 - this.m13 * this.m31, this.m13 * this.m21 - this.m11 * this.m23, this.m21 * this.m32 - this.m22 * this.m31,
      this.m12 * this.m31 - this.m11 * this.m32, this.m11 * this.m22 - this.m12 * this.m21);
    I = I.div(d);
    return I;
  }

}

class M44 {
  constructor(m11, m12, m13, m14, m21,
    m22, m23, m24, m31, m32, m33,
    m34, m41, m42, m43, m44) {
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
  }

  set(matrix44) {
    this.m11 = matrix44[0][0];
    this.m12 = matrix44[0][1];
    this.m13 = matrix44[0][2];
    this.m14 = matrix44[0][3];
    this.m21 = matrix44[1][0];
    this.m22 = matrix44[1][1];
    this.m23 = matrix44[1][2];
    this.m24 = matrix44[1][3];
    this.m31 = matrix44[2][0];
    this.m32 = matrix44[2][1];
    this.m33 = matrix44[2][2];
    this.m34 = matrix44[2][3];
    this.m41 = matrix44[3][0];
    this.m42 = matrix44[3][1];
    this.m43 = matrix44[3][2];
    this.m44 = matrix44[3][3];
  }

  set(m11, m12, m13, m14, m21,
    m22, m23, m24, m31, m32, m33,
    m34, m41, m42, m43, m44) {
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
  }

  copy() {
    let result = new M44(this.m11, this.m12, this.m13, this.m14, this.m21, this.m22, this.m23, this.m24, this.m31, this.m32, this.m33, this.m34, this.m41, this.m42, this.m43, this.m44);
    return result;
  }

  mul(m) {
    let result = new M44(this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31 + this.m14 * m.m41,
      this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32 + this.m14 * m.m42,
      this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33 + this.m14 * m.m43,
      this.m11 * m.m14 + this.m12 * m.m24 + this.m13 * m.m34 + this.m14 * m.m44,
      this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31 + this.m24 * m.m41,
      this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32 + this.m24 * m.m42,
      this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33 + this.m24 * m.m43,
      this.m21 * m.m14 + this.m22 * m.m24 + this.m23 * m.m34 + this.m24 * m.m44,
      this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31 + this.m34 * m.m41,
      this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32 + this.m34 * m.m42,
      this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33 + this.m34 * m.m43,
      this.m31 * m.m14 + this.m32 * m.m24 + this.m33 * m.m34 + this.m34 * m.m44,
      this.m41 * m.m11 + this.m42 * m.m21 + this.m43 * m.m31 + this.m44 * m.m41,
      this.m41 * m.m12 + this.m42 * m.m22 + this.m43 * m.m32 + this.m44 * m.m42,
      this.m41 * m.m13 + this.m42 * m.m23 + this.m43 * m.m33 + this.m44 * m.m43,
      this.m41 * m.m14 + this.m42 * m.m24 + this.m43 * m.m34 + this.m44 * m.m44);
    return result;
  }

  inverse() {
    let m = [
      [this.m11, this.m12, this.m13, this.m14],
      [this.m21, this.m22, this.m23, this.m24],
      [this.m31, this.m32, this.m33, this.m34],
      [this.m41, this.m12, this.m43, this.m44]
    ];
    let indxc = [];
    let indxr = [];
    let ipiv = [];
    let minv = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        minv[i][j] = m[i][j];
      }
    }
    for (let i = 0; i < 4; i++) {
      let irow = -1,
        icol = -1;
      let big = 0.;
      // Choose pivot
      for (let j = 0; j < 4; j++) {
        if (ipiv[j] != 1) {
          for (let k = 0; k < 4; k++) {
            if (ipiv[k] == 0) {
              if (abs(minv[j][k]) >= big) {
                big = abs(minv[j][k]);
                irow = j;
                icol = k;
              }
            } else if (ipiv[k] > 1) {
              return null;
            }
          }
        }
      }
      ++ipiv[icol];
      // Swap rows _irow_ and _icol_ for pivot
      let tmp;
      if (irow != icol) {
        for (let k = 0; k < 4; ++k) {
          tmp = minv[irow][k];
          minv[irow][k] = minv[icol][k];
          minv[icol][k] = tmp;
        }
      }
      indxr[i] = irow;
      indxc[i] = icol;
      if (minv[icol][icol] == 0.) {
        return null;
      }
      // Set $m[icol][icol]$ to one by scaling row _icol_ appropriately
      let pivinv = 1.0 / minv[icol][icol];
      minv[icol][icol] = 1.0;
      for (let j = 0; j < 4; j++) {
        minv[icol][j] *= pivinv;
      }
      // Subtract this row from others to zero out their columns
      for (let j = 0; j < 4; j++) {
        if (j != icol) {
          let save = minv[j][icol];
          minv[j][icol] = 0;
          for (let k = 0; k < 4; k++) {
            minv[j][k] -= minv[icol][k] * save;
          }
        }
      }
    }
    let tmp;
    // Swap columns to reflect permutation
    for (let j = 3; j >= 0; j--) {
      if (indxr[j] != indxc[j]) {
        for (let k = 0; k < 4; k++) {
          tmp = minv[k][indxr[j]];
          minv[k][indxr[j]] = minv[k][indxc[j]];
          minv[k][indxc[j]] = tmp;
        }
      }
    }
    let I = new M44();
    I.set(minv);
    return I;
  }

  transpose() {
    let tmp = this.m12;
    this.m12 = this.m21;
    this.m21 = tmp;
    tmp = this.m13;
    this.m13 = this.m31;
    this.m31 = tmp;
    tmp = this.m14;
    this.m14 = this.m41;
    this.m41 = tmp;
    tmp = this.m23;
    this.m23 = this.m32;
    this.m32 = tmp;
    tmp = this.m24;
    this.m24 = this.m42;
    this.m42 = tmp;
    tmp = this.m34;
    this.m34 = this.m43;
    this.m43 = tmp;
  }

  getTranspose() {
    let result = new M44(this.m11, this.m21, this.m31, this.m41, this.m12, this.m22, this.m32, this.m42, this.m13, this.m23, this.m33, this.m43, this.m14, this.m24, this.m34, this.m44);
    return result;
  }
}


class Transform {
  constructor() {
    this.T = new M44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.invT = new M44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  addTransform(transform) {
    this.T = transform.T.mul(this.T);
    this.invT = this.invT.mul(transform.T);
  }

  addTranslate(f, v) {
    this.T = new M44(1, 0, 0, f * v.x, 0, 1, 0, f * v.y, 0, 0, 1, f * v.z, 0, 0, 0, 1).mul(this.T);
    this.invT = this.invT.mul(new M44(1, 0, 0, -f * v.x, 0, 1, 0, -f * v.y, 0, 0, 1, -f * v.z, 0, 0, 0, 1));
  }

  addScale(s) {
    this.T = new M44(s.x, 0, 0, 0, 0, s.y, 0, 0, 0, 0, s.z, 0, 0, 0, 0, 1).mul(this.T);
    this.invT = this.invT.mul(new M44(1.0 / s.x, 0, 0, 0, 0, 1.0 / s.y, 0, 0, 0, 0, 1.0 / s.z, 0, 0, 0, 0, 1));
  }

  addScale(sx, sy, sz) {
    this.T = new M44(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1).mul(this.T);
    this.invT = this.invT.mul(new M44(1.0 / sx, 0, 0, 0, 0, 1.0 / sy, 0, 0, 0, 0, 1.0 / sz, 0, 0, 0, 0, 1));
  }

  addScale(s) {
    this.T = new M44(s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1).mul(this.T);
    this.invT = this.invT.mul(new M44(1 / s, 0, 0, 0, 0, 1 / s, 0, 0, 0, 0, 1 / s, 0, 0, 0, 0, 1));
  }

  addRotateX(angle) {
    let s = sin(angle);
    let c = cos(angle);
    let tmp = new M44(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
    this.T = tmp.mul(this.T);
    this.invT = this.invT.mul(tmp.getTranspose());
  }

  addRotateY(angle) {
    let s = sin(angle);
    let c = cos(angle);
    let tmp = new M44(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
    this.T = tmp.mul(this.T);
    this.invT = this.invT.mul(tmp.getTranspose());
  }

  addRotateZ(angle) {
    let s = sin(angle);
    let c = cos(angle);
    let tmp = new M44(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.T = tmp.mul(this.T);
    this.invT = this.invT.mul(tmp.getTranspose());
  }

  addRotateAboutOrigin(angle, axis) {
    let a = new p5.Vector(axis.x, axis.y, axis.z);
    a.normalize();
    let s = sin(angle);
    let c = cos(angle);
    let tmp = new M44(a.x * a.x + (1.0 - a.x * a.x) * c,
      a.x * a.y * (1.0 - c) - a.z * s, a.x * a.z * (1.0 - c) + a.y * s, 0,
      a.x * a.y * (1.0 - c) + a.z * s, a.y * a.y + (1.0 - a.y * a.y) * c,
      a.y * a.z * (1.0 - c) - a.x * s, 0, a.x * a.z * (1.0 - c) - a.y * s,
      a.y * a.z * (1.0 - c) + a.x * s, a.z * a.z + (1.0 - a.z * a.z) * c, 0, 0, 0, 0, 1);
    this.T = tmp.mul(this.T);
    this.invT = this.invT.mul(tmp.getTranspose());
  }

  addRotateAboutAxis(angle, p, axis) {
    this.addTranslate(-1, p);
    this.addRotateAboutOrigin(angle, axis);
    this.addTranslate(1, p);
  }

  addRotateAboutAxis2P(angle, p, q) {
    this.addTranslate(-1, p);
    this.addRotateAboutOrigin(angle, p5.Vector.sub(q, p));
    this.addTranslate(1, p);
  }

  addShear(origin, normal, v, angle) {
    this.addTranslate(-1, origin);
    let lv = new p5.Vector(v.x, v.y, v.z);
    lv.normalize();
    let tana = tan(angle);
    lv.mult(tana);
    let tmp = M33.tensor(lv.x, lv.y, lv.z, normal.x, normal.y, normal.z);
    let Tr = new M44(1 + tmp.m11, tmp.m12, tmp.m13, 0, tmp.m21, 1 + tmp.m22, tmp.m23, 0, tmp.m31, tmp.m32,
      1 + tmp.m33, 0, 0, 0, 0, 1);
    this.T = Tr.mul(this.T);
    tana *= -1;
    Tr = new M44(1 - tmp.m11, -tmp.m12, -tmp.m13, 0, -tmp.m21, 1 - tmp.m22, -tmp.m23, 0, -tmp.m31, -tmp.m32,
      1 - tmp.m33, 0, 0, 0, 0, 1);
    this.invT = this.invT.mul(Tr);
    this.addTranslate(1, origin);
  }

  addStretch(origin, axis, factor) {
    let P = new Plane(origin, axis);
    this.addFromWorldToCS(P.origin, P.u, P.v, P.normal);
    let invsqrt = 1.0 / sqrt(abs(factor));
    this.addScale(invsqrt, invsqrt, factor);
    this.addFromCSToWorld(P.origin, P.u, P.v, P.normal);
  }

  addFromCSToWorld(origin, X, Y, Z) {
    let ex2 = new p5.Vector(1, 0, 0),
      ey2 = new p5.Vector(0, 1, 0),
      ez2 = new p5.Vector(0, 0, 1);
    let o2 = new p5.Vector(0, 0, 0);
    let xx = ex2.dot(X);
    let xy = ex2.dot(Y);
    let xz = ex2.dot(Z);
    let yx = ey2.dot(X);
    let yy = ey2.dot(Y);
    let yz = ey2.dot(Z);
    let zx = ez2.dot(X);
    let zy = ez2.dot(Y);
    let zz = ez2.dot(Z);
    let tmp = new M44(xx, xy, xz, 0, yx, yy, yz, 0, zx, zy, zz, 0, 0, 0, 0, 1);
    let invtmp = new M44(xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, 0, 0, 0, 1);
    this.T = tmp.mul(this.T);
    this.invT = this.invT.mul(invtmp);
    this.addTranslate(1, origin);
  }

  addFromWorldToCS(origin, X, Y, Z) {
    let tmp = new Transform();
    tmp.addFromCSToWorld(origin, X, Y, Z);
    this.T = tmp.invT.mul(this.T);
    this.invT = this.invT.mul(tmp.T);
  }

  inverse() {
    let tmp = this.T;
    this.T = this.invT.
    this.invT = tmp;
  }

  clear() {
    this.T = new M44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.invT = new M44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  apply(mesh, target) {
    let p, q;
    for (let i = 0; i < mesh.vertices.length; i++) {
      p = mesh.vertices[i];
      this._xt = this.T.m11 * p.x + this.T.m12 * p.y + this.T.m13 * p.z + this.T.m14;
      this._yt = this.T.m21 * p.x + this.T.m22 * p.y + this.T.m23 * p.z + this.T.m24;
      this._zt = this.T.m31 * p.x + this.T.m32 * p.y + this.T.m33 * p.z + this.T.m34;
      this._wt = this.T.m41 * p.x + this.T.m42 * p.y + this.T.m43 * p.z + this.T.m44;
      this._wt = 1.0 / this._wt;
      if (target) {
        q = target.vertices[i];
        q.x = this._xt * this._wt;
        q.y = this._yt * this._wt;
        q.z = this._zt * this._wt;
      } else {
        p.x = this._xt * this._wt;
        p.y = this._yt * this._wt;
        p.z = this._zt * this._wt;
      }
    }
  }

  applyInv(mesh) {
    let p;
    for (let i = 0; i < mesh.vertices.length; i++) {
      p = mesh.vertices[i];
      this._xt = this.invT.m11 * p.x + this.invT.m12 * p.y + this.invT.m13 * p.z + this.invT.m14;
      this._yt = this.invT.m21 * p.x + this.invT.m22 * p.y + this.invT.m23 * p.z + this.invT.m24;
      this._zt = this.invT.m31 * p.x + this.invT.m32 * p.y + this.invT.m33 * p.z + this.invT.m34;
      this._wt = this.invT.m41 * p.x + this.invT.m42 * p.y + this.invT.m43 * p.z + this.invT.m44;
      this._wt = 1.0 / this._wt;
      p.x = this._xt * this._wt;
      p.y = this._yt * this._wt;
      p.z = this._zt * this._wt;
    }
  }
}


class Transformation {
  //rotation or stretch
  constructor(o, a, amt, t, dir) {
    this.origin = o.copy();
    this.normal = a.copy();
    this.normal.normalize();
    this.plane = new Plane(this.origin, this.normal);
    this.amount = amt;
    this.type = t;
    if (t === 1 || t === 3) {
      this.direction = this.normal;
    } else {
      this.direction = dir.copy();
      this.direction.normalize();

    }
    this.reverseDirection = new p5.Vector(-this.direction.x, -this.direction.y, -this.direction.z);
    this.level = 0;
  }

  getTransform(f) {
    let fAmount = f * this.amount;
    let transform = new Transform();
    if (this.type === 0) {
      transform.addTranslate(fAmount, this.direction);
      transform.addTranslate(f * explode, this.normal);
    } else if (this.type === 1) {
      transform.addRotateAboutAxis(fAmount, this.origin, this.direction);
      transform.addTranslate(f * explode, this.normal);
    } else if (this.type === 2) {
      transform.addShear(this.origin, this.normal, this.direction, radians(fAmount));
      transform.addTranslate(f * explode, this.normal);
    } else if (this.type === 3) {
      fAmount = 1.0 + f * (this.amount - 1.0);
      transform.addStretch(this.origin, this.normal, fAmount);
      transform.addTranslate(f * explode, this.normal);
    }
    return transform;
  }

  getInverseTransform(f) {
    let fAmount = f * this.amount;
    let transform = new Transform();
    if (this.type === 0) {
      transform.addTranslate(-f * explode, this.normal);
      transform.addTranslate(fAmount, this.reverseDirection);
    } else if (this.type === 1) {
      transform.addTranslate(-f * explode, this.normal);
      transform.addRotateAboutAxis(fAmount, this.origin, this.reverseDirection);
    } else if (this.type === 2) {
      transform.addTranslate(-f * explode, this.normal);
      transform.addShear(this.origin, this.normal, this.reverseDirection, radians(fAmount));
    } else if (this.type === 3) {
      fAmount = 1.0 + f * (this.amount - 1.0);
      transform.addTranslate(-f * explode, this.normal);
      transform.addStretch(this.origin, this.normal, 1.0 / fAmount);
    }
    return transform;
  }
}

function sliceAndRotate() {
  let origin;
  let normal;
  let dirRoll = Math.floor(rndRng(1,3));
  let posRoll = rndRng(-150, 150);
  switch (dirRoll) {
    case 0:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    case 1:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
    default:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
  }
  let angle =dirRoll* radians(45);
  return new Transformation(origin, normal, angle, 1);
}

function sliceAndTranslate() {
  let origin;
  let normal;
  let direction;
  let posRoll = rndRng(-150, 150);
  let planeRoll = Math.floor(rndRng(0,6));
  switch (planeRoll) {
    case 0:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      direction = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
    case 1:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      direction = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      break;
    case 2:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      direction = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    case 3:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      direction = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      break;
    case 4:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      direction = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    default:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      direction = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
  }
  let displacement = 25.0 * Math.floor(rndRng(1.0, 5.0));
  return new Transformation(origin, normal, displacement, 0, direction);
}


function sliceAndShear() {
  let origin;
  let normal;
  let direction;
  let posRoll = rndRng(-150, 150);
  let planeRoll = Math.floor(rndRng(0,6));
  switch (planeRoll) {
    case 0:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      direction = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
    case 1:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      direction = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      break;
    case 2:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      direction = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    case 3:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      direction = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      break;
    case 4:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      direction = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    default:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
      direction = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
  }
  let shearAngle = Math.floor(rndRng(1,5))*15;
  return new Transformation(origin, normal, shearAngle, 2, direction);
}

function sliceAndStretch() {
  let origin;
  let normal;
  let dirRoll = Math.floor(rndRng(0,3));
  let posRoll = rndRng(-150, 150);
  switch (dirRoll) {
    case 0:
      origin = new p5.Vector(posRoll, 0, 0);
      normal = new p5.Vector(rndRng(0,100) < 50 ? 1 : -1, 0, 0);
      break;
    case 1:
      origin = new p5.Vector(0, posRoll, 0);
      normal = new p5.Vector(0, rndRng(0,100) < 50 ? 1 : -1, 0);
      break;
    default:
      origin = new p5.Vector(0, 0, posRoll);
      normal = new p5.Vector(0, 0, rndRng(0,100) < 50 ? 1 : -1);
  }
  let s = sqrt(2.0);
  s = (rndRng(0,100) < 50) ? 1.0 / s : s;
  return new Transformation(origin, normal, s, 3);
}

class FragmentTree {

  constructor(meshes) {
    this.roots = [];
    for (let i = 0; i < meshes.length; i++) {
      this.roots.push(new Fragment(meshes[i]));
    }
  }

  split(M) {
    for (let i = 0; i < this.roots.length; i++) {
      this.roots[i].split(M);
    }

  }

  setPhase(f) {
    for (let i = 0; i < this.roots.length; i++) {
      this.roots[i].setPhase(f);
    }
  }

  setLevel(l) {
    for (let i = 0; i < this.roots.length; i++) {
      this.roots[i].setLevel(l);
    }
  }

  getExtents() {
    let extents = [1000000, 1000000, 1000000, -1000000, -1000000, -1000000];
    for (let i = 0; i < this.roots.length; i++) {
      this.roots[i].addExtents(extents);
    }
    return extents;
  }

  draw(textures) {
    for (let i = 0; i < this.roots.length; i++) {
      this.roots[i].draw(textures);
    }

  }

  minDistance(P) {
    let minDistance = 1000000;
    for (let i = 0; i < this.roots.length; i++) {


      minDistance = min(minDistance, this.roots[i].minDistance(P));
    }
    return minDistance;
  }
}



class Fragment {

  constructor(m, p, ptc) {
    this.mesh = m.copy();
    this.invTMesh = m.copy();
    this.dynMesh = m.copy();
    if (ptc) this.parentToChild = ptc;
    if (p) this.parent = p;
    this.child1 = null;
    this.child2 = null;
    this.level = (p) ? p.level + 1 : 0;
    if (p) {
      let q = this;
      do {
        if (q.parentToChild) {
          let T = q.parentToChild.getInverseTransform(1.0);
          T.apply(this.invTMesh);
        }
        q = q.parent;
      } while (q);
    }
  }


  split(M) {
    if (!this.child1 && !this.child2) {
      let split1 = this.mesh.copy();
      let split2 = this.mesh.copy();
      split1.slice(M.plane, 2.0, color(0), 7);
      split2.slice(M.plane.flip(), 2.0, color(0), 7);

      if (split1.vertices.length > 0 && split1.isValid()) {
        this.child1 = new Fragment(split1, this, null);

      }
      if (split2.vertices.length > 0 && split2.isValid()) {
        M.getTransform(1.0).apply(split2);
        this.child2 = new Fragment(split2, this, M);

      }
    } else {
      if (this.child1) {
        this.child1.split(M);
      }
      if (this.child2) {
        this.child2.split(M);
      }
    }
  }


  minDistance(P) {
    let minDistance = 1000000;
    if ((!this.child1 && !this.child2)) {
      this.mesh.vertices.forEach(v => {
        minDistance = min(minDistance, v.distance(P));
      });
    } else {
      if (this.child1) {
        minDistance = min(minDistance, this.child1.minDistance(P));
      }
      if (this.child2) {
        minDistance = min(minDistance, this.child2.minDistance(P));
      }
    }
    return minDistance;
  }

  setPhase(f) {

    if ((!this.child1 && !this.child2) || f <= this.level) {
      this.drawMesh = this.getMesh(f);
    } else {
      this.drawMesh = null;
      if (this.child1) {
        this.child1.setPhase(f);
      }
      if (this.child2) {
        this.child2.setPhase(f);
      }
    }
  }

  setLevel(l) {

    if ((!this.child1 && !this.child2) || l === this.level) {
      this.drawMesh = this.getMesh(l);
    } else {
      this.drawMesh = null;
      if (this.child1) {
        this.child1.setLevel(l);
      }
      if (this.child2) {
        this.child2.setLevel(l);
      }
    }
  }

  addExtents(extents) {
    if (this.drawMesh) {
      let fragmentExtents = this.drawMesh.getExtents();
      for (let i = 0; i < 3; i++) {
        extents[i] = min(extents[i], fragmentExtents[i]);
        extents[i + 3] = max(extents[i + 3], fragmentExtents[i + 3]);
      }
    } else {
      if (this.child1) {
        this.child1.addExtents(extents);
      }
      if (this.child2) {
        this.child2.addExtents(extents);
      }
    }
  }

  draw(textures) {
    if (this.drawMesh) {
      this.drawMesh.draw(textures);
    } else {
      if (this.child1) {
        this.child1.draw(textures);
      }
      if (this.child2) {
        this.child2.draw(textures);
      }
    }
  }

  getMesh(f) {
    if (f <= 0) {
      return this.invTMesh;
    } else if (f >= this.level) {
      return this.mesh;
    } else {
      let p = this;
      let fracf;
      let T = new Transform();
      do {
        if (p.parentToChild != null) {
          fracf = constrain(p.level - f, 0.0, 1.0);
          T.addTransform(p.parentToChild.getInverseTransform(fracf));
        }
        p = p.parent;
      } while (p != null && f < p.level);

      T.apply(this.mesh, this.dynMesh);
      return this.dynMesh;
    }
  }
}
