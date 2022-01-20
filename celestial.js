function gei(id) {
    return document.getElementById(id);
}

window.addEventListener("load", function() {
    try {
        sq = Math.min(this.window.innerWidth, this.window.innerHeight);
        canvas = gei('univers');
        canvas.width = sq;
        canvas.height = sq;
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

// change view by mouse
var mouseDown = false;
var prevMouseLocation = [];
const sensitivity = 1;
window.addEventListener("mousedown", function(event) {
    prevMouseLocation = [event.pageX, event.pageY];
    mouseDown = true;
});
window.addEventListener("mouseup", function() {
    prevMouseLocation = []
    mouseDown = false;
});
window.addEventListener("mousemove", function(event) {
    if(mouseDown) {
        rotation = [
            rotation[0] + (sensitivity*(PI*(event.pageY-prevMouseLocation[1])/this.window.innerHeight)),
            rotation[1] + (sensitivity*(PI*(event.pageX-prevMouseLocation[0])/this.window.innerWidth)),
            rotation[2]
        ];
        prevMouseLocation = [event.pageX, event.pageY]
        drawScene();
    }
});


let latitude, longitude;

function updateCoordinate() {
    latitude = gei('latitude').value;
    longitude = gei('longitude').value;
    setCoordinate = true;
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

function resetRotation() {
    rotation = defaultRotation;
    drawScene();
}

// Fired when coordinate system changes
function corSysToEqu() {
    gei('equ-cor-label').setAttribute('now', 'active');
    gei('hor-cor-label').setAttribute('now', 'disabled');
}
function corSysToHor() {
    gei('equ-cor-label').setAttribute('now', 'disabled');
    gei('hor-cor-label').setAttribute('now', 'active');
}