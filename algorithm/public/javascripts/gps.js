var axios;
var tmap;
try{
    axios = require('axios');
    tmap = require('../../config/tmap.json')
}
catch(e){

}

class GPS {

    constructor(x,y){

        this.latitude = y;
        
        this.longitude = x;

    }

    static async getRoute(current, destination){
        var waypoint = [];
        var route = null;
        await axios.post("https://apis.openapi.sk.com/tmap/routes?version=1&format=json&callback=result", {
            "startX": current.longitude,
            "startY": current.latitude,
            "endX": destination.longitude,
            "endY": destination.latitude,
            "reqCoordType": "WGS84GEO",
            "resCoordType": "WGS84GEO",
            "searchOption": "0",
            "trafficInfo": "N"
        }, {
            headers: {
                appKey: tmap.id,
            }
        }).then(resp => {
            route = resp.data;
            for (let i = 0; i < resp.data.features.length; i++) {
                if (resp.data.features[i].geometry.type != 'Point') {
                    for (let j = 0; j < resp.data.features[i].geometry.coordinates.length; j++) {
                        waypoint.push(new GPS(resp.data.features[i].geometry.coordinates[j][1], resp.data.features[i].geometry.coordinates[j][0]));
                    }
                }
            }
        }).catch(e => console.log(e));
        return { route: route, waypoint: waypoint };
    }

}

module.exports = {GPS};


