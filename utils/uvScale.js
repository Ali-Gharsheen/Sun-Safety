/**
 * uvScale.js
 * ----------
 * The WHO (World Health Organization) UV index scale, plus the advice we show
 * for each level. Keeping this in one place means the results page, the chart
 * and the UV Guide page all use exactly the same colours and wording.
 */

// Each level covers a range of (rounded) UV index values.
// "color" is the official WHO colour, "text" is a readable text colour on top of it.
export const UV_LEVELS = [
  {
    key: 'low',
    name: 'Low',
    min: 0,
    max: 2,
    color: '#3EA72D',
    text: '#ffffff',
    summary: 'Little danger from the sun for the average person.',
    advice: [
      'Wear sunglasses on bright days.',
      'If you burn easily, use sunscreen when outside for long periods.',
    ],
  },
  {
    key: 'moderate',
    name: 'Moderate',
    min: 3,
    max: 5,
    color: '#FFF300',
    text: '#1f2a37',
    summary: 'Some risk of harm from unprotected sun exposure.',
    advice: [
      'Stay in the shade around midday when the sun is strongest.',
      'Wear a shirt, a wide-brimmed hat and sunglasses.',
      'Apply sunscreen every 2 hours, and after swimming or sweating.',
    ],
  },
  {
    key: 'high',
    name: 'High',
    min: 6,
    max: 7,
    color: '#F18B00',
    text: '#1f2a37',
    summary: 'High risk of harm from unprotected sun exposure.',
    advice: [
      'Reduce time in the sun between late morning and mid-afternoon.',
      'Cover up with clothing, a wide-brimmed hat and UV-blocking sunglasses.',
      'Apply sunscreen generously every 2 hours.',
    ],
  },
  {
    key: 'very-high',
    name: 'Very High',
    min: 8,
    max: 10,
    color: '#E53210',
    text: '#ffffff',
    summary: 'Very high risk - unprotected skin can burn quickly.',
    advice: [
      'Avoid the sun during midday hours where you can.',
      'Seek shade; remember sand, water and snow reflect UV.',
      'Wear protective clothing, hat and sunglasses, plus sunscreen.',
    ],
  },
  {
    key: 'extreme',
    name: 'Extreme',
    min: 11,
    max: Infinity,
    color: '#B567A4',
    text: '#ffffff',
    summary: 'Extreme risk - unprotected skin can burn in minutes.',
    advice: [
      'Stay indoors or in full shade during midday hours if possible.',
      'Full protection is essential: clothing, hat, sunglasses and sunscreen.',
      'Reapply sunscreen often and check on children and older people.',
    ],
  },
];

/**
 * Find the WHO level for a UV index value.
 * UV index values are usually reported to one decimal place (e.g. 5.6),
 * while the WHO categories use whole numbers, so we round first.
 * @param {number} uv
 * @returns {object} one of the UV_LEVELS entries
 */
export function getUvLevel(uv) {
  const value = Math.max(0, Math.round(Number(uv) || 0));
  return UV_LEVELS.find((level) => value >= level.min && value <= level.max) || UV_LEVELS[0];
}

/**
 * Recommend a sunscreen strength based on the UV level and skin type.
 * Very fair skin (types 1 and 2) gets a stronger recommendation sooner.
 * @param {number} uv
 * @param {number} skinType 1-6
 * @returns {string}
 */
export function recommendSpf(uv, skinType) {
  const level = getUvLevel(uv).key;
  const fairSkin = skinType <= 2;

  if (level === 'low') {
    return fairSkin ? 'SPF 30 if you are outside for long' : 'Not usually needed';
  }
  if (level === 'moderate') {
    return fairSkin ? 'SPF 50+' : 'SPF 30+';
  }
  // High, Very High and Extreme
  return 'SPF 50+ (broad-spectrum)';
}
