const mysql = require('mysql');
const dbConnection = require('../config/database');
const getQuery = require('./query')

module.exports ={
    //최초 drive info 삽입
    insertDriveInfo: async function (drive_info) {
        var taxi = drive_info.taxi;
        var customer = drive_info.customer;
        dbConnection((conn) => {
            conn.query(getQuery.insertDriveInfo, [drive_info.id, taxi.id, customer.host.id, null,
            JSON.stringify(taxi.route), drive_info.start_time, drive_info.end_time, 0, drive_info.distance, drive_info.cost,
            taxi.current.longitude, taxi.current.latitude, drive_info.final_destination.longitude, drive_info.final_destination.latitude], function (err, rows) {
                if (err) {
                    throw err;
                }
                else {
                    console.log(drive_info.id, " drive_info 삽입 성공")
                }
            })
            conn.release();
        })
    },
    //drive_info 업데이트 -> taxi의 current 좌표 불러옴 
    updateDriveInfoCurLoc: async function(taxi){
        var taxi_id = taxi.id;
        var cur = taxi.current;
        dbConnection((conn)=>{
            conn.query(getQuery.updateDriveInfoCurLoc,[cur.longitude,cur.latitude,taxi_id],function(err,rows){
                if(err){
                    throw err;
                }
                else{
                    //console.log("update drive_info current location")
                }
            })
            conn.release();
        })
    },
    // 앞으로의 합승을 거절하는 no search
    updateDriveInfoNoSearch: async function(drive_id){
        dbConnection((conn)=>{
            conn.query(getQuery.updateDriveInfoNoSearch,[1,drive_id],function(err,rows){
                if(err){
                    throw err;
                }
                else{
                    console.log(drive_id, ' 앞으로의 합승 거절');
                }
            })
            conn.release();
        })
    },
    //합승시에 drive_info 값 업데이트
    updateDriveInfo: async function(drive_info){
        dbConnection((conn)=>{
            conn.query(getQuery.updateDriveInfo,[drive_info.customer.guest.id,JSON.stringify(drive_info.route),drive_info.distance,drive_info.cost,
                drive_info.final_destination.longitude,drive_info.final_destination.latitude,drive_info.id],function(err,rows){
                if(err){
                    throw err;
                }
                else{
                    console.log(drive_info.id, ' drive_info 업데이트');
                }
            })
            conn.release();
        })
    },
    //drive_info 초기화
    deleteDriveInfo: function (callback) {
        dbConnection((conn) => {
            conn.query(getQuery.deleteDriveInfo, function (err, rows) {
                if (err) {
                    throw err;
                }
                else {
                    console.log("drive_info 초기화")
                    callback(null);
                }
            })
            conn.release();
        })
    },
    deleteDriveInfoCustomer: async function (customer) {
        dbConnection((conn) => {
            conn.query(getQuery.deleteDriveInfoCustomer,[customer.host,customer.host],function (err, rows) {
                if (err) {
                    throw err;
                }
                else {
                    console.log(customer.host," 운행 종료")
                }
            })
            conn.release();
        })
    }
}