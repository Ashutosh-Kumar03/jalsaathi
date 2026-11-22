import { useEffect, useState } from 'react';
import { makeT, stageKey } from '../lib/i18n.js';
import { fmtDate, fmtNum } from '../lib/utils.js';
import { placeText } from '../lib/weather.js';
import Icon from '../components/Icon.jsx';
import {
  speechSupported,
  loadVoices,
  pickVoice,
  speak,
  stopSpeaking,
  buildAdviceText,
} from '../lib/speech.js';

// Is screen ke naye text (Hindi aur English)
const X = {
  hi: {
    dryNote: 'खेत की सतह अभी सूख रही है। यह AWD का हिस्सा है, इससे पानी बचता है।',
    nextIrr: 'अगली सिंचाई: {date}',
    none7: 'अगले 7 दिन सिंचाई की ज़रूरत नहीं।',
    anyway: 'मैंने फिर भी पानी दे दिया',
    listen: 'सुनें',
    stop: 'रोकें',
    noVoice: 'इस डिवाइस में हिंदी आवाज़ नहीं है। (सेटिंग में Text-to-speech से हिंदी आवाज़ जोड़ सकते हैं।)',
  },
  en: {
    dryNote: 'The field surface is drying. This is part of AWD and it saves water.',
    nextIrr: 'Next irrigation: {date}',
    none7: 'No irrigation needed in the next 7 days.',
    anyway: 'I watered anyway',
    listen: 'Listen',
    stop: 'Stop',
    noVoice: 'No English voice found on this device.',
  },
};

export default function Home({ lang, place, field, result, onMarkDone }) {
  const t = makeT(lang);
  const x = X[lang];
  const p0 = result.plan[0];
  const kind = p0.action === 'irrigate' ? 'go' : p0.action === 'rain' ? 'skip' : 'none';
  const done = field.lastIrrigation === p0.date;
  const placeLabel = placeText(place, t('gpsPlace'));

  const [speaking, setSpeaking] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const supported = speechSupported();

  // Bhasha badalne par check karo ki us bhasha ki voice hai ya nahi
  useEffect(() => {
    setSpeaking(false);
    stopSpeaking();
    if (!supported) return;
    loadVoices(() => setVoiceOk(!!pickVoice(lang)));
  }, [lang, supported]);

  // Page chhodte waqt awaaz band
  useEffect(() => () => stopSpeaking(), []);

  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(buildAdviceText(lang, result), lang, () => setSpeaking(false));
  }

  // Mitti ya khet ki sthiti
  const st = result.status || {};
  const isRice = field.crop === 'rice';
  const riceDry = isRice && st.depthMm != null && st.depthMm <= 0;
  let moisture = '';
  if (st.availPct != null) {
    moisture = t('soilMoist', { p: st.availPct });
  } else if (st.depthMm != null && st.depthMm > 0) {
    moisture = t('pondWet', { mm: st.depthMm });
  }

  // Agli sinchai kab
  const nextIrr = result.plan.slice(1).find((r) => r.action === 'irrigate');
  const nextLine = nextIrr ? x.nextIrr.replace('{date}', fmtDate(nextIrr.date, lang)) : x.none7;

  return (
    <>
      <div className="card tight">
        <b>
          <Icon name="sprout" size={18} style={{ marginRight: 6 }} />
          {t(field.crop)} · {placeLabel}
        </b>
        <div className="muted">
          {t(stageKey(result.stage.en))} · {t('dayOf', { d: result.dayNumToday, n: result.seasonDays })}
        </div>
      </div>

      <div className={'hero ' + kind}>
        {kind === 'go' && (
          <>
            <div className="hero-title">
              <Icon name="drop" size={28} style={{ marginRight: 8 }} />
              {t('goTitle')}
            </div>
            <div className="hero-sub">{t('amount', { mm: p0.mm, l: fmtNum(p0.litres) })}</div>
            <div className="hero-why">{t('why_' + p0.reason)}</div>
          </>
        )}
        {kind === 'skip' && (
          <>
            <div className="hero-title">
              <Icon name="rain" size={28} style={{ marginRight: 8 }} />
              {t('skipTitle')}
            </div>
            <div className="hero-sub">{t('skipSub')}</div>
            <div className="hero-why">{nextLine}</div>
          </>
        )}
        {kind === 'none' && (
          <>
            <div className="hero-title">
              <Icon name="ok" size={28} style={{ marginRight: 8 }} />
              {t('noneTitle')}
            </div>
            <div className="hero-sub">{riceDry ? x.dryNote : moisture}</div>
            <div className="hero-why">{nextLine}</div>
          </>
        )}
      </div>

      {supported && voiceOk && (
        <button className="btn secondary" onClick={toggleSpeak}>
          <Icon name={speaking ? 'stop' : 'volume'} size={20} style={{ marginRight: 8 }} />
          {speaking ? x.stop : x.listen}
        </button>
      )}
      {supported && !voiceOk && <p className="muted small-text">{x.noVoice}</p>}

      {done ? (
        <div className="banner">
          <Icon name="check" size={18} style={{ marginRight: 6 }} />
          {t('doneBanner')}
        </div>
      ) : (
        <button className={kind === 'go' ? 'btn' : 'btn secondary'} onClick={onMarkDone}>
          <Icon name="check" size={20} style={{ marginRight: 8 }} />
          {kind === 'go' ? t('markDone') : x.anyway}
        </button>
      )}

      <div className="card">
        <h3>{t('next7')}</h3>
        {result.plan.map((r) => (
          <div className={'day ' + r.action} key={r.date}>
            <div className="day-date">{fmtDate(r.date, lang)}</div>
            <div className="day-act">
              {r.action === 'irrigate' && <Icon name="drop" size={15} style={{ marginRight: 4 }} />}
              {r.action === 'rain' && <Icon name="rain" size={15} style={{ marginRight: 4 }} />}
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