function code3xN(c, N, variant) {
    let base = base3xN(c, N, N === 5 ? 0 : variant);
    let code = [];
    for (let i = 0; i < N; i++) {
        if (i < 3) {
            code[i] = base[i];
        } else if (i === N - 3) {
            code[i] = base[4];
        } else if (i === N - 2) {
            code[i] = base[5];
        } else if (i === N - 1) {
            code[i] = base[6];
        } else {
            code[i] = base[3];
        }
    }
    return code;
}

function base3xN(c, variant) {
    /*
     1 | 2 | 4
     
     0
     1
     2
     
     3
     .
     .
     3
     
     4
     5
     6
     
     */
    switch (c) {
        case '/':
            return [4, 4, 2, 2, 1, 1, 1];
        case 'a':
            if (variant === 1) {
                return [7, 5, 5, 5, 7, 5, 5];
            } else {
                return [7, 5, 7, 5, 5, 5, 5];
            }
        case 'b':
            if (variant === 1) {
                return [7, 5, 5, 5, 3, 5, 7];
            } else {
                return [7, 5, 3, 5, 5, 5, 7];
            }
        case 'c':
            return [7, 1, 1, 1, 1, 1, 7];
        case 'd':
            return [3, 5, 5, 5, 5, 5, 3];
        case 'e':
            if (variant === 1) {
                return [7, 1, 1, 1, 3, 1, 7];
            } else {
                return [7, 1, 3, 1, 1, 1, 7];
            }
        case 'f':
            if (variant === 1) {
                return [7, 1, 1, 1, 3, 1, 1];
            } else {
                return [7, 1, 3, 1, 1, 1, 1];
            }
        case 'g':
            if (variant === 1) {
                return [6, 1, 1, 1, 5, 5, 7];
            } else {
                return [6, 1, 1, 5, 5, 5, 7];
            }
        case 'h':
            if (variant === 1) {
                return [5, 5, 5, 5, 7, 5, 5];
            } else {
                return [5, 5, 7, 5, 5, 5, 5];
            }
        case 'i':
            return [7, 2, 2, 2, 2, 2, 7];
        case 'j':
            return [7, 2, 2, 2, 2, 2, 3];
        case 'k':
            if (variant === 1) {
                return [5, 5, 5, 5, 3, 5, 5];
            } else {
                return [5, 5, 3, 5, 5, 5, 5];
            }
        case 'l':
            return [1, 1, 1, 1, 1, 1, 7];
        case 'm':
            return [5, 7, 7, 5, 5, 5, 5];
        case 'n':
            return [3, 7, 5, 5, 5, 5, 5];
        case 'o':
            return [2, 5, 5, 5, 5, 5, 2];
        case 'p':
            if (variant === 1) {
                return [7, 5, 5, 5, 7, 1, 1];
            } else {
                return [7, 5, 7, 1, 1, 1, 1];
            }
        case 'q':
            return [2, 5, 5, 5, 5, 5, 6];
        case 'r':
            if (variant === 1) {
                return [7, 5, 5, 5, 3, 5, 5];
            } else {
                return [7, 5, 3, 5, 5, 5, 5];
            }
        case 's':
            if (variant === 1) {
                return [7, 1, 1, 1, 7, 4, 7];
            } else {
                return [7, 1, 7, 4, 4, 4, 7];
            }
        case 't':
            return [7, 2, 2, 2, 2, 2, 2];
        case 'u':
            return [5, 5, 5, 5, 5, 5, 7];
        case 'v':
            return [5, 5, 5, 5, 5, 5, 2];
        case 'w':
            return [5, 5, 5, 5, 7, 7, 2];
        case 'x':
            if (variant === 1) {
                return [5, 5, 5, 5, 2, 5, 5];
            } else {
                return [5, 5, 2, 5, 5, 5, 5];
            }
        case 'y':
            if (variant === 1) {
                return [5, 5, 5, 5, 5, 2, 2];
            } else {
                return [5, 5, 2, 2, 2, 2, 2];
            }
        case 'z':
            if (variant === 1) {
                return [7, 4, 4, 4, 7, 1, 7];
            } else {
                return [7, 4, 7, 1, 1, 1, 7];
            }
        case '0':
            return [7, 5, 5, 5, 5, 5, 7];
        case '1':
            return [3, 2, 2, 2, 2, 2, 7];
        case '2':
            if (variant === 1) {
                return [7, 4, 4, 4, 7, 1, 7];
            } else {
                return [7, 4, 7, 1, 1, 1, 7];
            }
        case '3':
            if (variant === 1) {
                return [7, 4, 4, 4, 7, 4, 7];
            } else {
                return [7, 4, 7, 4, 4, 4, 7];
            }
        case '4':
            if (variant === 1) {
                return [5, 5, 5, 5, 7, 4, 4];
            } else {
                return [5, 5, 7, 4, 4, 4, 4];
            }
        case '5':
            if (variant === 1) {
                return [7, 1, 1, 1, 7, 4, 7];
            } else {
                return [7, 1, 7, 4, 4, 4, 7];
            }
        case '6':
            if (variant === 1) {
                return [7, 1, 1, 1, 7, 5, 7];
            } else {
                return [7, 1, 7, 5, 5, 5, 7];
            }
        case '7':
            return [7, 4, 4, 4, 4, 4, 4];
        case '8':
            if (variant === 1) {
                return [7, 5, 5, 5, 7, 5, 7];
            } else {
                return [7, 5, 7, 5, 5, 5, 7];
            }
        case '9':
            if (variant === 1) {
                return [7, 5, 5, 5, 7, 4, 7];
            } else {
                return [7, 5, 7, 4, 4, 4, 7];
            }
        case '.':
            return [0, 0, 0, 0, 0, 0, 1];
        case ',':
            return [0, 0, 0, 0, 0, 1, 1];
        case '\'':
            return [1, 1, 0, 0, 0, 0, 0];
        case '-':
            return [0, 0, 7, 0, 0, 0, 0];
        case ':':
            return [0, 2, 0, 0, 0, 2, 0];
        case '?':
            return [7, 4, 3, 1, 1, 0, 1];
        case '!':
            return [1, 1, 1, 1, 1, 0, 1];
        default:
            return [0, 0, 0, 0, 0, 0, 0];
    }
}

function getChar3xN(c, N) {
    let codes = code3xN(c, N, 0);
    let pattern = [];
    for (let i = 0; i < N; i++) {
        pattern[i] = [0, 0, 0];
        for (let j = 0; j < 3; j++) {
            if (((codes[i] >> j) & 1) == 1) {
                pattern[i][j] = 1;
            }
        }
    }
    return pattern;
}