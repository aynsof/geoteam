var maplat1;
var maplon1;
var maplat2;
var maplon2;
var currentUserLat;
var currentUserLon;
var inAddMode = false;
var newToiletLat;
var newToiletLon;

// Setup map - Init on Melbourne
var mymap = L.map('mapid').setView([-37.8136, 144.9631], 14);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZGF2aWRtYWNjIiwiYSI6ImNqdzdpdWJzNjJmYXo0YW1tcmR6d3Q4eGUifQ.tenIEBncFs27_CkkT8kmGg'
}).addTo(mymap);

// Custom icon for current location 
var myIcon = L.icon({
    iconUrl: 'img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
    shadowUrl: 'img/marker-shadow.png',
    shadowSize: [25, 41],
    shadowAnchor: [7, 41]
});

function showCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(renderCurrentLocation);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function renderCurrentLocation(position) {
    console.log('current location is ' + position.coords.latitude + ', ' + position.coords.longitude);
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    marker = L.marker([lat, lon], { icon: myIcon }).addTo(mymap);
    marker.bindPopup("<b>You are here!</b><br/>(" + Number((lat).toFixed(3)) + "," + Number((lon).toFixed(3)) + ")");
    mymap.setView([lat, lon], 14);
}

// function readCSV() {
//     file = 'https://s3-ap-southeast-2.amazonaws.com/codebrown-data-bucket/melb2-simple.csv';
//     $.ajax({
//         url: file,
//         success: function (data) {
//             points = JSON.parse(csvJSON(data));
//             for (i = 0; i < points.length; i++) {
//                 point = points[i];
//                 L.marker([point.Latitude, point.Longitude]).addTo(mymap);
//             }
//         }
//     });
// }

// function csvJSON(csv) {
//     //console.log(csv);
//     var lines = csv.split('\r\n');
//     var result = [];
//     var headers = lines[0].split(",");
//     for (var i = 1; i < lines.length; i++) {
//         var obj = {};
//         var currentline = lines[i].split(",");
//         for (var j = 0; j < headers.length; j++) {
//             obj[headers[j]] = currentline[j];
//         }
//         result.push(obj);
//     }
//     return JSON.stringify(result);
// }

function readMapBounds() {
    bounds = mymap.getBounds();
    maplat1 = bounds._southWest.lat;
    maplon1 = bounds._southWest.lng;
    maplat2 = bounds._northEast.lat;
    maplon2 = bounds._northEast.lng;
    console.log('map = ' + maplat1 + ', ' + maplon1 + ', ' + maplat2 + ', ' + maplon2)
}

function getDataPoints() {
    readMapBounds();
    apiurl = 'https://iia6pkjjza.execute-api.ap-southeast-2.amazonaws.com/dev/';
    postData(apiurl, { "minlat": maplat1, "minlng": maplon1, "maxlat": maplat2, "maxlng": maplon2 })
        .then(data => renderPoints(data))
        .catch(error => console.error(error));
}

function postData(url = '', data = {}, returnJSON = true) {
    return fetch(url, {
        method: 'POST', 
        mode: 'cors', 
        cache: 'no-cache', 
        credentials: 'same-origin', 
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow', 
        referrer: 'no-referrer', 
        body: JSON.stringify(data), 
    })
        .then(response => (returnJSON ? response.json() : "") ); // parses JSON response into native Javascript objects 
}   

function renderPoints(points) {
    //console.log(JSON.stringify(points));
    console.log('Found ' + points.length + ' points from API');
    for (i = 0; i < points.length; i++) {
        //console.log(points[i]);
        pointcoords = JSON.parse(points[i].geoJson["S"]).coordinates;
        lon = pointcoords[0];
        lat = pointcoords[1];
        rating = Number((Math.random() * 5).toFixed(1));
        var marker = L.marker([lat, lon]).addTo(mymap);
        marker.bindPopup("<b>" + points[i].name["S"] + "</b><br/>" + points[i].address["S"] 
            + "<br/><span style='color:#8B4513;'>Rating: " + rating + " / 5</span>" 
            + "<br/><a href=\'javascript:$(\"#rateToiletModal\").modal(\"show\");\'>Rate this toilet</a>");
    }
}

mymap.on('moveend', function () {
    readMapBounds();
    //getDataPoints();
});

mymap.on('click', onMapClick);

function addNewToilet() {
    inAddMode = true;
    $('.addmsg').css('visibility', 'visible');
    $('div #mapid').css('cursor', 'crosshair');
    $('#addButton').html('Select toilet location on map');
    $('#addButton').css('background-color', '#06c');
}

function onMapClick(e) {
    console.log("Map clicked at " + e.latlng);
    if (inAddMode) {
        newToiletLat = e.latlng.lat;
        newToiletLon = e.latlng.lng;
        $('#newToiletName').val('');
        $('#newToiletAddress').val('');
        $('#addToiletModal').modal('show');
        var marker = L.marker([newToiletLat, newToiletLon]).addTo(mymap);
        marker.bindPopup("<b>New Toilet</b><br/>(" + Number((newToiletLat).toFixed(3)) + "," + Number((newToiletLon).toFixed(3)) + ")");
        inAddMode = false;
        $('div #mapid').css('cursor', 'grab');
        $('#addButton').html('Add New Toilet');
        $('#addButton').css('background-color', '#8B4513');
    }
}

function submitAddNewToilet() {
    $('#addToiletModal').modal('hide');
    apiurl = 'https://pfncvlr3zc.execute-api.ap-southeast-2.amazonaws.com/dev/'
    postData(apiurl, { "lat": newToiletLat, "lng": newToiletLon, "name": $('#newToiletName').val(), "address": $('#newToiletAddress').val() }, false)
        .then(data => null)
        .catch(error => console.error(error));

    return false;
}

function submitAddRating() {
    $('#rateToiletModal').modal('hide');
    // TODO implement API call to save rating
    return false;
}

// ONLOAD: Find user's current position
showCurrentLocation();