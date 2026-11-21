

export const PAST_DAYS = 30;
export const FORECAST_DAYS = 7;

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