const { Taxi } = require('./public/javascripts/taxi')
var dbDestination = require('./db/destination');
var dbUserLand = require('./db/user_land');
var async = require('async');
var socket = require('')

global.customer_list = [];
global.taxi_list = [];
global.drive_list = [];

async function taxi_generate(callback) {
    for (let i = 0; i < 1; i++) {
        taxi_list.push(new Taxi())
    }
    callback(null);
}

async function user_land_generate(callback) {
    for (let i = 0; i < customer_list.length; i++) {
        if (customer_list[i] != "undefined") {
            dbUserLand.insertUserLand(customer[i].id, customer[i].land);
        }
    }
    callback(null);
}

async.series([dbDestination.selectAllDestination, user_land_generate, taxi_generate]);

setInterval(() => {
    taxi_list.map(async t => {
        // 택시가 멈춰있다면
        if (t.state == "STOP" && t.customer.length == 0) {
            // 승객이 없는 경우
            await t.setDestination(GPS.getRandomValue());
            t.drive();
        }
        else if (t.state == "STOP" && t.customer.length == 1) {
            // 택시가 승객에게 도착
            var customer = t.customer[0];
            if (customer.state == "MATCH") {
                customer.state = "RIDE"
                await t.setDestination(customer.destination);
                const d = new DriveInfo(t, customer);
                await dbDriveInfo.insertDriveInfo(d);
                drive_list.push(d);
                t.drive()
                //join 함수 호출시 횟수도 넘겨줌
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
                }
            }
        }
    })
    //
    //빈택시 잡기 -> 택시가 customer를 선택하는 것으로 바꿈
    for (t of taxi_list) {
        if (t.customer.length == 0) {
            var customer = null;
            var shortest = 10000;
            for (c of customer_list) {
                //wait 상태에 있는 것 중 가장 짧은 상태에 있는 거 가져옴
                if (c.state == "WAIT") {
                    var distance = GPS.getDistance(t.current, c.current);
                    if (shortest > distance) {
                        customer = c;
                        shortest = distance;
                    }
                }
            }
            if (customer != null) {
                customer.state = "MATCH";
                t.customer.push(customer);
                await t.setDestination(customer.current);
                t.index = 0;
                t.drive();
            }
        }
    }
}, 1000)

module.exports = function (server) {
    var io = require('socket.io')(server);

    io.on('connection', socket => {
        console.log("connected");
        const loop = setInterval(() => {
            socket.emit(customer_list)
            socket.emit(taxi_list);
        }, 1000);

        socket.on('disconnect', socket => {
            clearInterval(loop);
            console.log("disconnected");
        })
    })

    return io;
}