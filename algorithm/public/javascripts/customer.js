const {GPS}=require('./gps');

class Customer{
    constructor(id,total_dist,cost,depar_x,depar_y,dest_x,dest_y,route){
        
        this.id = id;
        
        this.dist = total_dist;

        this.cost = cost;

        this.current = new GPS(depar_y,depar_x);

        this.destination = new GPS(dest_y,dest_x);

        this.route = route;

        this.land = GPS.getLand(this.current);

        //상태 MATCH, RIDE, WAIT, ARRIVE
        this.state = "WAIT";
    }

    host(data){
        this.current = data.start;
        this.destination = data.end;
        this.state = "MATCH";
    }
}

module.exports = {Customer};