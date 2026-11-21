# JalSaathi (जलसाथी)

**Irrigation advice for small farmers, in Hindi and English, using real weather data.**

Built for the *Build for Bharat* hackathon. Track 7: Climate, Energy and Resource Efficiency.
Problem: Monitoring and Reducing Agricultural Water Footprint.

**Live demo:** [add Vercel link]  
**Demo video:** [add video link]  
**Team:** [team name, member names]

## The problem

In groundwater-stressed regions such as Punjab and Haryana, many small farmers irrigate on a fixed habit
(for example, every 10 days) without knowing how much water the crop actually needs that week.
Over-irrigation wastes water, diesel or electricity, and lowers the groundwater table.
Soil-moisture sensors are the usual fix, but they cost money and need maintenance, which a farmer
with under 2 hectares usually cannot afford.

## Who it is for

A small farmer growing **wheat** or **rice** who wants one clear answer every morning:
*water today, or not?*

## What it does

1. The farmer picks the field location (search or GPS), crop, soil type, sowing date and field size.
2. The app fetches **real weather data** for that exact location (past 30 days and next 7 days).
3. It runs a soil-water balance and tells the farmer:
   - **Water today / Don't water (rain coming) / No watering needed**, with millimetres and litres
   - A 7-day plan
   - Alerts for irrigation, rain and crop-stage changes
4. A savings screen compares the advice with the farmer's current habit, in litres.

The app works in **Hindi and English**, is mobile-first, and uses large buttons.

## How the advice is calculated

- **Weather:** [Open-Meteo](https://open-meteo.com/) daily rainfall and reference evapotranspiration (ET0).
- **Wheat:** FAO-56 method. Crop water use = ET0 x crop coefficient (Kc, by growth stage).
  A daily root-zone water balance triggers irrigation when the soil is depleted past the allowed fraction.
  The crown root initiation (CRI) stage, around 20 to 25 days after sowing, gets a dedicated irrigation.
- **Rice:** a simplified AWD (alternate wetting and drying) rule. The field is kept flooded at the
  sensitive stages and allowed to dry down in between.
- **Rain:** only rain of 2 mm or more counts, and 80 percent of it is treated as effective.
  If enough rain is forecast, the app says to skip irrigation.
- **Savings:** the same weather is replayed from the sowing date. The app compares the water used by
  its rule with the water used by the farmer's stated habit. Irrigation efficiency is assumed to be 70 percent.

## Assumptions and limitations (please read)

- All figures are **estimates**. This is a decision-support tool, not a measurement.
- Crop coefficients, root depths, soil water capacities, the CRI window and the AWD thresholds use
  standard FAO ranges and simplifications. They have **not been validated in a field trial**.
- Weather comes from a gridded model, not from the farmer's own field.
- The savings figure depends on the habit the farmer types in. It is a comparison with what
  the farmer says they do, not a measured saving.
- There is no login. Field data is stored only in the browser (localStorage) on the farmer's device.
- Only wheat and rice are supported at this stage.

## Run locally

```bash
git clone [           frgfg                                                vrvrgvgrtvrev                             ]
cd jalsaathi
npm install
npm run dev
```

No API keys are needed.

## Tech

React, Vite, Open-Meteo APIs (forecast and geocoding), deployed on Vercel.

## Credits

Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).
Method: FAO Irrigation and Drainage Paper 56.

## Next steps

More crops, SMS and WhatsApp alerts, more regional languages, voice input,
field validation with a Krishi Vigyan Kendra (KVK) or farmer groups (FPOs).