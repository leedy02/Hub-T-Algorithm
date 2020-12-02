var dbDestination = require('./db/destination');

global.destination_list = [];
global.taxi_list = [];

h();
async function h(){
    await init();
}

setInterval(()=>{
    for(let i=1;i<10;i++){
        console.log(destination_list[i])
    }
},5000)





async function init(){
    dbDestination.selectAllDestination();
}
