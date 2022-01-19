function gei(id) {
    return document.getElementById(id);
}

window.addEventListener("load", function() {
    try {
        sq = Math.min(this.window.innerWidth, this.window.innerHeight);
        gei('univers').width = sq;
        gei('univers').height = sq;
        webGLStart();
        gei('loading').style.opacity = 0;
        setTimeout(function() {
            gei('loading').style.display = 'none';
        }, 150);
    }
    catch(error) {
        console.error(error)
        gei('loading-error').style.display = 'block';
    }
});

window.addEventListener("resize", function() {
    sq = Math.min(this.window.innerWidth, this.window.innerHeight);
    gei('univers').width = sq;
    gei('univers').height = sq;
    drawScene();
});

let latitude, longitude;

function updateCoordinate() {
    latitude = gei('latitude').value;
    longitude = gei('longitude').value;
    drawScene();
}

function enterCoordinateHere() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateGps);
    }
    else {
        alert("위치서비스를 사용할 수 없어요.")
    }
}
function updateGps(position) {
    gei('latitude').value = position.coords.latitude;
    gei('longitude').value = position.coords.longitude
    updateCoordinate();
}

function corSysToEqu() {
    gei('equ-cor-label').setAttribute('now', 'active');
    gei('hor-cor-label').setAttribute('now', 'disabled');
}
function corSysToHor() {
    gei('equ-cor-label').setAttribute('now', 'disabled');
    gei('hor-cor-label').setAttribute('now', 'active');
}

// WebGL
var gl;

var program;

var positionAttributeLocation;
var transformMatrixLocation;
var colorUniformLocation;
var vertexIdLoc;
var numVertsLoc;
var resolutionLoc;

var idBuffer;

var translation = [0, 0, 0]
var rotation = [0, 0, 0]
var scale = [1, 1, 1]

const numVerts = 200;

function webGLStart() {
    var canvas = gei('univers');
    gl = canvas.getContext('webgl');
    if(!gl) {
        throw 'WebGL cannot be initialized';
    }
    else {
        var vertexShaderSource = document.querySelector("#vertex-shader-celestial-circle").text;
        var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
 
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        program = createProgram(gl, vertexShader, fragmentShader);

        positionAttributeLocation = gl.getAttribLocation(program, "celestial_position");
        vertexIdLoc = gl.getAttribLocation(program, 'vertexId');
        numVertsLoc = gl.getUniformLocation(program, 'numVerts');
        resolutionLoc = gl.getUniformLocation(program, 'resolution');
        transformMatrixLocation = gl.getUniformLocation(program, "u_matrix");
        colorUniformLocation = gl.getUniformLocation(program, "u_color");

        gl.useProgram(program);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        idBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);        

        gl.uniform1f(numVertsLoc, numVerts);
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
    gl.uniformMatrix4fv(transformMatrixLocation, false, matrix);
    gl.uniform4fv(colorUniformLocation, color);
    gl.drawArrays(gl.LINE_LOOP, 0, numVerts);
}

function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
 
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.enableVertexAttribArray(vertexIdLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

    const size = 1;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);

    var matrix = m4.translation(translation[0], translation[1], translation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    drawCircle(matrix, [1,1,1,1]);

    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    
    matrix = m4.xRotate(matrix, degToRad(90));
    drawCircle(matrix, [1,1,1,1]);
    drawCircle(m4.yRotate(matrix, degToRad(90-latitude)), [1, 0.2, 0.2, 1]); // Equator
}