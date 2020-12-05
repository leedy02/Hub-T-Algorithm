import requests
import time
import math
import json
import sys
import math
from scipy.spatial import distance
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))
from config import dbconfig
from config import t_config

conn = dbconfig.sql_controller()
t_api = t_config.tmap_api()

#마지막에 반환해줄 dictionary
ret = {'first_candidate' : [], 'second_candidate' : [], 'third_candidate' : [], 'last_candidate' : [], 'destination' : [], 'rate' : []}
def measure(start, end) :
    a = (start[0] - end[0]) * 111
    b = (start[1] - end[1]) * 88
    return math.sqrt(a*a+b*b);

def xy_to_land(xy):
    x = int(xy[0]*100)
    y = int(xy[1]*100)
    return x*10000+y


def dist(a):
    return math.sqrt(a[0]*a[0]+a[1]*a[1])


def ip1(a, b):
    return a[0]*b[0] + a[1]*b[1]


def ip2(a, b):
    return dist(a) * dist(b)

dx=[-1,-1,-1,0,0,0,1,1,1]
dy=[1,0,-1,1,0,-1,1,0,-1]


def first_candidate(host_id):
    land_num_set = set()
    first_candidate_arr = []
    host_route = conn.select_route(id=host_id)
    host_route = json.loads(host_route[0][0])
    #host_route가 지나는 point들의 land값을 land_num_arr에 모아둔다.
    for i in host_route['features']:
        if i['geometry']['type'] != 'Point':
            continue
        land_num = xy_to_land(i['geometry']['coordinates'])
        for j in range(9):
            land_num_set.add(land_num+(dx[j]*10000+dy[j]))
        
    #land_num_arr에 저장돼있는 land값을 이용하여 user_land테이블에서 가져온 user_id들을 1차후보군으로 선정한다.
    candidate = conn.select_land(land_num_arr=list(land_num_set))
    for i in candidate:
        chk = conn.select_d([i])
        if len(chk) == 0:
            continue
        ret['first_candidate'].append(i[0])
        first_candidate_arr.append(i[0])
    if len(first_candidate_arr) == 0:
        print(json.dumps(ret))
        return
    # 직선경로 알고리즘, 벡터각 알고리즘, 직선경로 가중치 알고리즘에서 선택.
    second_candidate(host_id,first_candidate_arr)


def chk_pref(a_prof, a_pref, b_prof, b_pref):
    return a_pref[0] <= b_prof[0] <= a_pref[1] and b_pref[0] <= a_prof[0] <= b_pref[1] and (a_pref[2] == 'O' or a_pref[2] == b_prof[1]) and (b_pref[2] == 'O' or b_pref[2] == a_prof[1])


def second_candidate(host_id, candidate_arr):
    second_candidate_arr = []
    host_prefer = conn.select_prefer([host_id,host_id])[0]
    host_profile = conn.select_profile([host_id,host_id])[0]
    guest_prefer = conn.select_prefer(candidate_arr)
    guest_profile = conn.select_profile(candidate_arr)
    for i in range(len(candidate_arr)):
        if chk_pref(host_profile, host_prefer, guest_profile[i], guest_prefer[i]) == True:
            ret['second_candidate'].append(candidate_arr[i])
            second_candidate_arr.append(candidate_arr[i])
    if len(second_candidate_arr) == 0:
        print(json.dumps(ret))
        return
    if sys.argv[2] == 1 or sys.argv[2] == '1':
        third_candidate_1(host_id, second_candidate_arr)
    elif sys.argv[2] == 2 or sys.argv[2] == '2':
        third_candidate_2(host_id, second_candidate_arr)
    elif sys.argv[2] == 3 or sys.argv[2] == '3':
        third_candidate_weight_1(host_id, second_candidate_arr)


def third_candidate_1(host_id, candidate_arr):
    third_candidate_arr = []
    host_d = conn.select_d_from_drive_info(host_id)[0]
    host_s = [host_d[0],host_d[1]]
    host_e = [host_d[2],host_d[3]]
    host_dist = measure(host_s,host_e)
    guest_d = conn.select_d(candidate_arr)
    mn = 1000
    for i in range(len(guest_d)):
        guest_s = [guest_d[i][0],guest_d[i][1]]
        guest_e = [guest_d[i][2], guest_d[i][3]]
        guest_dist = measure(guest_s,guest_e)
        dist_sum = measure(host_s, guest_s) + measure(host_e, guest_e) + min(measure(guest_s, host_e), measure(guest_s, guest_e))
        if dist_sum <= 1.0*(host_dist+guest_dist):
            mn = min(mn,dist_sum/(host_dist+guest_dist))
            third_candidate_arr.append(candidate_arr[i])
    if len(third_candidate_arr) == 0:
        print(json.dumps(ret))
        return
    last_candidate(host_id,third_candidate_arr)


def third_candidate_2(host_id, candidate_arr):
    third_candidate_arr = []
    host_d = conn.select_d_from_drive_info(host_id)[0]
    host_s = [host_d[0], host_d[1]]
    host_e = [host_d[2], host_d[3]]
    host_v = [host_e[0] - host_s[0], host_e[1] - host_s[1]]
    guest_d = conn.select_d(candidate_arr)
    for i in range(len(candidate_arr)):
        guest_s = [guest_d[i][0], guest_d[i][1]]
        guest_e = [guest_d[i][2], guest_d[i][3]]
        guest_v = [guest_e[0] - guest_s[0], guest_e[1] - guest_s[1]]
        if ip1(host_v,guest_v)/ip2(host_v,guest_v) > math.sqrt(2)/2:
            third_candidate_arr.append(candidate_arr[i])
    if len(third_candidate_arr) == 0:
        print(json.dumps(ret))
        return
    last_candidate(host_id, third_candidate_arr)

def weight_dist(depar, dest):
    a = (depar[0] - dest[0])/measure(depar,dest)
    b = (depar[1] - dest[1])/measure(depar,dest)
    a /= 100
    b /= 100
    return [a,b]

def third_candidate_weight_1(host_id, candidate_arr):
    third_candidate_arr = []
    host_d = conn.select_d_from_drive_info(host_id)[0]
    host_s = [host_d[0], host_d[1]]
    host_e = [host_d[2], host_d[3]]
    host_dist = measure(host_s, host_e)
    guest_d = conn.select_d(candidate_arr)
    mn = 1000
    for i in range(len(guest_d)):
        guest_s = [guest_d[i][0], guest_d[i][1]]
        guest_e = [guest_d[i][2], guest_d[i][3]]
        guest_dist = measure(guest_s, guest_e)
        dist_sum = measure(host_s, guest_s) + measure(host_e, guest_e) + min(measure(guest_s, host_e),
                                                                             measure(guest_s, guest_e))
        if dist_sum <= 1.0 * (host_dist + guest_dist):
            mn = min(mn, dist_sum / (host_dist + guest_dist))
            third_candidate_arr.append(candidate_arr[i])
    if len(third_candidate_arr) == 0:
        print(json.dumps(ret))
        return
    last_candidate(host_id, third_candidate_arr)

def last_candidate(host_id, candidate_arr):
    host_route = json.loads(conn.select_route(host_id)[0][0])
    host_cost = host_route['features'][0]['properties']['taxiFare']
    host_d = conn.select_d_from_drive_info(host_id)[0]
    min_cost_rate = 10.0
    min_cost = 0
    min_guest_cost = 0
    last_candidate = '0'
    id_route = []
    guest_d_arr = conn.select_d(candidate_arr)
    for guest_d in guest_d_arr:
        guest_id = guest_d[5]
        guest_route = json.loads(conn.select_route_from_destination(guest_id)[0][0])
        guest_cost = guest_route['features'][0]['properties']['taxiFare']
        bypass_route = t_api.bypass_route(host_d[0], host_d[1], guest_d[2], guest_d[3], guest_d[0],guest_d[1], host_d[2], host_d[3])

        destination = [guest_d[2], guest_d[3]]
        bypass_route_2 = t_api.bypass_route(host_d[0], host_d[1], host_d[2], host_d[3], guest_d[0],guest_d[1], guest_d[2], guest_d[3])
        if 'features' not in bypass_route or 'features' not in bypass_route_2:
            continue
        if bypass_route['features'][0]['properties']['taxiFare'] > bypass_route_2['features'][0]['properties']['taxiFare']:
            bypass_route = bypass_route_2
            destination = [host_d[2], host_d[3]]
        bypass_cost = bypass_route['features'][0]['properties']['taxiFare']
        #print(bypass_route)
        if len(bypass_route['features']) < 4:
            continue
        bypass_route['features'].pop()
        bypass_route['features'].pop()
        bypass_route['features'].pop()
        bypass_route['features'].pop()
        ret['third_candidate'].append([guest_id,guest_route,bypass_route])
        if bypass_cost / (host_cost+guest_cost) < min_cost_rate:
            min_cost_rate = bypass_cost / (host_cost+guest_cost)
            ret['last_candidate'] = [guest_id, bypass_route]
            ret['destination'] = destination
            min_cost = bypass_cost
            min_guest_cost = guest_cost
            #print(bypass_cost,min_cost_rate)
    #print(min_cost_rate)
    ret['rate'] = min_cost_rate
    print(json.dumps(ret))

#first_candidate('7')
first_candidate(sys.argv[1])
