import csv
import json
import requests


def get_position(city_name):
    r = requests.get(f'http://restapi.amap.com/v3/geocode/geo?address={city_name}&key=be469f6ae0c3efd52ac6faecfe3e21ae')
    print(city_name)
    if r.json()['geocodes']:
        lon, lat = map(float, r.json()['geocodes'][0]['location'].split(','))
        return [lon, lat]
    return


def get_all_city_position():
    cities = set()
    city_locations = {}

    with open("./data.csv", 'r', encoding="utf-8") as f:
        reader = csv.reader(f)
        for year, date, city_name, content, shown_date in reader:
            cities.add(city_name.strip())

    for city in cities:
        city_locations[city] = get_position(city)

    return city_locations

#city_locations = get_all_city_position()
city_locations = {'基隆': [121.753, 25.097], '东京': [139.7452, 35.65874], '名古屋': [136.91035, 35.18117], '广州': [113.264434, 23.129162], '北京': [116.407526, 39.90403], '济南': [117.119999, 36.651216], '台北': [121.52, 25.0349], '昆明': [102.832891, 24.880095], '苏州': [120.585315, 31.298886], '昭通': [103.717465, 27.338257], '重庆': [106.551556, 29.563009], '贵阳': [106.630153, 26.647661], '杭州': [120.15507, 30.274084], '横滨': [139.63785, 35.4342], '长沙': [112.938814, 28.228209], '青岛': [120.382639, 36.067082], '肇庆': [112.465091, 23.047191], '香港': [114.173355, 22.320047], '无锡': [120.31191, 31.491169], '乐山': [103.765572, 29.552107], '南京': [118.796877, 32.060255], '奉天': [123.431474, 41.805698], '槟城': [100.26949, 5.4244], '长春': [125.323544, 43.817071], '上海': [121.473701, 31.230416], '武汉': [114.305392, 30.593098], '神户': [135.19551, 34.69008], '天津': [117.200983, 39.084158], '怀化': [109.998488, 27.554978], '京都': [135.7519, 35]}
print(city_locations)

assert len(set(city_locations.keys())) == len(set(map(tuple, city_locations.values())))
print([city for city, location in city_locations.items() if location is None])


data = []


with open("./data.csv", 'r', encoding="utf-8") as f:
    reader = csv.reader(f)
    for year, date, city_name, content, shown_date in reader:
        city_name = city_name.strip()
        content = content.strip()

        mm, dd = map(int, date.split('.'))
        date = f'{mm:02}-{dd:02}'

        if '年' in shown_date:
            shown_date = shown_date[1:]
        elif '.' in shown_date:
            print(shown_date)
            mm, dd = shown_date.split('.')
            shown_date = f'{mm}月{dd}日'

        data.append({
            'date': f'{year}-{date}', 
            'shown_date': f'{year}年{shown_date}',
            'position': city_locations[city_name],
            'city': city_name,
            'person': '章太炎',
            'content':content})


with open('./data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f)
