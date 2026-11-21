import { makeT, stageKey } from '../lib/i18n.js';
import { fmtDate, fmtNum } from '../lib/utils.js';

export default function Home({ lang, place, field, result, onMarkDone }) {
  const t = makeT(lang);
  const p0 = result.plan[0];
  const kind = p0.action === 'irrigate' ? 'go' : p0.action === 'rain' ? 'skip' : 'none';
  const done = field.lastIrrigation === p0.date;
  const placeLabel = place.gps ? t('gpsPlace') : place.name;

  let moisture = '';
  if (result.status && result.status.availPct != null) {
    moisture = t('soilMoist', { p: result.status.availPct });
  } else if (result.status && result.status.depthMm != null) {
    moisture = result.status.depthMm > 0 ? t('pondWet', { mm: result.status.depthMm }) : t('pondDry');
  }

  return (
    <>
      <div className="card tight">
        <b>
          {field.crop === 'wheat' ? '🌾' : '🌱'} {t(field.crop)} · {placeLabel}
        </b>
        <div className="muted">
          {t(stageKey(result.stage.en))} · {t('dayOf', { d: result.dayNumToday, n: result.seasonDays })}
        </div>
      </div>

      <div className={'hero ' + kind}>
        {kind === 'go' && (
          <>
            <div className="hero-title">💧 {t('goTitle')}</div>
            <div className="hero-sub">{t('amount', { mm: p0.mm, l: fmtNum(p0.litres) })}</div>
            <div className="hero-why">{t('why_' + p0.reason)}</div>
          </>
        )}
        {kind === 'skip' && (
          <>
            <div className="hero-title">🌧 {t('skipTitle')}</div>
            <div className="hero-sub">{t('skipSub')}</div>
          </>
        )}
        {kind === 'none' && (
          <>
            <div className="hero-title">✅ {t('noneTitle')}</div>
            <div className="hero-sub">{moisture}</div>
          </>
        )}
      </div>

      {done ? (
        <div className="banner">✔ {t('doneBanner')}</div>
      ) : (
        <button className="btn" onClick={onMarkDone}>
          {t('markDone')}
        </button>
      )}

      <div className="card">
        <h3>{t('next7')}</h3>
        {result.plan.map((r) => (
          <div className={'day ' + r.action} key={r.date}>
            <div className="day-date">{fmtDate(r.date, lang)}</div>
            <div className="day-act">
              {r.action === 'irrigate' ? t('dayIrr') : r.action === 'rain' ? t('dayRain') : t('dayNone')}
              {r.action === 'irrigate' && <small> · {r.mm} mm</small>}
            </div>
            <div className="day-rain">
              {t('rainLbl')}: {r.rain != null ? r.rain : 0} mm
            </div>
          </div>
        ))}
      </div>

      <p className="muted small-text">{t('estimateNote')}</p>
    </>
  );
}