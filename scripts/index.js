let markers = [];
let marker_texts = [];
let event_i = 0;
let play_paused = false;
let play_call_time = 0;
let on_path = false;
let data;
const path_time = 2000; // (ms)

const map = new AMap.Map('container', {
  resizeEnable: true,
  center: [116.397428, 39.90923],
  zoom: 5,
  zIndex: 0
});

const addMarker = (position, city, event_count, detailed_content) => {
  const marker = new AMap.Marker({
    position: position,
    clickable: true
  });

  const markerContent = document.createElement('div');
  markerContent.className = 'marker_content';

  const markerImg = document.createElement('img');
  markerImg.className = 'markerlnglat';
  markerImg.src = './assets/img/marker_blue.png';
  markerContent.appendChild(markerImg);

  const markerText = document.createElement('div');
  markerText.className = 'marker_text';
  markerText.innerHTML = '<strong>' + city + '</strong><br/>在此期间共有' + String(event_count) + '个事件';
  markerText.style.display = 'none';
  markerContent.appendChild(markerText);
  marker_texts.city = city;
  marker_texts.push(markerText);

  marker.setContent(markerContent);
  marker.id = 'marker' + city;

  marker.event_count = event_count;
  marker.setMap(map);

  AMap.event.addListener(marker, 'click', (e) => {
    content.innerHTML = detailed_content;
    for (text of marker_texts) {
      if (text !== markerText) {
        text.style.display = 'none';
      } else {
        text.style.display = text.style.display === 'none' ? 'block': 'none';
        content.style.display = text.style.display;
      }
    }
  }, false);

  markers.push(marker);
};

const addTextMarker = (event) => {
  const {
    date,
    shown_date,
    position,
    city,
    person,
    content: event_content
  } = event;

  const marker = new AMap.Marker({
    position: position
  });

  refresh();
  const markerContent = document.createElement('div');
  markerContent.className = 'marker_content';

  const markerImg = document.createElement('img');
  markerImg.className = 'markerlnglat';
  markerImg.src = './assets/img/marker_blue.png';
  markerContent.appendChild(markerImg);

  const markerText = document.createElement('div');
  markerText.className = 'marker_text';
  markerText.innerHTML = shown_date + ' <strong>' + city + '</strong><br/>' + event_content;
  markerContent.appendChild(markerText);

  marker.setContent(markerContent);

  marker.city = city;
  marker.setMap(map);
  markers.push(marker);

  content.innerHTML = '<p>' + markerText.innerHTML + '</p>';
  content.style.display = 'block';
};

// clear all markers.
const refresh = () => {
  content.innerHTML = '';
  for (let marker of markers) {
    if (marker) {
      marker.setMap(null);
      marker = null;
    }
  }

  markers = [];
  marker_texts = [];
};

// initialize
const init = async () => {
  data = (await fetch(`${window.location.href}/data.json`, {method: 'GET'})
    .then(res => res.json())
    .then(resJson => resJson.map(event => ({ ...event, date: new Date(event.date) }))))
  .sort((a, b) => (a.date > b.date ? 1 : -1));
  const city_positions = {};
  const city_event_count = {};
  const detailed_content = {};

  for (let event of data) {
    const city = event.city;
    city_positions[city] = event.position;
    if (city_event_count[city]) {
      ++city_event_count[city];
    } else {
      city_event_count[city] = 1;
    }
    if (detailed_content[city]) {
      detailed_content[city] += '<p>' + '[' + city_event_count[city] + '] ' + event.shown_date + ' <strong>' + city + '</strong><br/>' + event.content + '</p>';
    } else {
      detailed_content[city] = '<p>' + '[' + city_event_count[city] + '] ' + event.shown_date + ' <strong>' + city + '</strong><br/>' + event.content + '</p>';
    }
  }

  for (let city in city_positions) {
    addMarker(city_positions[city], city, city_event_count[city], detailed_content[city]);
  }
};

init();

const delay = (time) => {
  return new Promise(resolve => setTimeout(resolve, time));
};


const getDateFromText = () => {
  const begin_date = document.getElementById('begin_date').value;
  const end_date = document.getElementById('end_date').value;

  return [new Date(begin_date ? begin_date : '1800-01-01'), new Date(end_date ? end_date : '2100-01-01')];
};


const drawPath = async (A, B) => {
  if (A.city === B.city) {
    return;
  }
  on_path = true;
  const [Ax, Ay] = A.position;
  const [Bx, By] = B.position;
  const Alnglat = new AMap.LngLat(Ax, Ay);
  const Blnglat = new AMap.LngLat(Bx, By);

  pathSimplifierIns.setData([{
    path: [
      Alnglat,
      Blnglat
    ]
  }]);

  const path_speed = Alnglat.distance(Blnglat) * 3600 / (path_time - 200);

  let navg1 = pathSimplifierIns.createPathNavigator(0, {
    loop: false,
    speed: path_speed
  });

  navg1.start();
  await delay(path_time);

  pathSimplifierIns.clearPathNavigators();
  on_path = false;
};


const prevEvent = async () => {
  if (event_i <= 1) {
    return;
  }

  refresh();
  if (event_i > 1 && event_i <= data.length) {
    await drawPath(data[event_i - 1], data[event_i - 2]);
  }

  --event_i;
  const event = data[event_i - 1];
  addTextMarker(event);
};


const nextEvent = async () => {
  if (event_i >= data.length - 1) {
    return;
  }

  refresh();
  if (event_i > 0 && event_i < data.length) {
    await drawPath(data[event_i - 1], data[event_i]);
  }

  const event = data[event_i++];
  addTextMarker(event);
};


const startPlay = async (current_time) => {
  const [begin, end] = getDateFromText();
  play_paused = false;
  document.getElementById('pause').value = '暂停';

  while (current_time === play_call_time && !play_paused && data[event_i].date <= end) { // only last play execute.
    await nextEvent();
    await delay(2000);
  }
};


const pausePlay = () => {
  play_paused = true;
  document.getElementById('pause').value = '继续';
};


AMap.event.addDomListener(document.getElementById('query'), 'click', () => {
  pausePlay();
  refresh();
  const [begin, end] = getDateFromText();

  const city_positions = {};
  const city_event_count = {};
  const detailed_content = {};

  for (const event of data) {

    // if date in order
    if (event.date > end) {
      break;
    }

    if (begin <= event.date) {
      const city = event.city;
      city_positions[city] = event.position;
      if (city_event_count[city]) {
        ++city_event_count[city];
      } else {
        city_event_count[city] = 1;
      }
      if (detailed_content[city]) {
        detailed_content[city] += '<p>' + '[' + city_event_count[city] + '] ' + event.date.toLocaleDateString() + ' <strong>' + city + '</strong><br/>' + event.content + '</p>';
      } else {
        detailed_content[city] = '<p>' + '[' + city_event_count[city] + '] ' + event.date.toLocaleDateString() + ' <strong>' + city + '</strong><br/>' + event.content + '</p>';
      }
    }
  }

  for (let city in city_positions) {
    addMarker(city_positions[city], city, city_event_count[city], detailed_content[city]);
  }
}, false);

AMap.event.addDomListener(document.getElementById('play'), 'click', () => {
  let a = -1;
  const [begin, end] = getDateFromText();

  for (let i = 0; i < data.length; ++i) {
    const event = data[i];

    if (event.date >= begin && a === -1) {
      a = i;
      break;
    }
  }

  event_i = a;
  startPlay(++play_call_time);
}, false);

AMap.event.addDomListener(document.getElementById('pause'), 'click', () => {
  const pause_button = document.getElementById('pause');
  if (play_paused) {
    startPlay(++play_call_time);
  } else {
    pausePlay();
  }
}, false);

AMap.event.addDomListener(document.getElementById('prev'), 'click', () => {
  pausePlay();
  if (!on_path) {
    prevEvent();
  }
}, false);

AMap.event.addDomListener(document.getElementById('next'), 'click', () => {
  pausePlay();
  if (!on_path) {
    nextEvent();
  }
}, false);

AMapUI.load(['ui/misc/PathSimplifier'], (PathSimplifier) => {
  if (!PathSimplifier.supportCanvas) {
    alert('当前环境不支持 Canvas！');
    return;
  }

  const emptyLineStyle = {
    lineWidth: 0,
    fillStyle: null,
    strokeStyle: null,
    borderStyle: null
  };

  const pathSimplifierIns = new PathSimplifier({
    zIndex: 300,
    autoSetFitView: false,
    map: map,
    getPath: (pathData, pathIndex) => {
      return pathData.path;
    },
    getHoverTitle: (pathData, pathIndex, pointIndex) => {
      return null;
    },
    renderOptions: {
      pathLineStyle: emptyLineStyle,
      pathLineSelectedStyle: emptyLineStyle,
      pathLineHoverStyle: emptyLineStyle,
      keyPointStyle: emptyLineStyle,
      startPointStyle: emptyLineStyle,
      endPointStyle: emptyLineStyle,
      keyPointHoverStyle: emptyLineStyle,
      keyPointOnSelectedPathLineStyle: emptyLineStyle
    }
  });

  window.pathSimplifierIns = pathSimplifierIns;
});