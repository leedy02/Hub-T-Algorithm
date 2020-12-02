const {GPS}=require('./gps');
const dbUserLand = require('../../db/user_land');

class destination{
    constructor(id,total_dist,cost,depar_x,depar_y,dest_x,dest_y,route){
        
        this.id = id;
        
        this.dist = total_dist;

        this.cost = cost;

        this.current = new GPS(depar_x,depar_y);

        this.destination = new GPS(dest_x,dest_y);

        this.route = route;

        this.land = GPS.getLand(this.current);

        this.state = "WAIT";

        dbUserLand.insertUserLand(this.id,this.land);
    }
}

module.exports = {destination};