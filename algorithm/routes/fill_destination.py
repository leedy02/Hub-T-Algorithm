import json
import time
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))
from config import dbconfig
from config import t_config
if __name__ == '__main__':
    conn = dbconfig.sql_controller()
    t_api = t_config.tmap_api
    for i in range(1701, 2489):
        idx = str(i)
        rows = conn.select_d([idx])
        print(rows)
        a,b,c,d,e = rows[0]
        print(a,b,c,d)
        route = t_api.route(a=a,b=b,c=c,d=d)
        print(idx)
        print(type(idx))
        print(route)
        conn.update_route(route=json.dumps(route) ,id=idx)
        conn.update_cost(cost=route["features"][0]["properties"]["taxiFare"],id=idx)
        conn.update_total_dist(dist=route["features"][0]["properties"]["totalDistance"],id=idx)
    conn.end()