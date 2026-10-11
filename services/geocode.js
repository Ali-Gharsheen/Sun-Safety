/**
 * geocode.js
 * ----------
 * Turns a city name into coordinates.
 *
 * OpenUV only understands latitude/longitude, so when a user types "Lahore"
 * we first ask the free Open-Meteo Geocoding API where Lahore is.
 * It needs no API key and also gives us the city's timezone and elevation,
 * which we use to show local times and to make the UV reading more accurate.
 *
 * Docs: https://open-meteo.com/en/docs/geocoding-api
 */
import axios from 'axios';
import AppError from '../utils/AppError.js';
import { getCached, setCached } from './cache.js';

// A dedicated Axios instance with a base URL and a timeout,
// so a slow response can't leave the user waiting forever.
const geoClient = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com/v1',
  timeout: 8000,
});

/**
 * Look up a city by name.
 * @param {string} city - what the user typed, e.g. "Multan"
 * @returns {Promise<{name:string, label:string, lat:number, lng:number, alt:number, timezone:string}>}
 * @throws {AppError} 404 if no match, 503 if the service can't be reached
 */
export async function findCity(city) {
  const cacheKey = `geo:${city.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let response;
  try {
    response = await geoClient.get('/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
    });
  } catch (error) {
    // Network problem, timeout, or the geocoding service returned an error.
    console.error('[geocode] Request failed:', error.code || error.message);
    throw new AppError(
      'We could not look up that city right now. Please try again in a moment, or use your location instead.',
      503,
      { cause: error.message },
    );
  }

  // Open-Meteo leaves out "results" entirely when nothing matches.
  const match = response.data?.results?.[0];
  if (!match) {
    throw new AppError(
      `We couldn't find a place called "${city}". Check the spelling or try a nearby larger city.`,
      404,
    );
  }

  // Build a readable label such as "Multan, Punjab, Pakistan" (skipping blank parts).
  const label = [match.name, match.admin1, match.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');

  const place = {
    name: match.name,
    label,
    lat: match.latitude,
    lng: match.longitude,
    alt: Math.max(0, Math.round(match.elevation || 0)), // metres above sea level
    timezone: match.timezone || 'UTC',
  };

  // City coordinates never change, so cache them for a whole day.
  setCached(cacheKey, place, 24 * 60 * 60 * 1000);
  return place;
}
