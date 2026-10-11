/**
 * openuv.js
 * ---------
 * Every call to the OpenUV API lives in this file, so the rest of the app
 * never has to know about URLs, headers or the API key.
 *
 * Endpoints used (all need the "x-access-token" header):
 *   GET /uv          -> current UV index, today's peak, burn times per skin type
 *   GET /forecast    -> hourly UV forecast for the day
 *   GET /protection  -> the time window when UV is above a threshold
 *
 * Docs: https://www.openuv.io/uvindex
 */
import axios from 'axios';
import AppError from '../utils/AppError.js';
import { getCached, setCached } from './cache.js';

// UV index at which sun protection is recommended (the WHO "Moderate" level).
export const PROTECTION_THRESHOLD = 3;

/**
 * Create the Axios client lazily (on first use) rather than at import time.
 * This guarantees dotenv has already loaded the API key from .env.
 */
let client;
function getClient() {
  const apiKey = process.env.OPENUV_API_KEY;
  if (!apiKey) {
    // A setup problem, not the user's fault - log it clearly for the developer.
    console.error('[openuv] OPENUV_API_KEY is missing. Add it to your .env file.');
    throw new AppError('The UV service has not been set up yet. Please try again later.', 500);
  }

  if (!client) {
    client = axios.create({
      baseURL: 'https://api.openuv.io/api/v1',
      timeout: 10000,
      headers: { 'x-access-token': apiKey },
    });
  }
  return client;
}

/**
 * Convert an Axios error into an AppError with a message users understand.
 * The full technical reason is logged to the console for debugging.
 * @param {Error} error
 * @param {string} endpoint - which endpoint failed, for the log
 * @returns {AppError}
 */
function toFriendlyError(error, endpoint) {
  // Case 1: OpenUV answered, but with an error status code.
  if (error.response) {
    const { status, data } = error.response;
    const apiMessage = String(data?.error || data?.message || '');
    console.error(`[openuv] ${endpoint} responded ${status}: ${apiMessage}`);

    if (/quota|limit/i.test(apiMessage) || status === 429) {
      return new AppError(
        "We've reached today's limit of free UV lookups. Please try again tomorrow.",
        429,
      );
    }
    if (status === 401 || status === 403) {
      return new AppError(
        'The UV service did not accept our access key. The site owner needs to check the API key.',
        502,
      );
    }
    if (status === 400) {
      return new AppError('The UV service could not use that location. Please try a different place.', 400);
    }
    return new AppError('The UV service is having problems right now. Please try again shortly.', 502);
  }

  // Case 2: the request was sent but nothing came back (timeout, no internet, DNS).
  if (error.request) {
    console.error(`[openuv] ${endpoint} - no response:`, error.code || error.message);
    return new AppError(
      'We could not reach the UV service. Check your connection and try again.',
      503,
    );
  }

  // Case 3: something went wrong before the request was even sent.
  console.error(`[openuv] ${endpoint} - request setup failed:`, error.message);
  return new AppError('Something went wrong while preparing the UV request.', 500);
}

/**
 * Fetch the current UV, the forecast and the protection window together.
 * Promise.all runs the three requests at the same time, which is faster
 * than waiting for each one in turn.
 *
 * @param {{lat:number, lng:number, alt?:number}} location
 * @returns {Promise<{current:object, forecast:object[], protection:object, fetchedAt:string}>}
 */
export async function getUvReport({ lat, lng, alt = 0 }) {
  // Rounding to 2 decimals (about 1 km) lets nearby searches share a cache entry.
  const cacheKey = `uv:${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[openuv] Cache hit for ${cacheKey} - no API calls used.`);
    return cached;
  }

  const api = getClient();
  const params = { lat, lng, alt };

  // Wrap each request so we know which endpoint failed if one does.
  const request = (endpoint, extraParams = {}) =>
    api.get(endpoint, { params: { ...params, ...extraParams } }).catch((error) => {
      throw toFriendlyError(error, endpoint);
    });

  const [uvRes, forecastRes, protectionRes] = await Promise.all([
    request('/uv'),
    request('/forecast'),
    request('/protection', { from: PROTECTION_THRESHOLD, to: PROTECTION_THRESHOLD }),
  ]);

  // OpenUV wraps every payload in a "result" property.
  const report = {
    current: uvRes.data?.result || {},
    forecast: Array.isArray(forecastRes.data?.result) ? forecastRes.data.result : [],
    protection: protectionRes.data?.result || {},
    fetchedAt: new Date().toISOString(),
  };

  setCached(cacheKey, report);
  return report;
}
