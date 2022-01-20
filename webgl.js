const PI = Math.PI;
const PI2 = PI/2;
const PI4 = PI/4;

function degToRad(deg) {
    return PI * deg / 180;
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

const numVerts = 200;

var setCoordinate = false;

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
    drawCircle(matrix, [1,1,1,1]); // 지평선
    drawLine(matrix, [1, 1, 1, 1]); // 북점 - 남점

    if(setCoordinate) {
        drawCircle(m4.yRotate(matrix, degToRad(90-latitude)), RED); // 천구의 적도
        drawLine(m4.yRotate(matrix, degToRad(90-latitude)), RED); // 하지점 - 동지점
        drawLine(m4.zRotate(matrix, PI2), RED); // 춘분점 - 추분점
        drawLine(m4.yRotate(matrix, degToRad(180-latitude)), RED); // 천구의 북극 - 천구의 남극
        drawCircle(m4.xRotate(matrix, PI2), SKY_BLUE); // 자오선
        
        drawPoint(m4.yRotate(matrix, degToRad(180-latitude)), YELLOW); // 북극성
    }
    else {
        drawLine(m4.zRotate(matrix, PI2), WHITE); // 춘분점 - 추분점
    }
}