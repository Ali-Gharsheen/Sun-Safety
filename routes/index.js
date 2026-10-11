/**
 * routes/index.js
 * ---------------
 * All the pages of the site.
 *
 *   GET  /         -> home page with the search form
 *   POST /check    -> reads the form, works out the location, then redirects
 *   GET  /results  -> fetches UV data and shows the report
 *   GET  /guide    -> explains the UV scale and skin types
 *
 * Why POST /check and then redirect to GET /results?
 * This is the "Post/Redirect/Get" pattern: the results page gets a normal URL,
 * so refreshing it doesn't ask "resubmit form?", and it can be bookmarked or shared.
 */
import { Router } from 'express';
import { findCity } from '../services/geocode.js';
import { getUvReport } from '../services/openuv.js';
import { buildReport } from '../utils/report.js';
import { SKIN_TYPES, getSkinType } from '../utils/skinTypes.js';
import { UV_LEVELS } from '../utils/uvScale.js';
import { safeTimeZone } from '../utils/format.js';

const router = Router();

/**
 * Re-show the home page with an error message and whatever the user typed,
 * so they don't have to fill the form in again.
 */
function renderHomeWithError(res, status, message, values = {}) {
  return res.status(status).render('pages/index', {
    title: 'Check the UV index',
    skinTypes: SKIN_TYPES,
    error: message,
    values,
  });
}

/** Check a latitude/longitude pair is real numbers within valid ranges. */
function parseCoordinates(latInput, lngInput) {
  const lat = Number.parseFloat(latInput);
  const lng = Number.parseFloat(lngInput);
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;
  return valid ? { lat, lng } : null;
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  res.render('pages/index', {
    title: 'Check the UV index',
    skinTypes: SKIN_TYPES,
    error: null,
    values: {},
  });
});

// ---------------------------------------------------------------------------
// Form submission - req.body is filled in by body-parser (see index.js)
// ---------------------------------------------------------------------------
router.post('/check', async (req, res, next) => {
  const city = String(req.body.city || '').trim();
  const skinId = req.body.skinType;
  const values = { city, skinType: skinId };

  // 1. Validate the skin type first - it is needed either way.
  const skin = getSkinType(skinId);
  if (!skin) {
    return renderHomeWithError(res, 400, 'Please choose your skin type.', values);
  }

  try {
    let location;

    // 2a. "Use my location" sends coordinates from the browser.
    if (req.body.lat && req.body.lng) {
      const coords = parseCoordinates(req.body.lat, req.body.lng);
      if (!coords) {
        return renderHomeWithError(res, 400, 'Your location looked invalid. Please search for a city instead.', values);
      }
      location = {
        ...coords,
        alt: 0,
        label: 'Your location',
        timezone: safeTimeZone(req.body.tz), // the browser's timezone
      };
    } else {
      // 2b. Otherwise we need a city name to look up.
      if (city.length < 2 || city.length > 100) {
        return renderHomeWithError(res, 400, 'Please enter a city name (at least 2 letters).', values);
      }
      location = await findCity(city);
    }

    // 3. Send the browser to the results page with everything in the URL.
    const query = new URLSearchParams({
      lat: location.lat.toFixed(4),
      lng: location.lng.toFixed(4),
      alt: String(location.alt || 0),
      place: location.label,
      tz: location.timezone,
      skin: String(skin.id),
    });
    return res.redirect(`/results?${query}`);
  } catch (error) {
    // Expected problems (city not found, geocoder down) go back to the form.
    if (error.userMessage) {
      return renderHomeWithError(res, error.status, error.userMessage, values);
    }
    // Anything unexpected goes to the central error handler in index.js.
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// Results page
// ---------------------------------------------------------------------------
router.get('/results', async (req, res, next) => {
  // The query string can be edited by hand, so validate it again here.
  const coords = parseCoordinates(req.query.lat, req.query.lng);
  const skin = getSkinType(req.query.skin);

  if (!coords || !skin) {
    return renderHomeWithError(
      res,
      400,
      'That results link is missing some details. Please search again.',
    );
  }

  const alt = Math.max(0, Number.parseInt(req.query.alt, 10) || 0);
  const timeZone = safeTimeZone(req.query.tz);
  const place = String(req.query.place || 'Selected location').slice(0, 120);

  try {
    const raw = await getUvReport({ ...coords, alt });
    const report = buildReport(raw, { place, ...coords, timeZone, skin });

    res.render('pages/results', {
      title: `UV index for ${place}`,
      report,
      skinTypes: SKIN_TYPES,
      // Used by the "change skin type" form on the results page.
      query: { lat: req.query.lat, lng: req.query.lng, alt, place, tz: timeZone },
    });
  } catch (error) {
    // Hand API errors to the central error handler, which shows a friendly page.
    next(error);
  }
});

// ---------------------------------------------------------------------------
// UV Guide page
// ---------------------------------------------------------------------------
router.get('/guide', (req, res) => {
  res.render('pages/guide', {
    title: 'UV Guide',
    levels: UV_LEVELS,
    skinTypes: SKIN_TYPES,
  });
});

export default router;
