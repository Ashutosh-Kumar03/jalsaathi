import { ACRE_M2 } from '../lib/engine.js';
import { makeT } from '../lib/i18n.js';
import { fmtNum } from '../lib/utils.js';

const X = {
  hi: {
    moneyTitle: 'पंप का समय और खर्च',
    savedHours: 'घंटे पंप कम चलेगा',
    savedMoney: 'रुपये की बचत',
    habitCost: 'आपकी आदत से',
    ourCost: 'जलसाथी की सलाह से',
    hrs: 'घंटे',
    basis: 'यह आपके बताए पंप के घंटे और खर्च पर आधारित अनुमान है।',
    askPump: 'रुपये और पंप के घंटों में बचत देखने के लिए "खेत" टैब में खेत की जानकारी बदलकर पंप का खर्च भरें।',
  },
  en: {
    moneyTitle: 'Pump time and cost',
    savedHours: 'fewer pump hours',
    savedMoney: 'rupees saved',
    habitCost: 'With your habit',
    ourCost: 'With JalSaathi advice',
    hrs: 'hours',
    basis: 'This is an estimate based on the pump hours and cost you entered.',
    askPump: 'To see savings in rupees and pump hours, open the Field tab, edit field details and add your pump cost.',
  },
};

export default function Savings({ lang, field, result }) {
  const t = makeT(lang);
  const x = X[lang];
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

  // Pump ka hisaab (sirf tab jab kisaan ne ghante aur kharcha bhara ho)
  let money = null;
  if (field.pumpHours > 0 && field.costPerHour > 0) {
    const mmIrr = field.crop === 'wheat' ? field.habitMm : 50;
    const flow = (mmIrr * field.areaAcres * ACRE_M2) / field.pumpHours; // litre per ghanta
    if (flow > 0) {
      const hBase = s.baselineLitres / flow;
      const hOur = s.ourLitres / flow;
      money = {
        hSaved: Math.max(0, hBase - hOur),
        rSaved: Math.max(0, (hBase - hOur) * field.costPerHour),
        rBase: hBase * field.costPerHour,
        rOur: hOur * field.costPerHour,
        hBase,
        hOur,
      };
    }
  }

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

      {money ? (
        <div className="card">
          <h3>{x.moneyTitle}</h3>
          {s.savedLitres > 0 && (
            <div className="big-number">
              <div className="num">₹ {fmtNum(Math.round(money.rSaved))}</div>
              <div>{x.savedMoney}</div>
              <div className="muted">
                {money.hSaved.toFixed(1)} {x.savedHours}
              </div>
            </div>
          )}
          <div className="bar-row">
            <div className="bar-label">{x.habitCost}</div>
            <div className="bar-val">
              ₹ {fmtNum(Math.round(money.rBase))} · {money.hBase.toFixed(1)} {x.hrs}
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">{x.ourCost}</div>
            <div className="bar-val">
              ₹ {fmtNum(Math.round(money.rOur))} · {money.hOur.toFixed(1)} {x.hrs}
            </div>
          </div>
          <p className="muted small-text">{x.basis}</p>
        </div>
      ) : (
        <p className="muted small-text">{x.askPump}</p>
      )}

      <p className="muted small-text">{t('basis', { n: s.windowDays })}</p>
    </>
  );
}