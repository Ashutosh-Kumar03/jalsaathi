// JalSaathi advice engine
// Method: FAO-56 soil water balance (gehun) + simplified AWD rule (dhaan)
// Ye ek estimate hai, khet ka exact naap nahi.

import { CROPS, SOILS, kcAt, rootDepthAt, stageAt, totalDays } from './crops.js';

export const ACRE_M2 = 4047; // 1 acre = 4047 m2, 1 mm paani 1 m2 par = 1 litre
const RICE_PONDING_MM = 50;
const RICE_MAX_MM = 100;
const RICE_DRY_LIMIT_MM = -30; // AWD: itna sukhne par dobara paani
const APP_EFFICIENCY = 0.7; // sinchai ka kitna paani fasal tak pahunchta hai (approx)
const CRI_FROM = 20; // gehun: Crown Root Initiation window (buwai ke din)
const CRI_TO = 25;
const CRI_MIN_MM = 40;

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
}

// 2 mm se kam baarish ignore, baaki ka 80% khet ke kaam aata hai
function effRain(r) {
  return !r || r < 2 ? 0 : r * 0.8;
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

// Agar kisi din ka ET0 missing ho to sabse paas ke din ka le lete hain
function fillEt0(days) {
  const out = days.map((d) => ({ ...d }));
  let last = null;
  for (const d of out) {
    if (d.et0 != null) last = d.et0;
    else if (last != null) d.et0 = last;
  }
  let next = null;
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].et0 != null) next = out[i].et0;
    else if (next != null) out[i].et0 = next;
  }
  return out;
}

// startIdx se shuru karke har din ka water balance chalata hai.
// actionFrom se pehle ke din sirf track hote hain, sinchai sirf usi din se suggest hoti hai.
function simulate(ctx, startIdx, actionFrom) {
  const { days, crop, c, s, sowDate, todayIndex } = ctx;
  const isUpland = c.type === 'upland';
  let state = isUpland ? 0 : RICE_PONDING_MM; // gehun: kami (mm), dhaan: khet me paani ki gehraai (mm)
  let lastIrrIdx = startIdx;
  let criDone = false;
  let todayStatus = null;
  const rows = [];

  for (let i = startIdx; i < days.length; i++) {
    const day = days[i];
    const dn = daysBetween(sowDate, day.date);
    const etc = kcAt(crop, dn) * day.et0;
    const er = effRain(day.rain);
    const nextEr = i + 1 < days.length ? effRain(days[i + 1].rain) : 0;
    const canAct = i >= actionFrom;
    let action = 'none';
    let reason = null;
    let mm = 0;
    let percToday = 0;

    if (isUpland) {
      const taw = s.awc * rootDepthAt(crop, dn);
      const raw = c.p * taw;
      const dr = clamp(state, 0, taw);
      if (i === todayIndex) todayStatus = { availPct: Math.round((1 - dr / taw) * 100) };

      const inCri = crop === 'wheat' && dn >= CRI_FROM && dn <= CRI_TO && !criDone && i - lastIrrIdx >= 10;
      const soilDry = dr >= raw;

      if (canAct && (soilDry || inCri)) {
        const need = soilDry ? dr : Math.max(dr, CRI_MIN_MM);
        if (er + nextEr >= 0.6 * need) {
          action = 'rain';
        } else {
          action = 'irrigate';
          reason = soilDry ? 'soil' : 'cri';
          mm = need;
          state = 0;
          lastIrrIdx = i;
          if (inCri) criDone = true;
        }
      }
      state = clamp(state + etc - er, 0, taw);
    } else {
      if (i === todayIndex) todayStatus = { depthMm: Math.round(state) };
      const [ini, dev] = c.stages;
      const sensitive = dn < ini || (dn >= ini + dev && dn < ini + dev + 15);
      const trigger = sensitive ? 0 : RICE_DRY_LIMIT_MM;
      if (canAct && state <= trigger) {
        const need = RICE_PONDING_MM - state;
        if (er + nextEr >= 0.6 * need) {
          action = 'rain';
        } else {
          action = 'irrigate';
          reason = 'awd';
          mm = need;
          state = RICE_PONDING_MM;
          lastIrrIdx = i;
        }
      }
      percToday = state > 0 ? s.perc : 0;
      state = clamp(state + er - etc - percToday, -100, RICE_MAX_MM);
    }

    rows.push({ i, date: day.date, rain: day.rain, et0: day.et0, etc, er, action, reason, mm, perc: percToday, flood: s.perc, dn });
  }
  return { rows, todayStatus };
}

export function runAdvisor(input) {
  const { crop, soil, sowDate, lastIrrigation, areaAcres, habitDays, habitMm, todayIndex } = input;
  const c = CROPS[crop];
  const s = SOILS[soil];
  if (!c || !s) throw new Error('Fasal ya mitti ka type galat hai');

  const days = fillEt0(input.days);
  if (days.some((d) => d.et0 == null)) throw new Error('ET0 data nahi mila');

  const todayDate = days[todayIndex].date;
  const dayNumToday = daysBetween(sowDate, todayDate);
  if (dayNumToday < 0) throw new Error('Buwai ki date aaj se pehle ki honi chahiye');
  const total = totalDays(crop);
  if (dayNumToday > total) return { finished: true, dayNumToday, total };

  const areaM2 = (areaAcres || 0) * ACRE_M2;
  const ctx = { days, crop, c, s, sowDate, todayIndex };

  // 1) Aaj ki salah aur 7 din ka plan: buwai ya aakhri sinchai se shuru
  const sowIdxRaw = days.findIndex((d) => d.date === sowDate);
  const sowIdx = sowIdxRaw >= 0 ? sowIdxRaw : 0;
  let startIdx = sowIdx;
  if (lastIrrigation) {
    const li = days.findIndex((d) => d.date === lastIrrigation);
    if (li >= 0 && li <= todayIndex && li >= startIdx) startIdx = li;
  }
  const main = simulate(ctx, startIdx, todayIndex);
  const plan = main.rows
    .filter((r) => r.i >= todayIndex)
    .slice(0, 7)
    .map((r) => ({
      date: r.date,
      dayNum: r.dn,
      rain: r.rain,
      et0: r.et0,
      etc: round1(r.etc),
      action: r.action,
      reason: r.reason,
      mm: round1(r.mm),
      litres: Math.round(r.mm * areaM2),
    }));

  // 2) Bachat: buwai se (ya data ke 30 din pehle se) agle 7 din tak, hamara rule vs kisaan ki aadat
  const audit = simulate(ctx, sowIdx, sowIdx).rows;
  const windowDays = audit.length;
  let savings = null;
  if (windowDays >= 7) {
    const ourMm = audit.reduce((a, r) => a + r.mm, 0) / APP_EFFICIENCY;
    let baseMm = null;
    if (c.type === 'upland') {
      if (habitDays > 0 && habitMm > 0) baseMm = Math.floor(windowDays / habitDays) * habitMm;
    } else {
      baseMm = audit.reduce((a, r) => a + Math.max(0, r.etc + r.flood - r.er), 0) / APP_EFFICIENCY;
    }
    if (baseMm != null) {
      const saved = baseMm - ourMm;
      savings = {
        baselineLitres: Math.round(baseMm * areaM2),
        ourLitres: Math.round(ourMm * areaM2),
        savedLitres: Math.max(0, Math.round(saved * areaM2)),
        savedPct: baseMm > 0 ? Math.max(0, Math.round((saved / baseMm) * 100)) : 0,
        windowDays,
        isEstimate: true,
      };
    }
  }

  return {
    finished: false,
    crop,
    todayDate,
    dayNumToday,
    seasonDays: total,
    stage: stageAt(crop, dayNumToday),
    status: main.todayStatus,
    plan,
    savings,
    assumptions: { appEfficiency: APP_EFFICIENCY, effectiveRainPct: 80 },
  };
}