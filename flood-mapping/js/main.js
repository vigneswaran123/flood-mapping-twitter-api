var popupLayer = null;

var map = L.map('map', {editable: true}).setView([19.1263557, 72.902526], 11);

var osm_mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OSM Mapnik <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/wms', {
    layers: `twitter_data:tweet_location`,
    format: 'image/png',
    transparent: true
}).addTo(map);


// define event handler function for click events and register it
function Identify(e){   

    closePopup();
    // set parameters needed for GetFeatureInfo WMS request
    var sw = map.options.crs.project(map.getBounds().getSouthWest());
    var ne = map.options.crs.project(map.getBounds().getNorthEast());
    var BBOX = sw.x + "," + sw.y + "," + ne.x + "," + ne.y;
    var WIDTH = map.getSize().x;
    var HEIGHT = map.getSize().y;

    var X = Math.trunc(map.layerPointToContainerPoint(e.layerPoint).x);
    var Y = Math.trunc(map.layerPointToContainerPoint(e.layerPoint).y);
    // compose the URL for the request
    var URL = 'http://localhost:8080/geoserver/wms?'+
                'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&'+
                'LAYERS=twitter_data:tweet_location&QUERY_LAYERS=twitter_data:tweet_location&'+
                'BBOX='+BBOX+'&FEATURE_COUNT=1&HEIGHT='+HEIGHT+'&WIDTH='+WIDTH+'&'+
                'INFO_FORMAT=application%2Fjson&TILED=false&CRS=EPSG%3A3857&X='+X+'&Y='+Y+'';

    //send GetFeatureInfo as asynchronous HTTP request using jQuery $.ajax
    $.ajax({
        url: URL,
        dataType: "json",
        type: "GET",
        success: function(data)
        {
        if(data.features.length !== 0) {  // at least one feature returned in response
            var returnedFeature = data.features[0]; // first feature from response
            console.log(returnedFeature);

            showPopupInfo(returnedFeature);
        }
    }
    });
}
map.addEventListener('click', Identify);

//Get popup info from database
function showPopupInfo(feature){
    popupData = feature.properties;

    if(popupData.current_status == '1') current_water_status = 'Water logged';
    else current_water_status = 'Clear';

    var html = '<div id="infoHeader">'+
                    `<span>${popupData.address}</span>`+
                    `<span id="closeResults" style="position: absolute; right: 5%; cursor: pointer;" onclick="closePopup()">x</span>`+            
                '</div>'+
                '<div id="infoBody" class="infoContent">'+
                    `<div class='row'>`+
                        `<div class='column1'><b>Reported at:</b></div>`+
                        `<div class='column2'>${popupData.reported_at}</div>`+
                    `</div>`+
                    `<div class='row'>`+
                        `<div class='column1'><b>Current Status:</b></div>`+
                        `<div class='column2'>${current_water_status}</div>`+
                    `</div>`+
                    `<div class='row'>${popupData.positive_report_count} people reported this place as water logged</div>`+
                    `<div class='row'>${popupData.negative_report_count} people reported this place as clear</div>`+  
                    '<br><button class="blue-btn">Report</button>'+                
                '</div>';  
    document.getElementById('infoTab').innerHTML = html;
    document.getElementById('infoTab').style.display = 'block';

    let [x, y] = feature.geometry.coordinates;
    let [lng, lat] = proj4(proj4('EPSG:3857'), proj4('EPSG:4326'), [x, y]);
                    
    popupLayer = L.marker([lat, lng]).addTo(map);
}


function closePopup(){
    document.getElementById('infoTab').style.display = 'none';
    if(popupLayer) map.removeLayer(popupLayer);
    popupLayer = null;
}

