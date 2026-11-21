import { useState } from 'react';
import { makeT } from '../lib/i18n.js';
import { fmtDate, todayStr } from '../lib/utils.js';
import { placeText } from '../lib/weather.js';

const X = {
  hi: {
    acre: 'एकड़',
    histTitle: 'पानी दिए गए दिन',
    empty: 'अभी कोई एंट्री नहीं। "आज" टैब में "मैंने आज पानी दे दिया" दबाने पर यहाँ दर्ज होगा।',
    summary: 'आपने {n} बार पानी दिया, इनमें से {k} बार जलसाथी की सलाह के दिन।',
    advised: 'सलाह के अनुसार',
    other: 'अपनी मर्ज़ी से',
    late: 'बाद में जोड़ा',
    undo: 'आखिरी एंट्री हटाएँ',
    note: 'यह सिर्फ़ वही दिखाता है जो आपने खुद दर्ज किया।',
    addTitle: 'पिछली तारीख जोड़ें (जिस दिन आपने सच में पानी दिया)',
    addBtn: 'जोड़ें',
    errRange: 'तारीख बुवाई की तारीख और आज के बीच होनी चाहिए।',
    errDup: 'यह तारीख पहले से दर्ज है।',
    errEmpty: 'पहले तारीख चुनें।',
  },
  en: {
    acre: 'acre',
    histTitle: 'Days you watered',
    empty: 'No entries yet. Tap "I watered today" on the Today tab and it will be recorded here.',
    summary: 'You watered {n} times, {k} of them on days JalSaathi advised it.',
    advised: 'As advised',
    other: 'On your own',
    late: 'Added later',
    undo: 'Remove last entry',
    note: 'This shows only what you recorded yourself.',
    addTitle: 'Add an earlier date (a day you really watered)',
    addBtn: 'Add',
    errRange: 'The date must be between the sowing date and today.',
    errDup: 'This date is already recorded.',
    errEmpty: 'Pick a date first.',
  },
};

export default function FieldTab({ lang, place, field, history, onEdit, onReset, onUndo, onAdd }) {
  const t = makeT(lang);
  const x = X[lang];
  const list = history || [];
  const followed = list.filter((h) => h.advised).length;
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const [pastDate, setPastDate] = useState('');
  const [err, setErr] = useState('');

  function addPast() {
    if (!pastDate) return setErr(x.errEmpty);
    if (pastDate > todayStr() || pastDate < field.sowDate) return setErr(x.errRange);
    if (list.some((h) => h.date === pastDate)) return setErr(x.errDup);
    setErr('');
    onAdd(pastDate);
    setPastDate('');
  }

  return (
    <>
      <div className="card">
        <h2>{t('yourField')}</h2>
        <p>
          {t(field.crop)} · {t(field.soil)} · {field.areaAcres} {x.acre}
          <br />
          {t('sowDate')}: {field.sowDate}
          <br />
          {placeText(place, t('gpsPlace'))}
        </p>
        <button className="btn" onClick={onEdit}>
          {t('editField')}
        </button>
      </div>

      <div className="card">
        <h3>{x.histTitle}</h3>
        {list.length === 0 ? (
          <p className="muted">{x.empty}</p>
        ) : (
          <>
            <p>{x.summary.replace('{n}', list.length).replace('{k}', followed)}</p>
            {sorted.map((h, i) => (
              <div className="alert-item" key={h.date + '-' + i}>
                <span>💧</span>
                <span>
                  {fmtDate(h.date, lang)}
                  {h.advised && h.mm > 0 ? ' · ' + h.mm + ' mm' : ''}
                  <small className="muted"> · {h.late ? x.late : h.advised ? x.advised : x.other}</small>
                </span>
              </div>
            ))}
            <button className="btn secondary" onClick={onUndo}>
              {x.undo}
            </button>
            <small className="muted">{x.note}</small>
          </>
        )}

        <div className="subcard">
          <b>{x.addTitle}</b>
          <input type="date" value={pastDate} min={field.sowDate} max={todayStr()} onChange={(e) => setPastDate(e.target.value)} />
          {err && <p className="error">{err}</p>}
          <button className="btn secondary" onClick={addPast}>
            {x.addBtn}
          </button>
        </div>
      </div>

      <button className="btn secondary" onClick={onReset}>
        {t('resetAll')}
      </button>
    </>
  );
}