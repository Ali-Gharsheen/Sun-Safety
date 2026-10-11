/**
 * skinTypes.js
 * ------------
 * The six Fitzpatrick skin types. OpenUV returns a "safe exposure time" for each
 * of them, keyed st1 ... st6, so the "id" here matches those keys.
 */
export const SKIN_TYPES = [
  { id: 1, roman: 'I', label: 'Very fair', description: 'Always burns, never tans', swatch: '#F7E1CF' },
  { id: 2, roman: 'II', label: 'Fair', description: 'Burns easily, tans a little', swatch: '#EDC9A8' },
  { id: 3, roman: 'III', label: 'Medium', description: 'Sometimes burns, tans gradually', swatch: '#D4A47C' },
  { id: 4, roman: 'IV', label: 'Olive', description: 'Rarely burns, tans easily', swatch: '#B07D55' },
  { id: 5, roman: 'V', label: 'Brown', description: 'Very rarely burns, tans darkly', swatch: '#7E5236' },
  { id: 6, roman: 'VI', label: 'Dark brown / black', description: 'Almost never burns', swatch: '#4A3022' },
];

/**
 * Look up a skin type by its id (1-6). Returns undefined for anything else,
 * which lets the routes treat it as invalid input.
 * @param {number|string} id
 */
export function getSkinType(id) {
  return SKIN_TYPES.find((type) => type.id === Number(id));
}
