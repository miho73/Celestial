function gei(id) {
    return document.getElementById(id);
}

var configJson;

function saveConfig() {
    localStorage.setItem('config', JSON.stringify(configJson));
}

window.addEventListener("load", function() {
    try {
        // Load configuration
        var config = this.localStorage.getItem('config');
        if(config == null) {
            this.localStorage.setItem('config', JSON.stringify(
                {
                    view: {
                        horizon: true,
                        equator: true,
                        meridian: true,
                        star: true
                    },
                    coordinate: [-1, -1]
                }
            ));
            config = this.localStorage.getItem('config');
        }
        configJson = JSON.parse(config);
        gei('enable-horizon').checked = configJson.view.horizon;
        gei('enable-equator').checked = configJson.view.equator;
        gei('enable-meridian').checked = configJson.view.meridian;
        gei('enable-star').checked = configJson.view.star;
        if(configJson.coordinate[0] != -1 && configJson.coordinate[1] != -1) {
            latitude = gei('latitude').value = configJson.coordinate[0];
            longitude = gei('longitude').value = configJson.coordinate[1];
            setCoordinate = true;
        }
        showHorizon = configJson.view.horizon;
        showEquator = configJson.view.equator;
        showMeridian = configJson.view.meridian;
        showStar = configJson.view.star;

        // Init WebGL
        sq = Math.min(this.window.innerWidth, this.window.innerHeight);
        canvas = gei('univers');
        canvas.width = sq;
        canvas.height = sq;
        webGLStart();

        // Register events
        window.addEventListener("resize", function() {
            sq = Math.min(this.window.innerWidth, this.window.innerHeight);
            gei('univers').width = sq;
            gei('univers').height = sq;
            drawScene();
        });
        
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

        // START!
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

var mouseDown = false;
var prevMouseLocation = [];
const sensitivity = 1;

let latitude, longitude;

function updateCoordinate() {
    latitude = gei('latitude').value;
    longitude = gei('longitude').value;
    configJson.coordinate = [latitude, longitude];
    saveConfig();
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

function resetConfig() {
    localStorage.clear();
    location.reload();
}
function configCheckboxChange(config) {
    switch(config) {
        case 'view.horizon':
            showHorizon = gei('enable-horizon').checked;
            configJson.view.horizon = showHorizon;
            break;
        case 'view.equator':
            showEquator = gei('enable-equator').checked;
            configJson.view.equator = showEquator;
            break;
        case 'view.meridian':
            showMeridian = gei('enable-meridian').checked;
            configJson.view.meridian = showMeridian;
            break;
        case 'view.star':
            showStar = gei('enable-star').checked;
            configJson.view.star = showStar;
            break;
        default:
            throw 'Config '+config+' was not found.';
    }
    saveConfig();
    drawScene();
}