'use strict'


let EPS = 0.0001;
let OMEPS = 0.9999;
let OPEPS = 1.0001;
let meshes, newMeshes;
let gap;
let chance = 1.0;
let slices;

let side;

const rndRng = (a,b) =>{
  return a+(b-a)*fxrand();
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth();
  background(15);
  meshes = [];
  newMeshes = [];
  initialGeometry();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initialGeometry();
}

function initialGeometry() {
  slices = 0;
  gap = 20;
  meshes.length = 0;
  let mesh = new SliceMesh();
  side = 0.4 * min(windowWidth, windowHeight);
  mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, side / 1.4, side * 1.4, side / 1.4, color(255)));
  meshes.push(mesh);
}

function draw() {
  background(15);
  pointLight(255, 255, 255, 0, 0, 500);
  pointLight(255, 255, 255, 0, 500, 0);
  pointLight(255, 255, 255, 500, 0, 0);
  rotateX(radians(35.264));
  rotateY(QUARTER_PI);
  push();
  meshes.forEach(mesh => {
    mesh.draw();
  });
  pop();
  push();
  meshes.forEach(mesh => {
    mesh.drawEdges();
  });

  pop();
}

function slice(origin, normal) {
  newMeshes.length = 0;
  let normalFlip = p5.Vector.mult(normal, -1);
  meshes.forEach(mesh => {
    if (rndRng(0.0,1.0) < chance || slices < 3) {
      let copy = mesh.copy();
      mesh.slice(new Plane(origin, normal), gap * side / 800.0, color(255 - 12 * gap, 0, 0), 7);
      if (mesh.isValid() && mesh.vertices.length > 0) {
        newMeshes.push(mesh);
      }
      copy.slice(new Plane(origin, normalFlip), gap * side / 800.0, color(12 * gap, 0, 0), 7);
      if (copy.isValid() && copy.vertices.length > 0) {
        newMeshes.push(copy);
      }
    } else {
      newMeshes.push(mesh);
    }
  });
  meshes.length = 0;
  splice(meshes, newMeshes, 0);
  newMeshes.length = 0;
  slices++;
  gap -= 0.5;
}

function mousePressed() {
  if (slices === 40) {
    initialGeometry();
  } else {
    let normal = new p5.Vector(rndRng(-1, 1), rndRng(-1, 1), rndRng(-1, 1));
    let origin = new p5.Vector(rndRng(-0.8 * side, 0.8 * side), rndRng(-0.8 * side, 0.8 * side), rndRng(-0.8 * side, 0.8 * side));
    slice(origin, normal);
  }
}

function keyPressed() {

  initialGeometry();
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
          vertex(he.v.x, he.v.y, he.v.z, he.UV.x, he.UV.y);
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
      he=this.faces[i].he;
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
