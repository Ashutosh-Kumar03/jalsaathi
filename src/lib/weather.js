// Open-Meteo se asli weather data (free, API key nahi chahiye)
import { todayStr } from './utils.js';

export const PAST_DAYS = 30;
export const FORECAST_DAYS = 7;
const WX_KEY = 'jalsaathi:wx:v1';

// Jagah ka naam search karo (sirf India)
export async function searchPlace(name) {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?name=' +
    encodeURIComponent(name) +
    '&count=5&language=en&format=json&countryCode=IN';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Jagah search nahi ho payi');
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    state: r.admin1 || '',
    lat: r.latitude,
    lon: r.longitude,
  }));
}

// Phone ki GPS location
export function getMyLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is device me nahi hai'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error('Location ki permission nahi mili')),
    );
  });
}

// GPS ke coordinates se gaon/shehar ka naam (OpenStreetMap Nominatim, free, key nahi chahiye)
export async function reverseGeocode(lat, lon, lang) {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1' +
    '&lat=' +
    lat +
    '&lon=' +
    lon +
    '&accept-language=' +
    (lang === 'hi' ? 'hi,en' : 'en');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Naam nahi mila');
  const d = await res.json();
  const a = d.address || {};
  const name =
    a.village ||
    a.hamlet ||
    a.town ||
    a.suburb ||
    a.city ||
    a.city_district ||
    a.county ||
    a.state_district ||
    '';
  const state = a.state || '';
  if (!name && !state) throw new Error('Naam nahi mila');
  return { name: name || state, state: name ? state : '' };
}

// Screen par dikhane layak jagah ka text. Naam na ho to GPS likhkar coordinates
export function placeText(place, gpsLabel) {
  if (!place) return '';
  if (place.name) return place.name + (place.state ? ', ' + place.state : '');
  if (place.gps) return gpsLabel + ' (' + place.lat.toFixed(2) + ', ' + place.lon.toFixed(2) + ')';
  return '';
}

// Pichle 30 din + agle 7 din ka baarish aur ET0
export async function getDaily(lat, lon) {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=' +
    lat +
    '&longitude=' +
    lon +
    '&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min' +
    '&past_days=' +
    PAST_DAYS +
    '&forecast_days=' +
    FORECAST_DAYS +
    '&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather data nahi aa paaya');
  const data = await res.json();
  const d = data.daily;
  const days = d.time.map((date, i) => ({
    date,
    rain: d.precipitation_sum[i], // mm (null ho sakta hai)
    et0: d.et0_fao_evapotranspiration[i], // mm (null ho sakta hai)
    tmax: d.temperature_2m_max[i],
    tmin: d.temperature_2m_min[i],
  }));
  return { days, todayIndex: PAST_DAYS };
}

function saveCache(lat, lon, days) {
  try {
    localStorage.setItem(WX_KEY, JSON.stringify({ lat, lon, fetchedAt: Date.now(), days }));
  } catch {
    /* storage bhara ho to bhi app chale */
  }
}

function loadCache(lat, lon) {
  try {
    const raw = localStorage.getItem(WX_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (Math.abs(c.lat - lat) > 0.01 || Math.abs(c.lon - lon) > 0.01) return null; // doosri jagah ka data nahi chalega
    return c;
  } catch {
    return null;
  }
}

// Pehle internet se, na mile to pichla saved data (agar aaj ki tarikh usme hai)
export async function getDailyCached(lat, lon) {
  try {
    const w = await getDaily(lat, lon);
    saveCache(lat, lon, w.days);
    return { ...w, fromCache: false, fetchedAt: Date.now() };
  } catch (err) {
    const c = loadCache(lat, lon);
    if (!c) throw err;
    const idx = c.days.findIndex((d) => d.date === todayStr());
    if (idx < 0) throw new Error('Saved data purana ho gaya');
    return { days: c.days, todayIndex: idx, fromCache: true, fetchedAt: c.fetchedAt };
  }
}