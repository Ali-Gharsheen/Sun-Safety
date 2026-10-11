/**
 * report.js
 * ---------
 * Turns the raw OpenUV data into a tidy "view model" for the results page.
 *
 * Doing this work here (instead of inside the EJS template) keeps the template
 * simple: it only has to print values, not calculate them.
 */
import { getUvLevel, recommendSpf, UV_LEVELS } from './uvScale.js';
import { formatTime, formatDateTime, formatDuration, formatUv } from './format.js';
import { PROTECTION_THRESHOLD } from '../services/openuv.js';

/**
 * @param {object} raw        - result of getUvReport()
 * @param {object} options
 * @param {string} options.place    - label to show, e.g. "Multan, Punjab, Pakistan"
 * @param {number} options.lat
 * @param {number} options.lng
 * @param {string} options.timeZone - IANA timezone of the place
 * @param {object} options.skin     - entry from SKIN_TYPES
 */
export function buildReport(raw, { place, lat, lng, timeZone, skin }) {
  const { current, forecast, protection } = raw;

  // ---- Current UV --------------------------------------------------------
  const uv = Number(current.uv) || 0;
  const level = getUvLevel(uv);
  // Position of the marker on the colour bar (0-12 mapped to 0-100%).
  const markerPercent = Math.min(uv, 12) / 12 * 100;

  // ---- Today's peak ------------------------------------------------------
  const uvMax = Number(current.uv_max) || 0;

  // ---- Burn time for the chosen skin type --------------------------------
  // OpenUV gives minutes until burning WITHOUT sunscreen, as st1 ... st6.
  // It is null when the UV is too low to cause sunburn.
  const burnMinutes = current.safe_exposure_time?.[`st${skin.id}`];
  const burnTime = burnMinutes ? formatDuration(burnMinutes) : null;

  // ---- Protection window -------------------------------------------------
  // If UV never reaches the threshold today, OpenUV returns no times.
  const hasWindow = Boolean(protection.from_time && protection.to_time);
  const protectionWindow = {
    needed: hasWindow,
    threshold: PROTECTION_THRESHOLD,
    from: hasWindow ? formatTime(protection.from_time, timeZone) : null,
    to: hasWindow ? formatTime(protection.to_time, timeZone) : null,
  };

  // ---- Hourly forecast (for the chart and table) -------------------------
  const hourly = forecast
    .filter((entry) => entry && entry.uv_time)
    .map((entry) => {
      const value = Math.max(0, Number(entry.uv) || 0);
      const entryLevel = getUvLevel(value);
      return {
        time: formatTime(entry.uv_time, timeZone),
        uv: Number(value.toFixed(1)),
        level: entryLevel.name,
        color: entryLevel.color,
        textColor: entryLevel.text,
      };
    });

  // ---- Sun times ---------------------------------------------------------
  const sunTimes = current.sun_info?.sun_times || {};

  return {
    place,
    coords: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    timeZone,
    localNow: formatDateTime(new Date(), timeZone),
    updatedAt: formatTime(current.uv_time || raw.fetchedAt, timeZone),

    current: {
      uv: formatUv(uv),
      level,
      markerPercent,
    },
    peak: {
      uv: formatUv(uvMax),
      time: formatTime(current.uv_max_time, timeZone),
      level: getUvLevel(uvMax),
    },
    skin: {
      ...skin,
      burnTime,
      spf: recommendSpf(Math.max(uv, uvMax), skin.id),
    },
    protection: protectionWindow,
    sun: {
      sunrise: formatTime(sunTimes.sunrise, timeZone),
      solarNoon: formatTime(sunTimes.solarNoon, timeZone),
      sunset: formatTime(sunTimes.sunset, timeZone),
    },
    ozone: current.ozone ? Math.round(current.ozone) : null,
    hourly,
    scale: UV_LEVELS,
  };
}
