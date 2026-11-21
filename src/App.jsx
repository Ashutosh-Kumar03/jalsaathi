import { useEffect, useMemo, useState } from 'react';
import { getDailyCached } from './lib/weather.js';
import { runAdvisor } from './lib/engine.js';
import { makeT } from './lib/i18n.js';
import { loadState, saveState, clearState } from './lib/utils.js';
import Setup from './screens/Setup.jsx';
import Home from './screens/Home.jsx';
import Savings from './screens/Savings.jsx';
import Alerts from './screens/Alerts.jsx';
import FieldTab from './screens/FieldTab.jsx';

const EMPTY = { lang: 'hi', place: null, field: null, history: [] };

const OFFLINE = {
  hi: 'ऑफ़लाइन: पिछली बार {time} पर लिया गया मौसम डेटा इस्तेमाल हो रहा है।',
  en: 'Offline: using weather data saved last time at {time}.',
};

function fmtTime(ms, lang) {
  return new Date(ms).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function App() {
  const [state, setState] = useState(() => ({ ...EMPTY, ...(loadState() || {}) }));
  const [tab, setTab] = useState('today');
  const [editing, setEditing] = useState(false);
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('idle');
  const [reload, setReload] = useState(0);
  const { lang, place, field } = state;
  const history = state.history || [];
  const t = makeT(lang);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Internet wapas aaye to apne aap naya data le lo
  useEffect(() => {
    const onOnline = () => setReload((r) => r + 1);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    if (!place) return undefined;
    let off = false;
    setStatus('loading');
    getDailyCached(place.lat, place.lon)
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

  // "Paani de diya" dabane par: aakhri sinchai ki date badlo aur record me jodo
  function markDone() {
    const p0 = result.plan[0];
    const today = result.todayDate;
    setState((s) => {
      const hist = s.history || [];
      if (hist[0] && hist[0].date === today) return s;
      const entry = {
        date: today,
        mm: p0.action === 'irrigate' ? p0.mm : 0,
        advised: p0.action === 'irrigate',
        prevLast: s.field.lastIrrigation || '',
      };
      return {
        ...s,
        history: [entry, ...hist].slice(0, 60),
        field: { ...s.field, lastIrrigation: today },
      };
    });
  }

  // Galti se dab gaya ho to aakhri entry hatao aur pehle wali date wapas lagao
  function undoLast() {
    setState((s) => {
      const hist = s.history || [];
      if (!hist.length) return s;
      const [last, ...rest] = hist;
      return { ...s, history: rest, field: { ...s.field, lastIrrigation: last.prevLast || '' } };
    });
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
        <FieldTab
          lang={lang}
          place={place}
          field={field}
          history={history}
          onEdit={() => setEditing(true)}
          onReset={resetAll}
          onUndo={undoLast}
        />
      );
    }
  }

  const offlineBanner =
    !needSetup && weather && weather.fromCache ? (
      <div
        className="banner"
        style={{ background: '#fff4d6', color: '#5a4300', fontWeight: 600, fontSize: 14 }}
      >
        📴 {OFFLINE[lang].replace('{time}', fmtTime(weather.fetchedAt, lang))}
      </div>
    ) : null;

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
        {offlineBanner}
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