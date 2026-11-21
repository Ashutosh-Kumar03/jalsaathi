// Bolkar salaah (browser ki built-in voice, koi API key ya paisa nahi)

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
  
  // Is bhasha ki sabse achhi voice dhundho (na mile to null)
  export function pickVoice(lang) {
    if (!speechSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    const base = lang === 'hi' ? 'hi' : 'en';
    const preferred = lang === 'hi' ? 'hi-in' : 'en-in';
    const exact = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === preferred);
    if (exact) return exact;
    return voices.find((v) => v.lang.toLowerCase().startsWith(base)) || null;
  }
  
  export function stopSpeaking() {
    if (speechSupported()) window.speechSynthesis.cancel();
  }
  
  export function speak(text, lang, onEnd) {
    if (!speechSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 0.9;
    u.onend = () => onEnd && onEnd();
    u.onerror = () => onEnd && onEnd();
    synth.speak(u);
  }
  
  export const SPEECH_LABELS = {
    hi: {
      listen: '🔊 सुनें',
      stop: '⏹ रोकें',
      noVoice: 'इस फ़ोन में हिंदी आवाज़ नहीं है। (सेटिंग में Text-to-speech से हिंदी आवाज़ जोड़ सकते हैं।)',
    },
    en: {
      listen: '🔊 Listen',
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
    const L = Math.round(p0.litres);
  
    if (lang === 'hi') {
      const why = {
        cri: 'यह गेहूं की सबसे ज़रूरी सिंचाई है।',
        soil: 'मिट्टी में नमी कम हो गई है।',
        awd: 'खेत सूख गया है, फिर से पानी भरें।',
      };
      let s;
      if (p0.action === 'irrigate') {
        s = 'आज पानी दो। ' + p0.mm + ' मिलीमीटर, यानी ' + L + ' लीटर। ' + (why[p0.reason] || '');
      } else if (p0.action === 'rain') {
        s = 'आज पानी मत दो। बारिश आ रही है।';
      } else {
        s = 'आज पानी की ज़रूरत नहीं है।';
      }
      if (nextIrr) {
        s += ' अगली सिंचाई ' + speakDate(nextIrr.date, 'hi') + ' को, ' + nextIrr.mm + ' मिलीमीटर।';
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
      s = 'Water today. ' + p0.mm + ' millimetres, which is ' + L + ' litres. ' + (why[p0.reason] || '');
    } else if (p0.action === 'rain') {
      s = 'Do not water today. Rain is coming.';
    } else {
      s = 'No watering is needed today.';
    }
    if (nextIrr) {
      s += ' Next irrigation is on ' + speakDate(nextIrr.date, 'en') + ', ' + nextIrr.mm + ' millimetres.';
    } else if (p0.action !== 'irrigate') {
      s += ' No irrigation is needed in the next seven days.';
    }
    return s;
  }