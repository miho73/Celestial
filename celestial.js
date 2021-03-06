function gei(id) {
    return document.getElementById(id);
}

function getDayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = date - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
}
/***********************************************/

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
                        star: true,
                        sun: true
                    },
                    coordinate: [-1, -1],
                    datetime: ''
                }
            ));
            config = this.localStorage.getItem('config');
        }
        configJson = JSON.parse(config);
        gei('enable-horizon').checked = configJson.view.horizon;
        gei('enable-equator').checked = configJson.view.equator;
        gei('enable-meridian').checked = configJson.view.meridian;
        gei('enable-star').checked = configJson.view.star;
        gei('enable-sun').checked = configJson.view.sun;
        if(configJson.coordinate[0] != -1 && configJson.coordinate[1] != -1) {
            latitude = gei('latitude').value = configJson.coordinate[0];
            longitude = gei('longitude').value = configJson.coordinate[1];
            setCoordinate = true;
        }
        if(configJson.datetime != '') {
            gei('datetime').value = configJson.datetime;
            date = new Date(configJson.datetime);
            secOfDay = date.getSeconds() + 60 * (date.getMinutes() + 60 * date.getHours());
            setDatetime = true;
        }
        showHorizon = configJson.view.horizon;
        showEquator = configJson.view.equator;
        showMeridian = configJson.view.meridian;
        showStar = configJson.view.star;
        showSun = configJson.view.sun;

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
        window.addEventListener("touchstart", function(event) {
            prevMouseLocation = [event.pageX, event.pageY];
            mouseDown = true;
	    });
        window.addEventListener("mouseup", function() {
            prevMouseLocation = []
            mouseDown = false;
        });
        window.addEventListener("touchend", function(event) {
            prevMouseLocation = [];
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
        window.addEventListener("touchmove", function(event) {
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
function updateDatetime() {
    datetimeTxt = gei('datetime').value;
    configJson.datetime = datetimeTxt;
    saveConfig();

    date = new Date(datetimeTxt);
    dayOfYear = getDayOfYear(date);
    if(dayOfYear < SPRING_EQUINOX || WINTER_SOLSTICE <= dayOfYear) {
        console.log("SPRING");
    }
    else if(dayOfYear < SUMMER_SOLSTICE) {
        console.log("SUMMER");
    }
    else if(dayOfYear < AUTUMN_EQUINOX) {
        console.log("AUTUMN");
    }
    else if(dayOfYear < WINTER_SOLSTICE) {
        console.log("WINTER");
    }
    secOfDay = date.getSeconds() + 60 * (date.getMinutes() + 60 * date.getHours());
    setDatetime = true;
}

function enterCoordinateHere() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateGps);
    }
    else {
        alert("?????????????????? ????????? ??? ?????????.")
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
        case 'view.sun':
            showSun = gei('enable-sun').checked;
            configJson.view.sun = showSun;
            break;
        default:
            throw 'Config '+config+' was not found.';
    }
    saveConfig();
    drawScene();
}