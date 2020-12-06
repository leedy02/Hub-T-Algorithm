const { Taxi } = require('./public/javascripts/taxi')
var dbDestination = require('./db/destination');
var dbUserLand = require('./db/user_land');
var dbDriveInfo = require('./db/drive_info');
const { GPS } = require('./public/javascripts/gps');
var async = require('async');
const { Customer } = require('./public/javascripts/customer');
const { DriveInfo } = require('./public/javascripts/drive_info');

global.customer_list = [];
global.taxi_list = [];
global.drive_list = [];


// async function taxi_generate(callback) {
//     for (let i = 0; i < 1; i++) {
//         taxi_list.push(new Taxi())
//     }
//     callback(null);
// }

async function user_land_generate(callback) {
    // console.log(customer_list);
    for (let i = 0; i < customer_list.length; i++) {
        if (customer_list[i] != null) {
            dbUserLand.updateUserLand(customer_list[i].id, customer_list[i].land);
        }
    }
}

async.series([dbDriveInfo.deleteDriveInfo, dbDestination.selectAllDestination, user_land_generate]);

setInterval(async () => {
    taxi_list.map(async t => {
        // 택시가 멈춰있다면
        if (t.state == "STOP" && t.customer.length == 1) {
            // 택시가 승객에게 도착
            var customer = t.customer[0];
            if (customer.state == "MATCH") {
                customer.state = "RIDE"
                t.drive()
            }
            else {
                if (customer.state == "RIDE") {
                    for (let i = drive_list.length - 1; i >= 0; i--) {
                        if (t.id == drive_list[i].taxi.id) {
                            drive_list[i].end_time = new Date();
                            break;
                        }
                    }
                    customer.state = "ARRIVE"
                    t.customer = [];
                    taxi_list.pop();
                }
            }
        }
    })
}, 1000)

var alg_data = null;

module.exports = function (server) {
    var io = require('socket.io')(server);

    io.on('connection', socket => {
        console.log("connected");
        var send = false;
        const loop = setInterval(() => {
            if (!send && customer_list.length == 2489) {
                socket.emit('customer', customer_list);
                send = true;
            }
            socket.emit('taxi', taxi_list);
        }, 1000);

        //택시, 고객 생성 destination, drive_info 설정  db삽입
        socket.on("taxi", async data => {
            if (taxi_list.length == 0) {
                var taxi = new Taxi(data.start);
                await taxi.setDestination(data.end);
                var customer = new Customer(customer_list.length);
                customer.host(data);
                taxi.customer.push(customer);
                const d = new DriveInfo(taxi, customer);
                drive_list.push(d);
                await dbDriveInfo.insertDriveInfo(d)
                taxi_list.push(taxi);
                console.log("택시 삽입 완료");
            }
        })

        // true로 보내면 직접 탐색
        // false로 보내면 데이터 있을 경우 송신
        socket.on('algorithm', async data => {
            if (data) {
                var candidate = {
                    first: null,
                    second: null,
                    third: null
                }
                taxi_list[taxi_list.length - 1].driveClear();
                //알고리즘 1,2,3 호출
                candidate.first = await drive_list[drive_list.length - 1].join(taxi_list[0].customer[0].id, 1);
                candidate.second = await drive_list[drive_list.length - 1].join(taxi_list[0].customer[0].id, 2);
                candidate.third = await drive_list[drive_list.length - 1].join(taxi_list[0].customer[0].id, 3);
                if (candidate.first != null && candidate.second != null && candidate.third != null) {
                    alg_data = candidate;
                    socket.emit("candidate", candidate);
                    console.log("알고리즘 데이터 수신 완료");
                }
            }
            else{
                if(alg_data != null) {
                    socket.emit("candidate", alg_data);
                    console.log("저장된 데이터 송신")
                }
            }
        })

        socket.on('resume', data => {
            // 여기에 시작했을 때의 행동 정의
            // data는 채택한 알고리즘의 번호 (1,2,3)
            //다시 taxi 실행
            alg_data = null;
            taxi_list[0].drive();
        })

        socket.on('disconnect', socket => {
            clearInterval(loop);
            console.log("disconnected");
        })
    })

    return io;
}