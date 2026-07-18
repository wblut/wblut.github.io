class TriangleConstants {
    constructor() {}
    x(ox, L, a, b, c) {
        return ox + (2.0 * b - a - c) * SQRT3O6 * L;
    }
    y(oy, L, a, b, c) {
        return oy - (c - a) * 0.5 * L;
    }
    vrtx(ox, oy, L, a, b, c) {
        vertex(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c))
    }
    pt(ox, oy, L, a, b, c) {
        point(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c))
    }
    ln(ox, oy, L, a, b, c, a2, b2, c2) {
        line(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c), this.x(ox, L, a2, b2, c2), this.y(oy, L, a2,
            b2, c2))
    }
    triangleHashKey(a, b, c) {
        let ha = a - c;
        let hb = b - c;
        let A = ha >= 0 ? 2 * ha : -2 * ha - 1;
        let B = hb >= 0 ? 2 * hb : -2 * hb - 1;
        return floor(A >= B ? A * A + A + B : A + B * B);
    }
}
class Point extends TriangleConstants {
    constructor(i, j, k) {
        super();
        this.a = k - j;
        this.b = i - k;
        this.c = j - i;
    }
    getZ() {
        return this.z;
    }
    getTriangleType() {
        return extmod(this.a + this.b + this.c, 3);
    }
    draw(ox, oy, L) {
        switch (this.getTriangleType()) {
            case 1:
                beginShape();
                this.vrtx(ox, oy, L, this.a - 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b - 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c - 1);
                endShape(CLOSE);
                break;
            case 2:
                beginShape();
                this.vrtx(ox, oy, L, this.a + 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b + 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c + 1);
                endShape(CLOSE);
                break;
            default:
                console.log("not a triangle");
        }
    }
}
class Triangle extends TriangleConstants {
    constructor(a, b, c, flip) {
        super();
        this.a = a;
        this.b = b;
        this.c = c;
        this.hash = this.triangleHashKey(a, b, c);
        this.flip = flip;
    }
    decorate(i, j, k, orientation, material, element) {
        this.i = i;
        this.j = j;
        this.k = k;
        this.z = i + j + k;
        this.orientation = orientation;
        this.material = material;
        this.element = element;
    }
    getZ() {
        return this.z;
    }
    getTriangleType() {
        return extmod(this.a + this.b + this.c, 3);
    }
    draw(ox, oy, L) {
        switch (this.getTriangleType()) {
            case 1:
                beginShape();
                this.vrtx(ox, oy, L, this.a - 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b - 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c - 1);
                endShape(CLOSE);
                break;
            case 2:
                beginShape();
                this.vrtx(ox, oy, L, this.a + 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b + 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c + 1);
                endShape(CLOSE);
                break;
            default:
                console.log("not a triangle");
        }
    }
}
class TriangleGrid extends TriangleConstants {
    constructor(ox, oy, L) {
        super();
        this.zx = ox;
        this.ox = ox;
        this.zy = oy;
        this.oy = oy;
        this.L = L;
        this.triangleMap = new Map();
        this.materials = new Map();
        this.defaultMaterial = new DefaultMaterial();
    }
    addMaterial(index, mat) {
        this.materials.set(index, mat);
    }
    centerOn(i, j, k) {
        let a = k - j;
        let b = i - k;
        let c = j - i;
        this.ox = this.zx - this.x(this.zx, this.L, a, b, c);
        this.oy = this.zy - this.y(this.zy, this.L, a, b, c);
    }
    findTriangle(a, b, c) {
        let triangleHash = this.triangleHashKey(a, b, c);
        return this.triangleMap.get(triangleHash);
    }
    addGridLevel(scalarField, level) {
        let flip;
        for (let i = 0; i < I; i++) {
            if (cutI && !cutK && i > I / 2) continue;
            for (let k = 0; k < K; k++) {
                if (!cutI && cutK && k > K / 2) continue;
                if (cutI && cutK && i > I / 2 && k > K / 2 && perspectiveMode!=2){
                    continue;
                }else if (cutI && cutK && i < I / 2 && k < K / 2 && perspectiveMode===2){
                    continue;
                }
                flip = perspectiveMode === 0 || perspectiveMode === 3 ? level - JTransition + 2 *
                    JTransition * noise(i * 0.017 + 53, k * 0.017 - 107) > J / 2 :
                    perspectiveMode === 2;
                if (perspectiveMode === 3) flip = !flip;
                let layer = scalarField.value(floor(i + iOffset * OFFSETFACTOR), floor(level +
                    jOffset * OFFSETFACTOR), floor(k + kOffset * OFFSETFACTOR));
                if (layer >= 0) {
                    this.addCube(i, level, k, layer === NUMLAYERS || layer === NUMLAYERS + 1 ?
                        layer : layer % NUMPALETTES, layer, flip);
                    if (level > JHeightMap[k + K * i]) JHeightMap[k + K * i] = level;
                }
            }
        }
    }
    addCube(i, j, k, material, element, flip) {
        let a = k - j;
        let b = i - k;
        let c = j - i;
        let tri = new Triangle(a, b, c - (flip ? -1 : 1), flip);
        tri.decorate(i, j, k, (perspectiveMode === 3 && flip) ? 2 : 0, material, element);
        this.addTriangle(tri, flip);
        tri = new Triangle(a, b + (flip ? -1 : 1), c, flip);
        tri.decorate(i, j, k, (perspectiveMode === 3 && flip) ? 2 : 0, material, element);
        this.addTriangle(tri, flip);
        tri = new Triangle(a - (flip ? -1 : 1), b, c), flip;
        tri.decorate(i, j, k, 1, material, element);
        this.addTriangle(tri, flip);
        tri = new Triangle(a, b, c + (flip ? -1 : 1), flip);
        tri.decorate(i, j, k, 1, material, element);
        this.addTriangle(tri, flip);
        tri = new Triangle(a, b - (flip ? -1 : 1), c, flip);
        tri.decorate(i, j, k, (perspectiveMode === 3 && flip) ? 0 : 2, material, element);
        this.addTriangle(tri, flip);
        tri = new Triangle(a + (flip ? -1 : 1), b, c, flip);
        tri.decorate(i, j, k, (perspectiveMode === 3 && flip) ? 0 : 2, material, element);
        this.addTriangle(tri, flip);
    }
    addTriangle(triangleToAdd, flip) {
        let tri = this.findTriangle(triangleToAdd.a, triangleToAdd.b, triangleToAdd.c);
        if (typeof tri === 'undefined') {
            this.triangleMap.set(triangleToAdd.hash, triangleToAdd);
            visibleLayers[triangleToAdd.element] = true;
        } else if ((flip) ? tri.getZ() >= triangleToAdd.getZ() : tri.getZ() <= triangleToAdd.getZ()) {
            this.triangleMap.set(triangleToAdd.hash, triangleToAdd);
            visibleLayers[triangleToAdd.element] = true;
        }
    }
    isOutline(tri, neighbor) {
        if (outlineMode > 0 && typeof neighbor === 'undefined') return true;
        if (outlineMode >= 2 && tri.element != neighbor.element) return true;
        return false;
    }
    isLine(tri, neighbor, threshold) {
        if (this.isOutline(tri, neighbor)) return false;
        if (outlineMode === 0 && typeof neighbor === 'undefined') return true;
        if (tri.hash < neighbor.hash) return false; // only draw lines once
        if (tri.orientation != neighbor.orientation) return true;
        if (abs(tri.getZ() - neighbor.getZ()) > threshold) return true;
        if (tri.material != neighbor.material) return true;
        return false;
    }
    drawFill() {
        push();
        strokeWeight(0.5);
        let mat;
        for (let [key, tri] of this.triangleMap) {
            mat = this.materials.get(tri.material);
            if (tri.i < 0) continue;
            let col = (mat == null ? this.defaultMaterial : mat).getColor(tri);
            if (drawHidden && tri.element < NUMLAYERS && !scalarField.layers[tri.element]) col = color(
                backgroundColor);
            if (tri.material != NUMLAYERS) {
                let f = map((tri.orientation === 1 ? JHeightMap[perspectiveMode === 3 ? tri.i + K * tri
                    .k : tri.k + K * tri.i] : IKHeightMap[perspectiveMode === 3 ? tri.i + K *
                    tri.k : tri.k + K * tri.i]) - tri.j, 0, J, luminosity, darkness);
                if (f > 0.5) {
                    col = lerpColor(col, fadeColorBottom, 1.6 * (f - 0.5));
                } else {
                    col = lerpColor(fadeColorTop, col, 0.5 + 2.0 * f);
                }
            } else {
                let f = map((tri.orientation === 1 ? JHeightMap[perspectiveMode === 3 ? tri.i + K * tri
                    .k : tri.k + K * tri.i] : IKHeightMap[perspectiveMode === 3 ? tri.i + K *
                    tri.k : tri.k + K * tri.i]) - tri.j, 0, J, 0, 1);
                if (f > 0.5) {
                    col = lerpColor(col, fadeColorBottom, 1.6 * (f - 0.5));
                } else {
                    col = lerpColor(fadeColorTop, col, 0.5 + 2.0 * f);
                }
            }
            fill(col);
            stroke(col, 0.5);
            tri.draw(this.ox, this.oy, this.L);
        }
        pop();
    }
    drawLegend() {
        push();
        strokeWeight(0.5);
        let mat;
        for (let [key, tri] of this.triangleMap) {
            if ((tri.element >= NUMLAYERS + 64 && tri.element < NUMLAYERS + 96 && scalarField.layers[tri
                    .element - 64 - NUMLAYERS]) || (frameMode === 1 && tri.element === NUMLAYERS + 128)) {
                mat = this.materials.get(tri.material);
                let col = ((mat == null || !visibleLayers[tri.element]) ? this.defaultMaterial : mat)
                    .getColor(tri);
                fill(col);
                stroke(col, 0.5);
                tri.draw(this.ox, this.oy, this.L);
            }
            stroke(0);
            strokeWeight(1.0);
            this.drawLine(tri, 0, 1);
            this.drawLine(tri, 1, 1);
            this.drawLine(tri, 2, 1);
        }
        pop();
    }
    drawLines() {
        beginShape(LINES);
        stroke(0);
        strokeWeight(1.0);
        for (let [key, tri] of this.triangleMap) {
            this.drawLine(tri, 0, 2000);
            this.drawLine(tri, 1, 2000);
            this.drawLine(tri, 2, 2000);
        }
        endShape();
    }
    drawOutlines() {
        beginShape(LINES);
        stroke(0);
        strokeWeight(constrain(3.0 * zoom, 1.0, 3.0));
        for (let [key, tri] of this.triangleMap) {
            this.drawOutline(tri, 0);
            this.drawOutline(tri, 1);
            this.drawOutline(tri, 2);
        }
        endShape();
    }
    drawFillJ(j, j2) {
        beginShape(LINES);
        for (let [key, tri] of this.triangleMap) {
            if (tri.i >= 0 && tri.j > j2 && tri.j <= j) {
                fill(backgroundColor);
                noStroke();
                tri.draw(this.ox, this.oy, this.L);
            }
        }
        endShape();
    }
    drawLinesJ(j, j2) {
        beginShape(LINES);
        stroke(0);
        strokeWeight(1.0);
        for (let [key, tri] of this.triangleMap) {
            if (tri.i >= 0 && tri.j > j2 && tri.j <= j) {
                this.drawLine(tri, 0, 1);
                this.drawLine(tri, 1, 1);
                this.drawLine(tri, 2, 1);
            }
        }
        endShape();
    }
    drawOutlinesJ(j, j2) {
        beginShape(LINES);
        stroke(0);
        strokeWeight(1.0);
        for (let [key, tri] of this.triangleMap) {
            if (tri.i >= 0 && tri.j > j2 && tri.j <= j) {
                this.drawOutline(tri, 0);
                this.drawOutline(tri, 1);
                this.drawOutline(tri, 2);
            }
        }
        endShape();
    }
    drawDecoration() {
        if (frameMode === 1) {
            push();
            this.drawLegend();
            pop();
        }
        if (frameMode > 0) {
            push();
            beginShape(LINES);
            stroke(0);
            strokeWeight(1.0);
            this.vrtx(this.ox, this.oy, this.L, -J - padding, 0, J + padding);
            this.vrtx(this.ox, this.oy, this.L, -J - padding, I + padding, J - I);
            this.vrtx(this.ox, this.oy, this.L, -J - padding, I + padding, J - I);
            this.vrtx(this.ox, this.oy, this.L, 0, I + padding, -I - padding);
            this.vrtx(this.ox, this.oy, this.L, 0, I + padding, -I - padding);
            this.vrtx(this.ox, this.oy, this.L, K + padding, I - K, -I - padding);
            this.vrtx(this.ox, this.oy, this.L, K + padding, I - K, -I - padding);
            this.vrtx(this.ox, this.oy, this.L, K + padding, -K - padding, 0);
            this.vrtx(this.ox, this.oy, this.L, K + padding, -K - padding, 0);
            this.vrtx(this.ox, this.oy, this.L, K - J, -K - padding, J + padding);
            this.vrtx(this.ox, this.oy, this.L, K - J, -K - padding, J + padding);
            this.vrtx(this.ox, this.oy, this.L, -J - padding, 0, J + padding);
            for (let [key, tri] of this.triangleMap) {
                if (frameMode === 1 || tri.element < NUMLAYERS + 64 || tri.element === NUMLAYERS + 96) {
                    this.drawOutline(tri, 0);
                    this.drawOutline(tri, 1);
                    this.drawOutline(tri, 2);
                    if (!(tri.element === NUMLAYERS + 512 && outlineMode === 3)) {
                        this.drawLine(tri, 0, tri.element === NUMLAYERS + 128 ? 2000 : 1);
                        this.drawLine(tri, 1, tri.element === NUMLAYERS + 128 ? 2000 : 1);
                        this.drawLine(tri, 2, tri.element === NUMLAYERS + 128 ? 2000 : 1);
                    }
                }
            }
            endShape();
            pop();
        }
    }
    drawLine(tri, i, threshold) {
        let neighbor;
        if (tri.getTriangleType() === 1) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a - 1, tri.b, tri.c - 1);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a - 1, tri.b - 1, tri.c);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b - 1, tri.c - 1);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                    }
                    break;
                default:
            }
        } else if (tri.getTriangleType() === 2) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a + 1, tri.b, tri.c + 1);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a + 1, tri.b + 1, tri.c);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b + 1, tri.c + 1);
                    if (this.isLine(tri, neighbor, threshold)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                    }
                    break;
                default:
            }
        }
    }
    drawOutline(tri, i, ) {
        let neighbor;
        if (tri.getTriangleType() === 1) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a - 1, tri.b, tri.c - 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a - 1, tri.b - 1, tri.c);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b - 1, tri.c - 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                    }
                    break;
                default:
            }
        } else if (tri.getTriangleType() === 2) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a + 1, tri.b, tri.c + 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a + 1, tri.b + 1, tri.c);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b + 1, tri.c + 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                    }
                    break;
                default:
            }
        }
    }
}