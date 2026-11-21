import { useState } from 'react';
import { searchPlace, getMyLocation } from '../lib/weather.js';
import { makeT } from '../lib/i18n.js';
import { todayStr } from '../lib/utils.js';

export default function Setup({ lang, setLang, initial, startStep, onDone }) {
  const t = makeT(lang);
  const f = initial.field || {};
  const [step, setStep] = useState(startStep);
  const [place, setPlace] = useState(initial.place || null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [crop, setCrop] = useState(f.crop || 'wheat');
  const [soil, setSoil] = useState(f.soil || 'loam');
  const [sowDate, setSowDate] = useState(f.sowDate || '');
  const [area, setArea] = useState(f.areaAcres ? String(f.areaAcres) : '');
  const [lastIrr, setLastIrr] = useState(f.lastIrrigation || '');
  const [habitDays, setHabitDays] = useState(f.habitDays ? String(f.habitDays) : '10');
  const [habitMm, setHabitMm] = useState(f.habitMm ? String(f.habitMm) : '60');
  const [error, setError] = useState('');

  async function doSearch() {
    if (!query.trim()) return;
    setBusy(true);
    setMsg('');
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
    try {
      const p = await getMyLocation();
      setPlace({ name: '', state: '', lat: p.lat, lon: p.lon, gps: true });
      setResults([]);
    } catch {
      setMsg(t('gpsFail'));
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
      },
    });
  }

  const placeLabel = place ? (place.gps ? t('gpsPlace') : place.name + (place.state ? ', ' + place.state : '')) : '';

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
            }}
          >
            {r.name}
            {r.state ? ', ' + r.state : ''}
          </button>
        ))}
        <button className="btn secondary" onClick={useGps} disabled={busy}>
          {t('useGps')}
        </button>
        {msg && <p className="error">{msg}</p>}
        {place && (
          <p className="chosen">
            ✅ {t('selectedPlace')}: <b>{placeLabel}</b>
          </p>
        )}
        <button className="btn" disabled={!place} onClick={() => setStep(2)}>
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
            {k === 'wheat' ? '🌾 ' : '🌱 '}
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