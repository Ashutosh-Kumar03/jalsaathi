import { makeT } from '../lib/i18n.js';
import { fmtDate } from '../lib/utils.js';

const X = {
  hi: {
    acre: 'एकड़',
    histTitle: 'पानी दिए गए दिन',
    empty: 'अभी कोई एंट्री नहीं। "आज" टैब में "मैंने आज पानी दे दिया" दबाने पर यहाँ दर्ज होगा।',
    summary: 'आपने {n} बार पानी दिया, इनमें से {k} बार जलसाथी की सलाह के दिन।',
    advised: 'सलाह के अनुसार',
    other: 'अपनी मर्ज़ी से',
    undo: 'आखिरी एंट्री हटाएँ',
    note: 'यह सिर्फ़ वही दिखाता है जो आपने खुद दर्ज किया।',
  },
  en: {
    acre: 'acre',
    histTitle: 'Days you watered',
    empty: 'No entries yet. Tap "I watered today" on the Today tab and it will be recorded here.',
    summary: 'You watered {n} times, {k} of them on days JalSaathi advised it.',
    advised: 'As advised',
    other: 'On your own',
    undo: 'Remove last entry',
    note: 'This shows only what you recorded yourself.',
  },
};

export default function FieldTab({ lang, place, field, history, onEdit, onReset, onUndo }) {
  const t = makeT(lang);
  const x = X[lang];
  const list = history || [];
  const followed = list.filter((h) => h.advised).length;

  return (
    <>
      <div className="card">
        <h2>{t('yourField')}</h2>
        <p>
          {t(field.crop)} · {t(field.soil)} · {field.areaAcres} {x.acre}
          <br />
          {t('sowDate')}: {field.sowDate}
          <br />
          {place.gps ? t('gpsPlace') : place.name}
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
            {list.slice(0, 10).map((h, i) => (
              <div className="alert-item" key={h.date + '-' + i}>
                <span>💧</span>
                <span>
                  {fmtDate(h.date, lang)}
                  {h.advised && h.mm > 0 ? ' · ' + h.mm + ' mm' : ''}
                  <small className="muted"> · {h.advised ? x.advised : x.other}</small>
                </span>
              </div>
            ))}
            <button className="btn secondary" onClick={onUndo}>
              {x.undo}
            </button>
            <small className="muted">{x.note}</small>
          </>
        )}
      </div>

      <button className="btn secondary" onClick={onReset}>
        {t('resetAll')}
      </button>
    </>
  );
}