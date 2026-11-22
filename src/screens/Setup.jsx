import { useState } from 'react';
import { searchPlace, getMyLocation, reverseGeocode, placeText } from '../lib/weather.js';
import { ACRE_M2 } from '../lib/engine.js';
import { makeT } from '../lib/i18n.js';
import { todayStr } from '../lib/utils.js';
import Icon from '../components/Icon.jsx';

// Pump aur location ke naye fields ka text
const X = {
  hi: {
    pumpTitle: 'पंप का खर्च (ज़रूरी नहीं)',
    pumpHours: 'पूरे खेत में एक बार सिंचाई करने में पंप कितने घंटे चलता है',
    pumpCost: 'पंप का खर्च प्रति घंटा (₹), डीज़ल या बिजली',
    pumpNote: 'इससे हम बचत को घंटे और रुपये में दिखाते हैं। खाली छोड़ सकते हैं।',
    riceAssume: 'धान के लिए हम एक बार में 50 मिमी पानी भरना मानते हैं।',
    errPump: 'पंप के घंटे और रुपये सही भरें (दोनों भरें या दोनों खाली छोड़ें)।',
    errFlow: 'पंप के घंटे और खेत के आकार से पानी का बहाव अजीब आ रहा है। संख्याएँ जाँचें।',
    detecting: 'जगह का नाम ढूँढ रहे हैं…',
    noName: 'नाम नहीं मिला। सलाह इसी लोकेशन से बनेगी। चाहें तो ऊपर नाम से खोजकर चुन सकते हैं।',
  },
  en: {
    pumpTitle: 'Pump cost (optional)',
    pumpHours: 'Hours the pump runs for one irrigation of the whole field',
    pumpCost: 'Pump cost per hour (₹), diesel or electricity',
    pumpNote: 'We use this to show savings in hours and rupees. You can leave it empty.',
    riceAssume: 'For rice we assume one irrigation fills 50 mm of water.',
    errPump: 'Enter pump hours and rupees correctly (fill both or leave both empty).',
    errFlow: 'The pump hours and field size give an odd water flow. Please check the numbers.',
    detecting: 'Finding the place name…',
    noName: 'Could not find a name. Advice will use this exact location. You can also search by name above.',
  },
};

export default function Setup({ lang, setLang, initial, startStep, onDone }) {
  const t = makeT(lang);
  const x = X[lang];
  const f = initial.field || {};
  const [step, setStep] = useState(startStep);
  const [place, setPlace] = useState(initial.place || null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [info, setInfo] = useState('');
  const [crop, setCrop] = useState(f.crop || 'wheat');
  const [soil, setSoil] = useState(f.soil || 'loam');
  const [sowDate, setSowDate] = useState(f.sowDate || '');
  const [area, setArea] = useState(f.areaAcres ? String(f.areaAcres) : '');
  const [lastIrr, setLastIrr] = useState(f.lastIrrigation || '');
  const [habitDays, setHabitDays] = useState(f.habitDays ? String(f.habitDays) : '10');
  const [habitMm, setHabitMm] = useState(f.habitMm ? String(f.habitMm) : '60');
  const [pumpHours, setPumpHours] = useState(f.pumpHours ? String(f.pumpHours) : '');
  const [costPerHour, setCostPerHour] = useState(f.costPerHour ? String(f.costPerHour) : '');
  const [error, setError] = useState('');

  async function doSearch() {
    if (!query.trim()) return;
    setBusy(true);
    setMsg('');
    setInfo('');
    try {
      const r = await searchPlace(query.trim());
      setResults(r);
      if (!r.length) setMsg(t('noResults'));
    } catch {
      setMsg(t('loadErr'));
    }
    setBusy(false);
  }

  async function useGps() {
    setBusy(true);
    setMsg('');
    setInfo('');
    try {
      const p = await getMyLocation();
      const base = { name: '', state: '', lat: p.lat, lon: p.lon, gps: true };
      setPlace(base);
      setResults([]);
      setInfo(x.detecting);
      try {
        const r = await reverseGeocode(p.lat, p.lon, lang);
        setPlace({ ...base, name: r.name, state: r.state });
        setInfo('');
      } catch {
        setInfo(x.noName); // naam nahi mila, coordinates hi dikhenge
      }
    } catch {
      setMsg(t('gpsFail'));
      setInfo('');
    }
    setBusy(false);
  }

  function submit() {
    const today = todayStr();
    if (!place) return setError(t('errPlace'));
    if (!sowDate || sowDate > today) return setError(t('errSow'));
    const a = parseFloat(area);
    if (!(a > 0 && a <= 500)) return setError(t('errArea'));
    if (lastIrr && (lastIrr > today || lastIrr < sowDate)) return setError(t('errLast'));
    const hd = parseInt(habitDays, 10);
    if (crop === 'wheat' && !(hd >= 3 && hd <= 30)) return setError(t('errHabit'));

    // Pump ki jaankari (dono ya koi nahi)
    const anyPump = pumpHours.trim() !== '' || costPerHour.trim() !== '';
    const ph = parseFloat(pumpHours);
    const pc = parseFloat(costPerHour);
    if (anyPump) {
      if (!(ph >= 0.5 && ph <= 200 && pc >= 1 && pc <= 5000)) return setError(x.errPump);
      const mmIrr = crop === 'wheat' ? parseInt(habitMm, 10) : 50;
      const flowM3h = (mmIrr * a * ACRE_M2) / 1000 / ph; // m3 per ghanta
      if (!(flowM3h >= 1 && flowM3h <= 300)) return setError(x.errFlow);
    }

    setError('');
    onDone({
      place,
      field: {
        crop,
        soil,
        sowDate,
        lastIrrigation: lastIrr || '',
        areaAcres: a,
        habitDays: crop === 'wheat' ? hd : 0,
        habitMm: crop === 'wheat' ? parseInt(habitMm, 10) : 0,
        pumpHours: anyPump ? ph : 0,
        costPerHour: anyPump ? pc : 0,
      },
    });
  }

  const placeLabel = placeText(place, t('gpsPlace'));

  if (step === 0) {
    return (
      <div className="card">
        <h2>{t('chooseLang')}</h2>
        <div className="choice-grid">
          <button
            className={'choice' + (lang === 'hi' ? ' sel' : '')}
            onClick={() => {
              setLang('hi');
              setStep(1);
            }}
          >
            हिन्दी
          </button>
          <button
            className={'choice' + (lang === 'en' ? ' sel' : '')}
            onClick={() => {
              setLang('en');
              setStep(1);
            }}
          >
            English
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="card">
        <h2>{t('whereField')}</h2>
        <div className="row">
          <input
            value={query}
            placeholder={t('searchPh')}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          />
          <button className="btn small" onClick={doSearch} disabled={busy}>
            {t('searchBtn')}
          </button>
        </div>
        {results.map((r, i) => (
          <button
            key={i}
            className="result"
            onClick={() => {
              setPlace(r);
              setResults([]);
              setInfo('');
            }}
          >
            {r.name}
            {r.state ? ', ' + r.state : ''}
          </button>
        ))}
        <button className="btn secondary" onClick={useGps} disabled={busy}>
          <Icon name="pin" size={20} style={{ marginRight: 8 }} />
          {t('useGps')}
        </button>
        {msg && <p className="error">{msg}</p>}
        {info && <p className="muted">{info}</p>}
        {place && (
          <p className="chosen">
            <Icon name="check" size={18} style={{ marginRight: 6 }} />
            {t('selectedPlace')}: <b>{placeLabel}</b>
          </p>
        )}
        <button className="btn" disabled={!place || busy} onClick={() => setStep(2)}>
          {t('next')}
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{t('aboutField')}</h2>

      <label>{t('crop')}</label>
      <div className="choice-grid">
        {['wheat', 'rice'].map((k) => (
          <button key={k} className={'choice' + (crop === k ? ' sel' : '')} onClick={() => setCrop(k)}>
            <Icon name="sprout" size={20} style={{ marginRight: 8 }} />
            {t(k)}
          </button>
        ))}
      </div>

      <label>{t('soil')}</label>
      <div className="choice-grid three">
        {['sandy', 'loam', 'clay'].map((k) => (
          <button key={k} className={'choice' + (soil === k ? ' sel' : '')} onClick={() => setSoil(k)}>
            {t(k)}
          </button>
        ))}
      </div>

      <label>{t('sowDate')}</label>
      <input type="date" value={sowDate} max={todayStr()} onChange={(e) => setSowDate(e.target.value)} />

      <label>{t('area')}</label>
      <input type="number" inputMode="decimal" min="0" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} />

      <label>{t('lastIrr')}</label>
      <input type="date" value={lastIrr} max={todayStr()} onChange={(e) => setLastIrr(e.target.value)} />

      {crop === 'wheat' && (
        <div className="subcard">
          <b>{t('habitTitle')}</b>
          <label>{t('habitEvery')}</label>
          <input type="number" inputMode="numeric" min="3" max="30" value={habitDays} onChange={(e) => setHabitDays(e.target.value)} />
          <label>{t('habitDepth')}</label>
          <select value={habitMm} onChange={(e) => setHabitMm(e.target.value)}>
            <option value="40">{t('hLight')}</option>
            <option value="60">{t('hNormal')}</option>
            <option value="80">{t('hHeavy')}</option>
          </select>
          <small className="muted">{t('habitNote')}</small>
        </div>
      )}

      <div className="subcard">
        <b>{x.pumpTitle}</b>
        <label>{x.pumpHours}</label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={pumpHours}
          onChange={(e) => setPumpHours(e.target.value)}
        />
        <label>{x.pumpCost}</label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={costPerHour}
          onChange={(e) => setCostPerHour(e.target.value)}
        />
        <small className="muted">{x.pumpNote}</small>
        {crop === 'rice' && <small className="muted">{x.riceAssume}</small>}
      </div>

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn secondary" onClick={() => setStep(1)}>
          {t('back')}
        </button>
        <button className="btn" onClick={submit}>
          {t('saveField')}
        </button>
      </div>
    </div>
  );
}