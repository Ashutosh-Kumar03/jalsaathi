import { makeT, stageKey } from '../lib/i18n.js';
import { stageAt } from '../lib/crops.js';
import { fmtDate } from '../lib/utils.js';
import Icon from '../components/Icon.jsx';

const COLORS = { drop: '#1769aa', rain: '#8a6a00', sprout: '#1f7a4d' };

export default function Alerts({ lang, field, result }) {
  const t = makeT(lang);
  const items = [];

  result.plan.forEach((r, idx) => {
    const date = fmtDate(r.date, lang);
    if (r.action === 'irrigate') {
      items.push({ k: 'i' + idx, icon: 'drop', text: t('alertIrr', { date, mm: r.mm }) });
    } else if (r.action === 'rain') {
      items.push({ k: 'r' + idx, icon: 'rain', text: t('alertRain', { date }) });
    } else if (r.rain != null && r.rain >= 5) {
      items.push({ k: 'h' + idx, icon: 'rain', text: t('alertRainHeavy', { date, r: r.rain }) });
    }
    if (idx > 0) {
      const prev = stageAt(field.crop, r.dayNum - 1);
      const cur = stageAt(field.crop, r.dayNum);
      if (prev.en !== cur.en) {
        items.push({ k: 's' + idx, icon: 'sprout', text: t('alertStage', { date, s: t(stageKey(cur.en)) }) });
      }
    }
  });

  return (
    <div className="card">
      <h2>{t('alertsTitle')}</h2>
      {items.length === 0 && <p>{t('noAlerts')}</p>}
      {items.map((a) => (
        <div className="alert-item" key={a.k}>
          <Icon name={a.icon} size={20} style={{ color: COLORS[a.icon], marginTop: 2 }} />
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}