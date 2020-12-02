const { GPS } = require("./gps");

class Taxi {
    static #id = 1;
    #interval = null;
    constructor() {
        this.id = Taxi.#id++;

        this.current = current != nul ? current : GPS.getRandomValue();

        this.destination = null;

        this.waypoint = [];

        this.route = null;

        this.index = 0;

        this.velocity = 0;

        this.state = "STOP"
    }

    async setDestination(destination) {
        // drive 중지 및 waypoint 초기화
        this.state = "STOP";
        clearInterval(this.#interval);
        this.waypoint = [];
        this.destination = destination;
        //customer가 없을때는 route를 새로 설정
        if (this.customer.length == 0) {
            const data = await GPS.getRoute(this.current, this.destination);
            this.waypoint = data.waypoint;
            this.route = data.route;
        }
        else {
            //customer가 있을 때 상태가 MATCH이면 현재 위치로 부터 고객의 위치로 경로 설정
            if (this.customer[0].state == "MATCH") {
                const data = await GPS.getRoute(this.current, this.destination);
                this.waypoint = data.waypoint;
                this.route = data.route;

            } else {
                //상태가 RIDE 일 경우 기존의 customer route를 사용
                this.route = this.customer[0].route
                this.waypoint = GPS.getWayPoint(this.route);
            }
        }
    }

    drive() {
        clearInterval(this.#interval);
        this.state = "DRIVE";
        // update per seconds
        this.#interval = setInterval(async () => {
            try {
                var delta = this.velocity * (updateInterval / 1000);
                while (delta != 0) {
                    // waypoint 끝 도달시 drive 종료.
                    if (this.index == this.waypoint.length) {
                        clearInterval(this.#interval);
                        this.index =0;
                        this.state = "STOP";
                        return;
                    }
                    const distance = GPS.getDistance(this.current, this.waypoint[this.index]);
                    // 이동 거리가 다음 waypoint 거리보다 작다면
                    if (distance >= delta) {
                        this.current.latitude += (this.waypoint[this.index].latitude - this.current.latitude) * delta / distance;
                        this.current.longitude += (this.waypoint[this.index].longitude - this.current.longitude) * delta / distance;
                        delta = 0;
                    }
                    // 이동 거리가 다음 waypoint 거리보다 크다면
                    else {
                        this.current = this.waypoint[this.index++];
                        delta -= distance;
                    }
                }
            } catch (e) {
                clearInterval(this.#interval);
                this.state = "STOP";
                this.index =0;
                console.log(e);
            }

            if (this.customer.length != 0) {
                var dbtaxiCurLoc = this.updateCurLoc();
                await dbDriveInfo.updateDriveInfoCurLoc(dbtaxiCurLoc);
            }
        }, updateInterval);
    }
}

module.exports = { taxi };