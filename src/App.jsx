import { useEffect, useMemo, useState } from 'react';
import { getDaily } from './lib/weather.js';
import { runAdvisor } from './lib/engine.js';
import { makeT } from './lib/i18n.js';
import { loadState, saveState, clearState } from './lib/utils.js';
import Setup from './screens/Setup.jsx';
import Home from './screens/Home.jsx';
import Savings from './screens/Savings.jsx';
import Alerts from './screens/Alerts.jsx';

const EMPTY = { lang: 'hi', place: null, field: null };

export default function App() {
  const [state, setState] = useState(() => loadState() || EMPTY);
  const [tab, setTab] = useState('today');
  const [editing, setEditing] = useState(false);
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('idle');
  const [reload, setReload] = useState(0);
  const { lang, place, field } = state;
  const t = makeT(lang);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!place) return undefined;
    let off = false;
    setStatus('loading');
    getDaily(place.lat, place.lon)
      .then((w) => {
        if (!off) {
          setWeather(w);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!off) setStatus('error');
      });
    return () => {
      off = true;
    };
  }, [place, reload]);

  const result = useMemo(() => {
    if (!weather || !field) return null;
    try {
      return runAdvisor({ ...weather, ...field });
    } catch (e) {
      return { error: e.message };
    }
  }, [weather, field]);

  const needSetup = !place || !field || editing;

  function markDone() {
    setState((s) => ({ ...s, field: { ...s.field, lastIrrigation: result.todayDate } }));
  }

  function resetAll() {
    if (window.confirm(t('confirmReset'))) {
      clearState();
      setWeather(null);
      setStatus('idle');
      setEditing(false);
      setState({ ...EMPTY, lang });
    }
  }

  let body = null;
  if (!needSetup) {
    if (status === 'error' && !weather) {
      body = (
        <div className="card">
          <p className="error">{t('loadErr')}</p>
          <button className="btn" onClick={() => setReload((r) => r + 1)}>
            {t('retry')}
          </button>
        </div>
      );
    } else if (!weather || !result) {
      body = <div className="card">{t('loading')}</div>;
    } else if (result.error) {
      body = (
        <div className="card">
          <p className="error">{result.error}</p>
          <button className="btn" onClick={() => setEditing(true)}>
            {t('editField')}
          </button>
        </div>
      );
    } else if (result.finished) {
      body = (
        <div className="card">
          <p>{t('seasonOver')}</p>
          <button className="btn" onClick={() => setEditing(true)}>
            {t('editField')}
          </button>
        </div>
      );
    } else if (tab === 'today') {
      body = <Home lang={lang} place={place} field={field} result={result} onMarkDone={markDone} />;
    } else if (tab === 'savings') {
      body = <Savings lang={lang} field={field} result={result} />;
    } else if (tab === 'alerts') {
      body = <Alerts lang={lang} field={field} result={result} />;
    } else {
      body = (
        <div className="card">
          <h2>{t('yourField')}</h2>
          <p>
            {t(field.crop)} · {t(field.soil)} · {field.areaAcres} {t('area').includes('एकड़') ? 'एकड़' : 'acre'}
            <br />
            {t('sowDate')}: {field.sowDate}
            <br />
            {place.gps ? t('gpsPlace') : place.name}
          </p>
          <button className="btn" onClick={() => setEditing(true)}>
            {t('editField')}
          </button>
          <button className="btn secondary" onClick={resetAll}>
            {t('resetAll')}
          </button>
        </div>
      );
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <b>💧 {t('appName')}</b>
          <small>{t('tagline')}</small>
        </div>
        <button className="lang-btn" onClick={() => setState((s) => ({ ...s, lang: s.lang === 'hi' ? 'en' : 'hi' }))}>
          {lang === 'hi' ? 'English' : 'हिन्दी'}
        </button>
      </header>

      <main className="content">
        {needSetup ? (
          <Setup
            key={editing ? 'edit' : 'new'}
            lang={lang}
            setLang={(l) => setState((s) => ({ ...s, lang: l }))}
            initial={{ place, field }}
            startStep={place ? 1 : 0}
            onDone={(p) => {
              setState((s) => ({ ...s, place: p.place, field: p.field }));
              setEditing(false);
              setTab('today');
            }}
          />
        ) : (
          body
        )}
      </main>

      {!needSetup && (
        <nav className="nav">
          {[
            ['today', '🏠', t('tabToday')],
            ['savings', '💰', t('tabSavings')],
            ['alerts', '🔔', t('tabAlerts')],
            ['field', '🌾', t('tabField')],
          ].map(([k, icon, label]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
              <span>{icon}</span>
              <small>{label}</small>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}