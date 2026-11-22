// Bolkar salaah (browser ki built-in voice, koi API key ya paisa nahi)

let session = 0; // naya bolna shuru ho to purana band ho jaye

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Voices kabhi kabhi der se load hoti hain, isliye intezaar karte hain
export function loadVoices(cb) {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) {
    cb();
    return;
  }
  const handler = () => cb();
  synth.addEventListener('voiceschanged', handler, { once: true });
  setTimeout(cb, 1000);
}

function norm(l) {
  return (l || '').toLowerCase().replace('_', '-');
}

// Is bhasha ki sabse achhi voice dhundho (na mile to null)
// Pehle phone/laptop me installed (local) voice, phir baaki
export function pickVoice(lang) {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const base = lang === 'hi' ? 'hi' : 'en';
  const preferred = lang === 'hi' ? 'hi-in' : 'en-in';
  const ofLang = voices.filter((v) => norm(v.lang).startsWith(base));
  if (!ofLang.length) return null;
  return (
    ofLang.find((v) => v.localService && norm(v.lang) === preferred) ||
    ofLang.find((v) => v.localService) ||
    ofLang.find((v) => norm(v.lang) === preferred) ||
    ofLang[0]
  );
}

export function stopSpeaking() {
  session += 1;
  if (speechSupported()) window.speechSynthesis.cancel();
}

// Text ko chhote vaakyon me todke ek ek karke bolo
export function speak(text, lang, onEnd) {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  session += 1;
  const mine = session;

  const parts = text.match(/[^।.!?]+[।.!?]?/g) || [text];
  const voice = pickVoice(lang);
  let i = 0;

  function next() {
    if (mine !== session) return; // beech me kisi ne roka ya naya shuru kiya
    while (i < parts.length && !parts[i].trim()) i += 1;
    if (i >= parts.length) {
      if (onEnd) onEnd();
      return;
    }
    const u = new SpeechSynthesisUtterance(parts[i].trim());
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    if (voice) u.voice = voice;
    u.rate = lang === 'hi' ? 0.85 : 0.9;
    u.onend = () => {
      i += 1;
      next();
    };
    u.onerror = (e) => {
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      if (onEnd) onEnd();
    };
    synth.speak(u);
  }
  next();
}

export const SPEECH_LABELS = {
  hi: {
    listen: ' सुनें',
    stop: '⏹ रोकें',
    noVoice: 'इस डिवाइस में हिंदी आवाज़ नहीं है। (सेटिंग में Text-to-speech से हिंदी आवाज़ जोड़ सकते हैं।)',
  },
  en: {
    listen: 'Listen',
    stop: '⏹ Stop',
    noVoice: 'No English voice found on this device.',
  },
};

function speakDate(dateStr, lang) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Aaj ki salaah ko ek chhote bole jaane layak text me badlo
export function buildAdviceText(lang, result) {
  const plan = result.plan;
  const p0 = plan[0];
  const nextIrr = plan.slice(1).find((r) => r.action === 'irrigate');
  const mm0 = Math.round(p0.mm);
  const L = Math.round(p0.litres / 100) * 100; // 100 litre tak gol

  if (lang === 'hi') {
    const why = {
      cri: 'यह गेहूं की सबसे ज़रूरी सिंचाई है।',
      soil: 'मिट्टी में नमी कम हो गई है।',
      awd: 'खेत सूख गया है, फिर से पानी भरें।',
    };
    let s;
    if (p0.action === 'irrigate') {
      s = 'आज पानी दो। ' + mm0 + ' मिलीमीटर पानी चाहिए। कुल ' + L + ' लीटर। ' + (why[p0.reason] || '');
    } else if (p0.action === 'rain') {
      s = 'आज पानी मत दो। बारिश आ रही है।';
    } else {
      s = 'आज पानी की ज़रूरत नहीं है।';
    }
    if (nextIrr) {
      s += ' अगली सिंचाई ' + speakDate(nextIrr.date, 'hi') + ' को है, ' + Math.round(nextIrr.mm) + ' मिलीमीटर।';
    } else if (p0.action !== 'irrigate') {
      s += ' अगले सात दिन सिंचाई की ज़रूरत नहीं है।';
    }
    return s;
  }

  const why = {
    cri: 'This is the most important irrigation for wheat.',
    soil: 'Soil moisture has dropped.',
    awd: 'The field has dried out, refill it.',
  };
  let s;
  if (p0.action === 'irrigate') {
    s = 'Water today. ' + mm0 + ' millimetres, which is about ' + L + ' litres. ' + (why[p0.reason] || '');
  } else if (p0.action === 'rain') {
    s = 'Do not water today. Rain is coming.';
  } else {
    s = 'No watering is needed today.';
  }
  if (nextIrr) {
    s += ' Next irrigation is on ' + speakDate(nextIrr.date, 'en') + ', ' + Math.round(nextIrr.mm) + ' millimetres.';
  } else if (p0.action !== 'irrigate') {
    s += ' No irrigation is needed in the next seven days.';
  }
  return s;
}