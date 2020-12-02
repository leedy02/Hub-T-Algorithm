const dbConnection = require('../config/database');
const getQuery = require('./query');
const {Customer} = require('../public/javascripts/customer');

module.exports ={
    selectAllDestination : function(callback){
        dbConnection((conn)=>{
            conn.query(getQuery.selectAllDestination,function(err,rows){
                if(err){
                    throw err;
                }
                else{
                    for(let i=0;i<rows.length;i++){
                        var d = new Customer(rows[i].id,rows[i].total_dist,rows[i].cost,
                            rows[i].dest_x,rows[i].dest_y,rows[i].depar_x,rows[i].depar_y,JSON.parse(rows[i].route))
                        destination_list[rows[i].id]=d;
                    }
                    console.log("destination 다 불러옴")
                    callback(null);
                }
            })
            conn.release();
        })
    }
}