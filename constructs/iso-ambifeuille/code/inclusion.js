

function createInclusions() {
    currentInclusion = -1;
    inclusions = [];
    randomSeed(inclusionSeed);
    let offI = 2 * SECTORHALFSIZE * sectorI * OFFSETFACTOR;
    let offJ = 2 * SECTORHALFSIZE * sectorJ * OFFSETFACTOR;
    let offK = 2 * SECTORHALFSIZE * sectorK * OFFSETFACTOR;
    let inner = Math.floor(SECTORHALFSIZE / 2);
    let outeri = SECTORHALFSIZE - Math.ceil(I/(2*OFFSETFACTOR)+1);
    let outerj = SECTORHALFSIZE - Math.ceil(J/(2*OFFSETFACTOR)+1);
    let outerk = SECTORHALFSIZE - Math.ceil(K/(2*OFFSETFACTOR)+1);
    
    for (let i = 0; i < NUMINCLUSIONS / 3; i++) {
        let roll = random();
        if (roll < 0.40) {
            inclusions[i] = new BooleanGrid(offI, offJ, offK, inner * OFFSETFACTOR, inner * OFFSETFACTOR,
                inner * OFFSETFACTOR);
        } else if (roll < 0.70) {
            inclusions[i] = new Sphere(offI, offJ, offK, inner * OFFSETFACTOR, inner * OFFSETFACTOR, inner *
                OFFSETFACTOR);
        } else {
            inclusions[i] = new RandomWalkGrid(offI, offJ, offK, inner * OFFSETFACTOR, inner * OFFSETFACTOR,
                inner * OFFSETFACTOR);
        }
    }
    for (let i = NUMINCLUSIONS / 3; i < NUMINCLUSIONS; i++) {
        let roll = hl.random();
        if (roll < 0.40) {
            inclusions[i] = new BooleanGrid(offI, offJ, offK, outeri * OFFSETFACTOR,
                outerj * OFFSETFACTOR, outerk * OFFSETFACTOR);
        } else if (roll < 0.70) {
            inclusions[i] = new Sphere(offI, offJ, offK, outeri * OFFSETFACTOR, 
                outerj * OFFSETFACTOR, outerk * OFFSETFACTOR);
        } else {
            inclusions[i] = new RandomWalkGrid(offI, offJ, offK,outeri * OFFSETFACTOR, outerj * OFFSETFACTOR,outerk * OFFSETFACTOR);
        }
    }
}


//inclusions use p5.js random with a seed determined by hl.random() stored in inclusionSeed
function randomInt(a, b) {
    return Math.floor(random(a, b + 1));
}
class Inclusion {
    constructor(offI, offJ, offK, I, J, K) {
        this.originI = offI + randomInt(-I, I);
        this.originJ = offJ + randomInt(-J, J);
        this.originK = offK + randomInt(-K, K);
        this.halfExtentI = 0;
        this.halfExtentJ = 0;
        this.halfExtentK = 0;
    }
    quickCheck(i, j, k) {
        if (i < this.originI - this.halfExtentI) return false;
        if (j < this.originJ - this.halfExtentJ) return false;
        if (k < this.originK - this.halfExtentK) return false;
        if (i > this.originI + this.halfExtentI) return false;
        if (j > this.originJ + this.halfExtentJ) return false;
        if (k > this.originK + this.halfExtentK) return false;
        return true;
    }
    inInclusion(i, j, k) {
        return -2;
    }
}
class Sphere extends Inclusion {
    constructor(offI, offJ, offK, I, J, K) {
        super(offI, offJ, offK, I, J, K);
        this.di = randomInt(2, 8);
        this.dj = randomInt(2, 8);
        this.dk = randomInt(2, 8);
        this.di2 = randomInt(2, 8);
        this.dj2 = randomInt(2, 8);
        this.dk2 = randomInt(2, 8);
        this.t = randomInt(2, 5);
        this.ei = random(0.7, 1.4);
        this.ej = random(0.7, 1.4);
        this.ek = random(0.7, 1.4);
        do {
            this.fi = random() < 0.5 ? 0 : 1;
            this.fj = random() < 0.5 ? 0 : 1;
            this.fk = random() < 0.5 ? 0 : 1;
        } while (this.fi + this.fj + this.fk === 0 || this.fi + this.fj + this.fk === 3);
        do {
            this.fi2 = random() < 0.5 ? 0 : 1;
            this.fj2 = random() < 0.5 ? 0 : 1;
            this.fk2 = random() < 0.5 ? 0 : 1;
        } while (this.fi2 + this.fj2 + this.fk2 === 0 || this.fi2 + this.fj2 + this.fk2 === 3);
        this.radius = randomInt(8, 28);
        this.halfExtentI = this.radius + 8;
        this.halfExtentJ = this.radius + 8;
        this.halfExtentK = this.radius + 8;
    }
    inInclusion(i, j, k) {
        let d2 = this.ei * (this.originI - i) * (this.originI - i) + this.ej * (this.originJ - j) * (this
            .originJ - j) + this.ek * (this.originK - k) * (this.originK - k);
        if (d2 < (this.radius + this.fi * extmod(i, this.di) + this.fj * extmod(j, this.dj) + this.fk *
                extmod(k, this.dk)) * (this.radius + this.fi2 * extmod(i, this.di2) + this.fj2 * extmod(j,
                this.dj2) + this.fk2 * extmod(k, this.dk2)) && d2 > (this.radius - this.t + this.fi *
                extmod(i, this.di) + this.fj * extmod(j, this.dj) + this.fk * extmod(k, this.dk)) * (this
                .radius - this.t + this.fi2 * extmod(i, this.di2) + this.fj2 * extmod(j, this.dj2) + this
                .fk2 * extmod(k, this.dk2))) return NUMLAYERS + 1;
        if (d2 < (this.radius + 2 + this.fi * extmod(i, this.di) + this.fj * extmod(j, this.dj) + this
                .fk * extmod(k, this.dk)) * (this.radius + 2 + this.fi2 * extmod(i, this.di2) + this.fj2 *
                extmod(j, this.dj2) + this.fk2 * extmod(k, this.dk2)) && d2 > (this.radius - 8 + this.fi *
                extmod(i, this.di) + this.fj * extmod(j, this.dj) + this.fk * extmod(k, this.dk)) * (this
                .radius - 8 + this.fi2 * extmod(i, this.di2) + this.fj2 * extmod(j, this.dj2) + this.fk2 *
                extmod(k, this.dk2))) return -1;
        return -2;
    }
}
class BooleanGrid extends Inclusion {
    constructor(offI, offJ, offK, I, J, K) {
        super(offI, offJ, offK, I, J, K);
        if (random() < 0.5) {
            this.I = 2 * randomInt(6, 12);
            this.J = 2 * randomInt(20, 48);
            this.K = 2 * randomInt(6, 12);
        } else {
            this.I = 2 * randomInt(12, 32);
            this.J = 2 * randomInt(8, 12);
            this.K = 2 * randomInt(12, 32);
        }
        this.JK = this.J * this.K;
        this.halfExtentI = this.I / 2 + 2;
        this.halfExtentJ = this.J / 2 + 2;
        this.halfExtentK = this.K / 2 + 2;
        this.create();
    }
    create() {
        this.values = new Array(this.JK * this.I).fill(-1);
        this.recipe();
    }
    index(i, j, k) {
        if (i < 0 || j < 0 || k < 0 || i >= this.I || j >= this.J || k >= this.K) return -1;
        return i * this.JK + this.K * j + k;
    }
    get(worldi, worldj, worldk) {
        return this.values[this.index(Math.floor(worldi - this.originI + this.I / 2), Math.floor(worldj -
            this.originJ + this.J / 2), Math.floor(worldk - this.originK + this.K / 2))];
    }
    inInclusion(i, j, k) {
        if (abs(i - this.originI) > this.I / 2 || abs(j - this.originJ) > this.J / 2 || abs(k - this
                .originK) > this.K / 2) return -1;
        if (this.get(i, j, k) === 1) {
            return NUMLAYERS + 1;
        } else if (this.get(i, j, k) === 0) {
            return -1;
        } else {
            return -2;
        }
    }
    recipe() {
        let iter = randomInt(8, 32);
        for (let r = 0; r < iter; r++) {
            let si = randomInt(0, this.I - 3);
            let sj = randomInt(0, this.J - 3);
            let sk = randomInt(0, this.K - 3);
            this.setBlock(si, sj, sk, randomInt(2, this.I - si), randomInt(2, this.J - sj), randomInt(2,
                this.K - sk));
        }
        this.subdivide(0.4, Math.floor(this.I / randomInt(2, 8)), Math.floor(this.J / randomInt(1, 3)),
            Math.floor(this.K / randomInt(2, 8)));
        this.hollow();
        this.sliceJ(0.45, 1, randomInt(5, 17), randomInt(3, 5), randomInt(5, 17));
    }
    set(i, j, k, value) {
        let id = this.index(i, j, k);
        if (id === -1) return;
        this.values[id] = value;
    }
    setBlock(si, sj, sk, di, dj, dk) {
        for (let i = si; i < si + di; i++) {
            for (let j = sj; j < sj + dj; j++) {
                for (let k = sk; k < sk + dk; k++) {
                    this.setBuffered(i, j, k, 1);
                }
            }
        }
    }
    setBuffered(i, j, k) {
        for (let ii = i - 1; ii <= i + 1; ii++) {
            for (let jj = j - 1; jj <= j + 1; jj++) {
                for (let kk = k - 1; kk <= k + 1; kk++) {
                    if (this.get(i, j, k) === -1) this.set(i, j, k, 0);
                }
            }
        }
        this.set(i, j, k, 1);
    }
    clearBlock(si, sj, sk, di, dj, dk) {
        for (let i = si; i < si + di; i++) {
            for (let j = sj; j < sj + dj; j++) {
                for (let k = sk; k < sk + dk; k++) {
                    this.set(i, j, k, -1);
                }
            }
        }
    }
    sliceJ(chance, lj, di, dj, dk) {
        for (let i = 0; i < this.I; i += di) {
            for (let k = 0; k < this.K; k += dk) {
                for (let j = 0; j < this.J; j += dj + lj) {
                    if (random() < chance) {
                        this.clearBlock(i, j + dj, k, di, lj, dk);
                    }
                }
            }
        }
    }
    subdivide(chance, di, dj, dk) {
        for (let i = 0; i < this.I; i += di) {
            for (let k = 0; k < this.K; k += dk) {
                for (let j = 0; j < this.J; j += dj) {
                    if (random() < chance) {
                        this.clearBlock(i, j, k, di, dj, dk);
                    }
                }
            }
        }
    }
    isBulk(i, j, k) {
        let id = this.index(i, j, k);
        if (id == -1 || this.values[id] <= 0) return false;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                for (let dk = -1; dk <= 1; dk++) {
                    id = this.index(i + di, j + dj, k + dk);
                    if (id == -1 || this.values[id] <= 0) return false;
                }
            }
        }
        return true;
    }
    hollow() {
        for (let i = 0; i < this.I; i++) {
            for (let j = 0; j < this.J; j++) {
                for (let k = 0; k < this.K; k++) {
                    if (this.isBulk(i, j, k)) {
                        this.set(i, j, k, 3);
                    }
                }
            }
        }
        let id = 0;
        for (let i = 0; i < this.I; i++) {
            for (let j = 0; j < this.J; j++) {
                for (let k = 0; k < this.K; k++) {
                    if (this.values[id] === 3) this.set(i, j, k, 0)
                }
            }
        }
    }
}
class RandomWalkGrid extends Inclusion {
    constructor(offI, offJ, offK, I, J, K) {
        super(offI, offJ, offK, I, J, K);
        this.I = 2 * randomInt(8, 32);
        this.J = 2 * randomInt(8, 32);
        this.K = 2 * randomInt(8, 32);
        this.JK = this.J * this.K;
        this.halfExtentI = this.I / 2 + 2;
        this.halfExtentJ = this.J / 2 + 2;
        this.halfExtentK = this.K / 2 + 2;
        this.create();
    }
    create() {
        this.values = new Array(this.JK * this.I).fill(-1);
        this.recipe();
    }
    index(i, j, k) {
        if (i < 0 || j < 0 || k < 0 || i >= this.I || j >= this.J || k >= this.K) return -1;
        return i * this.JK + this.K * j + k;
    }
    get(worldi, worldj, worldk) {
        return this.values[this.index(Math.floor(worldi - this.originI + this.I / 2), Math.floor(worldj -
            this.originJ + this.J / 2), Math.floor(worldk - this.originK + this.K / 2))];
    }
    inInclusion(i, j, k) {
        if (abs(i - this.originI) > this.I / 2 || abs(j - this.originJ) > this.J / 2 || abs(k - this
                .originK) > this.K / 2) return -1;
        if (this.get(i, j, k) === 1) {
            return NUMLAYERS + 1;
        } else if (this.get(i, j, k) === 0) {
            return -1;
        } else {
            return -2;
        }
    }
    recipe() {
        let iter = randomInt(8, 32);
        for (let r = 0; r < iter; r++) {
            let si = randomInt(0, this.I);
            let sj = randomInt(0, this.J);
            let sk = randomInt(0, this.K);
            this.randomWalk(randomInt(1, 3), randomInt(2, 8), si, sj, sk);
        }
        this.hollow();
    }
    set(i, j, k, value) {
        let id = this.index(i, j, k);
        if (id === -1) return;
        this.values[id] = value;
    }
    setBlock(si, sj, sk, di, dj, dk) {
        for (let i = si; i < si + di; i++) {
            for (let j = sj; j < sj + dj; j++) {
                for (let k = sk; k < sk + dk; k++) {
                    this.setBuffered(i, j, k);
                }
            }
        }
    }
    setBuffered(i, j, k) {
        for (let ii = i - 1; ii <= i + 1; ii++) {
            for (let jj = j - 1; jj <= j + 1; jj++) {
                for (let kk = k - 1; kk <= k + 1; kk++) {
                    if (this.get(i, j, k) === -1) this.set(i, j, k, 0);
                }
            }
        }
        this.set(i, j, k, 1);
    }
    clearBlock(si, sj, sk, di, dj, dk) {
        for (let i = si; i < si + di; i++) {
            for (let j = sj; j < sj + dj; j++) {
                for (let k = sk; k < sk + dk; k++) {
                    this.set(i, j, k, -1);
                }
            }
        }
    }
    randomDirection() {
        switch (randomInt(0, 5)) {
            case 0:
                return [-1, 0, 0];
            case 1:
                return [1, 0, 0];
            case 2:
                return [0, -1, 0];
            case 3:
                return [0, 1, 0];
            case 4:
                return [0, 0, -1];
            case 5:
                return [0, 0, 1];
            default:
                return [0, 1, 0];
        }
    }
    randomWalk(size, step, starti, startj, startk) {
        let si = starti;
        let sj = startj;
        let sk = startk;
        let dir;
        while (si >= 0 && si - size < I && sj >= 0 && sj - size < J && sk >= 0 && sk - size < K) {
            dir = this.randomDirection();
            for (let s = 0; s < step; s++) {
                this.setBlock(si, sj, sk, size, size, size);
                si += size * dir[0];
                sj += size * dir[1];
                sk += size * dir[2];
            }
        }
    }
    isBulk(i, j, k) {
        let id = this.index(i, j, k);
        if (id == -1 || this.values[id] <= 0) return false;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                for (let dk = -1; dk <= 1; dk++) {
                    id = this.index(i + di, j + dj, k + dk);
                    if (id == -1 || this.values[id] <= 0) return false;
                }
            }
        }
        return true;
    }
    hollow() {
        for (let i = 0; i < this.I; i++) {
            for (let j = 0; j < this.J; j++) {
                for (let k = 0; k < this.K; k++) {
                    if (this.isBulk(i, j, k)) {
                        this.set(i, j, k, 3);
                    }
                }
            }
        }
        let id = 0;
        for (let i = 0; i < this.I; i++) {
            for (let j = 0; j < this.J; j++) {
                for (let k = 0; k < this.K; k++) {
                    if (this.values[id] === 3) this.set(i, j, k, 0)
                }
            }
        }
    }
}