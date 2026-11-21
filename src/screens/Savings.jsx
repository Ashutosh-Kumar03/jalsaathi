import { makeT } from '../lib/i18n.js';
import { fmtNum } from '../lib/utils.js';

export default function Savings({ lang, field, result }) {
  const t = makeT(lang);
  const s = result.savings;

  if (!s) {
    return (
      <div className="card">
        <h2>{t('savingsTitle')}</h2>
        <p>{t('noSavings')}</p>
      </div>
    );
  }

  const max = Math.max(s.baselineLitres, s.ourLitres, 1);
  const baseText =
    field.crop === 'rice' ? t('riceBase') : t('wheatBase', { d: field.habitDays, mm: field.habitMm });

  return (
    <>
      <div className="card">
        <h2>{t('savingsTitle')}</h2>
        {s.savedLitres > 0 ? (
          <div className="big-number">
            <div className="num">{fmtNum(s.savedLitres)}</div>
            <div>{t('savedWord')}</div>
            <div className="muted">{t('savedPct', { p: s.savedPct })}</div>
          </div>
        ) : (
          <p>{t('habitGood')}</p>
        )}

        <div className="bar-row">
          <div className="bar-label">{t('yourHabit')}</div>
          <div className="bar">
            <div className="bar-fill old" style={{ width: (s.baselineLitres / max) * 100 + '%' }} />
          </div>
          <div className="bar-val">
            {fmtNum(s.baselineLitres)} {t('litresShort')}
          </div>
        </div>
        <div className="bar-row">
          <div className="bar-label">{t('ourPlan')}</div>
          <div className="bar">
            <div className="bar-fill new" style={{ width: (s.ourLitres / max) * 100 + '%' }} />
          </div>
          <div className="bar-val">
            {fmtNum(s.ourLitres)} {t('litresShort')}
          </div>
        </div>
        <p className="muted small-text">{baseText}</p>
      </div>
      <p className="muted small-text">{t('basis', { n: s.windowDays })}</p>
    </>
  );
}