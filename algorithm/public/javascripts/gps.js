var axios;
var tmap;
try{
    axios = require('axios');
    tmap = require('../../config/tmap.json')
}
catch(e){

}

class GPS {
    static #boundary = {
        start: new GPS(37.3483704457075, 126.61211735599368),
        end: new GPS(37.609012804993775,126.78001465019845)
    }
    constructor(latitude,longitude){

        this.latitude = latitude;
        
        this.longitude = longitude;

    }
    static getRandomValue() {
        // 경계 지정 해줘야 함. 산이나 바다도 거를 수 있다면 걸러야 함.
        const latitude = GPS.#boundary.start.latitude + (GPS.#boundary.end.latitude - GPS.#boundary.start.latitude) * Math.random();
        const longitude = GPS.#boundary.start.longitude + (GPS.#boundary.end.longitude - GPS.#boundary.start.longitude) * Math.random();
        return new GPS(latitude, longitude);
    }
    static getDistance(start, end) {
        const R = 6371e3; // metres
        const φ1 = start.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = end.latitude * Math.PI / 180;
        const Δφ = (end.latitude - start.latitude) * Math.PI / 180;
        const Δλ = (end.longitude - start.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }
    
    //점과 점사이의 거리 longitude 1도에 111km latitdue 1도에 88.8km 
    static getCurDistance(current,client) {
        return Math.sqrt(Math.pow(Math.abs(client.longitude - current.longitude)*111, 2) + Math.pow(Math.abs(client.latitude - current.latitude)*88.8, 2))
    }

    static getLand(position) {
        return parseInt(position.latitude * 100) + parseInt(position.longitude * 100) * 36000;
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


