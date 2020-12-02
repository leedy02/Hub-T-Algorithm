const dbConnection = require('../config/database');
const { GPS } = require('../public/javascripts/gps');
const getQuery = require('./query');

module.exports = {
    insertUserLand : function(id,land){
        dbConnection((conn)=>{
            conn.query(getQuery.insertUserLand,[id,land],function(err,rows){
                if(err){
                    throw err
                }
                else{
                    console.log(id," land 삽입");
                }
            })
        })
    }
}