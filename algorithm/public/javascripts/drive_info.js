const dbDriveInfo = require("../../db/drive_info");
const dbUserLand = require("../../db/user_land");
const candidate = require("../../routes/algorithm.js");
const { GPS } = require('./gps');
var fs = require('fs');
const { Customer } = require("./customer");

class DriveInfo {
    static #id = 1;

    constructor(taxi, customer) {
        this.id = DriveInfo.#id++;

        // 택시
        this.taxi = taxi;

        // 고객 구분 host, guest
        this.customer = {
            host: customer, guest: null
        }

        // 운행 시작시간 : 최초 승객이 탑승했을 경우에 제작할 예정
        this.start_time = new Date();

        // 종료시간 : 택시 운행 마감 확인
        this.end_time = null;

        // 택시비
        this.cost = 0;

        // 거리
        this.distance = 0;

        // 합승 waypoint
        this.waypoint = this.taxi.waypoint;

        // 합승 경로
        this.route = this.taxi.route;

        // taxi가 최종적으로 갈 목적지 host, guest 목적지 중 하나
        this.final_destination = {
            latitude: customer.destination.latitude,
            longitude: customer.destination.longitude
        }

    }
    //

    //algorithm으로 구한 후보자 그 중 최종 후보자 = join_customer로 선언, 해당 join_customer의 홀수 값은 [id, route] 형식, route의 경우 json.parse 해줘야 함
    //50%의 확률로 합승 진행 -> 3번 거절시 합승 안함   
    async join(customer_id,num) {
        console.log(num,"번 알고리즘 합승 호출");
        var join_candidate = await candidate.candidates_and_route(customer_id, num);
        join_candidate = join_candidate[0];
        return join_candidate;
    }

}



module.exports = { DriveInfo }