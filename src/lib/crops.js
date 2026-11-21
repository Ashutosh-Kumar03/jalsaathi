
export const SOILS = {
    sandy: { hi: 'रेतीली', en: 'Sandy', awc: 90, perc: 8 }, // awc = mm paani per meter mitti, perc = dhaan me roz ka risaav (mm)
    loam: { hi: 'दोमट', en: 'Loam', awc: 140, perc: 4 },
    clay: { hi: 'चिकनी', en: 'Clay', awc: 170, perc: 2 },
  };
  
  export const CROPS = {
    wheat: {
      hi: 'गेहूं',
      en: 'Wheat',
      type: 'upland', // normal sinchai
      stages: [20, 30, 45, 25], // ini, development, mid, late (din)
      kc: [0.3, 1.15, 0.4], // ini, mid, end
      rootStart: 0.3, // meter
      rootMax: 1.0,
      p: 0.55, // mitti ka kitna hissa sukhne par paani dena hai
    },
    rice: {
      hi: 'धान',
      en: 'Rice',
      type: 'ponded', // paani bhara khet (AWD rule)
      stages: [20, 30, 45, 25],
      kc: [1.05, 1.2, 0.75],
      rootStart: 0.2,
      rootMax: 0.4,
      p: 0.2,
    },
  };
  
  export function totalDays(crop) {
    return CROPS[crop].stages.reduce((a, b) => a + b, 0);
  }
  
  function lerp(a, b, t) {
    const x = Math.min(1, Math.max(0, t));
    return a + (b - a) * x;
  }
  
  // Buwai ke 'd' din baad fasal ka Kc
  export function kcAt(cropKey, d) {
    const c = CROPS[cropKey];
    const [ini, dev, mid, late] = c.stages;
    const [kIni, kMid, kEnd] = c.kc;
    if (d < ini) return kIni;
    if (d < ini + dev) return lerp(kIni, kMid, (d - ini) / dev);
    if (d < ini + dev + mid) return kMid;
    return lerp(kMid, kEnd, (d - ini - dev - mid) / late);
  }
  
  // Buwai ke 'd' din baad jad ki gehraai (meter)
  export function rootDepthAt(cropKey, d) {
    const c = CROPS[cropKey];
    const growDays = c.stages[0] + c.stages[1];
    return lerp(c.rootStart, c.rootMax, d / growDays);
  }
  
  // Fasal ki stage ka naam
  export function stageAt(cropKey, d) {
    const [ini, dev, mid] = CROPS[cropKey].stages;
    if (d < ini) return { hi: 'शुरुआती', en: 'Initial' };
    if (d < ini + dev) return { hi: 'बढ़वार', en: 'Development' };
    if (d < ini + dev + mid) return { hi: 'मध्य (सबसे ज़्यादा पानी)', en: 'Mid-season (peak water)' };
    return { hi: 'पकने की स्टेज', en: 'Late season' };
  }