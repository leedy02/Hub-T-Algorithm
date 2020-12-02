const {GPS}=require('./gps');

class Customer{
    constructor(id,total_dist,cost,depar_x,depar_y,dest_x,dest_y,route){
        
        this.id = id;
        
        this.dist = total_dist;

        this.cost = cost;

        this.current = new GPS(depar_x,depar_y);

        this.destination = new GPS(dest_x,dest_y);

        this.route = route;

        this.land = GPS.getLand(this.current);

        this.state = "WAIT";
    }
}

module.exports = {Customer};