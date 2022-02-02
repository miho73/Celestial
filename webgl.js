const PI = Math.PI;
const PI2 = PI/2;
const PI4 = PI/4;

const AXIAL_TILT = 0.4101524;

const SPRING_EQUINOX  = 80;  // March 21st
const SUMMER_SOLSTICE = 172; // June 21st
const AUTUMN_EQUINOX  = 266; // September 23rd
const WINTER_SOLSTICE = 356; // December 22nd

const CELESTIAL_RADIUS = 0.8;

function degToRad(deg) {
    return PI * deg / 180;
}

function sin(rad) {
    return Math.sin(rad);
}
function cos(rad) {
    return Math.cos(rad);
}

/*******************************/

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
   
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw 'Cannot create shader';
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
   
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw 'Cannot create WebGL program';
}

function setTextLocation(gl, id, location) {
    if(gei(id).style.opacity == 0) {
        gei(id).style.opacity = 1;
    }
    gei(id).style.left = (
        (
            (
                location[0]
            ) * 0.5 + 0.5
        ) * gl.canvas.width
    ) + 'px';
    gei(id).style.top = (
        (
            (
                location[1]
            ) * (-0.5) + 0.5
        ) * gl.canvas.height
    ) + 'px';
}
function hideText(id) {
    gei(id).style.opacity = 0;
}
/*******************************/

var gl;

var circleProgram;
var lineProgram;

var circleTransformMatrixLocation;
var circleColorUniformLocation;
var vertexIdLoc;
var numVertsLoc;
var resolutionLoc;

var idBuffer;
var vertexBuffer;

var defaultRotation = [0.24191244158755934, 0.14398966328953214, 0];

var translation = [0, 0, 0]
var rotation = defaultRotation;
var scale = [1, 1, 1]

const numVerts = 100;

var setCoordinate = false;
var setDatetime = true;

// TODO: Change dynamic
var sunDiurnalCircleAngle = AXIAL_TILT;
var secOfDay;

var showHorizon;
var showEquator;
var showMeridian;
var showStar;
var showSun;

function webGLStart() {
    var canvas = gei('univers');
    gl = canvas.getContext('webgl');
    if(!gl) {
        throw 'WebGL cannot be initialized';
    }
    else {
        var circleVertexShaderSource = document.querySelector("#vertex-shader-celestial-circle").text;
        var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
 
        var circleVertexShader = createShader(gl, gl.VERTEX_SHADER, circleVertexShaderSource);
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        circleProgram = createProgram(gl, circleVertexShader, fragmentShader);

        vertexIdLoc = gl.getAttribLocation(circleProgram, 'vertexId');
        numVertsLoc = gl.getUniformLocation(circleProgram, 'numVerts');
        resolutionLoc = gl.getUniformLocation(circleProgram, 'resolution');
        circleTransformMatrixLocation = gl.getUniformLocation(circleProgram, "u_matrix");
        circleColorUniformLocation = gl.getUniformLocation(circleProgram, "u_color");

        // Circle
        gl.useProgram(circleProgram);

        idBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);        

        gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

        drawScene();
    }
}


function drawCircle(matrix, color) {
    const vertexIds = new Float32Array(numVerts);
    vertexIds.forEach((v, i) => {
        vertexIds[i] = i;
    });
    gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW);
    gl.uniformMatrix4fv(circleTransformMatrixLocation, false, matrix);
    gl.uniform4fv(circleColorUniformLocation, color);
    gl.uniform1f(numVertsLoc, numVerts);
    gl.drawArrays(gl.LINE_LOOP, 0, numVerts);
}
function drawLine(matrix, color) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1
    ]), gl.STATIC_DRAW);
    gl.uniformMatrix4fv(circleTransformMatrixLocation, false, matrix);
    gl.uniform4fv(circleColorUniformLocation, color);
    gl.uniform1f(numVertsLoc, 2);
    gl.drawArrays(gl.LINES, 0, 2);
}
function drawPoint(matrix, color) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0
    ]), gl.STATIC_DRAW);
    gl.uniformMatrix4fv(circleTransformMatrixLocation, false, matrix);
    gl.uniform4fv(circleColorUniformLocation, color);
    gl.uniform1f(numVertsLoc, 2);
    gl.drawArrays(gl.POINTS, 0, 1);
}


WHITE = [1, 1, 1, 1];
RED = [1, 0.396, 0.396, 1];
YELLOW = [0.965,0.839,0.333, 1];
SKY_BLUE = [0.49,0.741,0.945, 1];
SUN = [1, 0.663, 0.078, 1]

function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw circle
    gl.useProgram(circleProgram);

    gl.enableVertexAttribArray(vertexIdLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

    size = 1;
    type = gl.FLOAT;
    normalize = false;
    stride = 0;
    offset = 0;
    gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);

    var matrix = m4.translation(translation[0], translation[1], translation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    
    matrix = m4.xRotate(matrix, PI2);
    if(showHorizon) {
        drawCircle(matrix, [1,1,1,1]); // 지평선
        drawLine(matrix, [1, 1, 1, 1]); // 북점 - 남점
        drawLine(m4.yRotate(matrix, PI2), [1, 1, 1, 1]); // 천정 - 천저
        setTextLocation(gl, 'zenith', m4.scale(m4.yRotate(matrix, PI2), 0.8, 0.8, 1)); // 천정
        setTextLocation(gl, 'nadir', m4.scale(m4.yRotate(matrix, -PI2), 0.8, 0.8, 1)); // 천저
    }
    else {
        hideText('zenith');
        hideText('nadir');
    }

    if(setCoordinate) {
        equatorMatrixRight = m4.yRotate(matrix, degToRad(180-latitude));
        equatorMatrix = m4.yRotate(matrix, degToRad(90-latitude));

        if(showMeridian) {
            drawCircle(m4.xRotate(matrix, PI2), SKY_BLUE); // 자오선
        }
        if(showEquator) {
            drawCircle(equatorMatrix, RED); // 천구의 적도
            drawLine(equatorMatrix, RED); // 하지점 - 동지점
            setTextLocation(gl, 'vernal-equinox', m4.scale(m4.zRotate(equatorMatrix, PI2), 0.8, 0.8, 1)); // 춘분점
            setTextLocation(gl, 'summer-solstice', m4.scale(equatorMatrix, 0.8, 0.8, 1)); // 하지점
            setTextLocation(gl, 'autumnal-equinox', m4.scale(m4.zRotate(equatorMatrix, -PI2), 0.8, 0.8, 1)); // 추분점
            setTextLocation(gl, 'winter-solstice', m4.scale(m4.zRotate(equatorMatrix, PI), 0.8, 0.5, 1)); // 동지점
            drawLine(m4.zRotate(matrix, PI2), RED); // 춘분점 - 추분점
            drawLine(equatorMatrixRight, RED); // 천구의 북극 - 천구의 남극

            setTextLocation(gl, 'celestial-npole', m4.scale(equatorMatrixRight, 0.8, 0.8, 1)); // 천구의 북극
            setTextLocation(gl, 'celestial-spole', m4.scale(m4.zRotate(equatorMatrixRight, PI), 0.8, 0.8, 1)); // 천구의 남극
        }
        else {
            hideText('vernal-equinox');
            hideText('summer-solstice');
            hideText('autumnal-equinox');
            hideText('winter-solstice');
            hideText('celestial-npole');
            hideText('celestial-spole');
            if(showHorizon) {
                drawLine(m4.zRotate(matrix, PI2), WHITE); // 동점 - 서점
            }
        }
        if(showSun) {
            sunDiurnalCircleMatrix = m4.scale(
                m4.translate(
                    equatorMatrix,
                    0,
                    0,
                    sin(-sunDiurnalCircleAngle) * CELESTIAL_RADIUS
                ),
                cos(-sunDiurnalCircleAngle),
                cos(-sunDiurnalCircleAngle),
                1
            );
            drawCircle(sunDiurnalCircleMatrix, SUN); // 태양의 일주권
            if(setDatetime) {
                sunMatrix = m4.zRotate(sunDiurnalCircleMatrix, (secOfDay/43200)*PI+PI);
                drawPoint(sunMatrix, SUN); // 태양
            }
        }
    }
    else {
        if(showHorizon) {
            drawLine(m4.zRotate(matrix, PI2), WHITE); // 동점 - 서점
        }
    }
}