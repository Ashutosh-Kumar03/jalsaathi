import { makeT, stageKey } from '../lib/i18n.js';
import { stageAt } from '../lib/crops.js';
import { fmtDate } from '../lib/utils.js';

export default function Alerts({ lang, field, result }) {
  const t = makeT(lang);
  const items = [];

  result.plan.forEach((r, idx) => {
    const date = fmtDate(r.date, lang);
    if (r.action === 'irrigate') {
      items.push({ k: 'i' + idx, icon: '💧', text: t('alertIrr', { date, mm: r.mm }) });
    } else if (r.action === 'rain') {
      items.push({ k: 'r' + idx, icon: '🌧', text: t('alertRain', { date }) });
    } else if (r.rain != null && r.rain >= 5) {
      items.push({ k: 'h' + idx, icon: '🌧', text: t('alertRainHeavy', { date, r: r.rain }) });
    }
    if (idx > 0) {
      const prev = stageAt(field.crop, r.dayNum - 1);
      const cur = stageAt(field.crop, r.dayNum);
      if (prev.en !== cur.en) {
        items.push({ k: 's' + idx, icon: '🌾', text: t('alertStage', { date, s: t(stageKey(cur.en)) }) });
      }
    }
  });

  return (
    <div className="card">
      <h2>{t('alertsTitle')}</h2>
      {items.length === 0 && <p>{t('noAlerts')}</p>}
      {items.map((a) => (
        <div className="alert-item" key={a.k}>
          <span>{a.icon}</span>
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}