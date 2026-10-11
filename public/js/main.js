/**
 * main.js (runs in the browser)
 * -----------------------------
 * Handles the "Use my location" button on the home page.
 *
 * 1. Make sure a skin type is chosen.
 * 2. Ask the browser for the user's position (the browser shows a permission prompt).
 * 3. Put the coordinates and the browser's timezone into hidden form fields.
 * 4. Submit the form - the server then skips the city lookup.
 *
 * It also checks the normal "Check UV" submit, so users get instant feedback
 * instead of a round-trip to the server for an empty form.
 */
(function () {
  const form = document.getElementById('search-form');
  if (!form) return; // not on the home page

  const cityInput = document.getElementById('city');
  const skinSelect = document.getElementById('skinType');
  const locationButton = document.getElementById('use-location');
  const status = document.getElementById('form-status');
  const latField = document.getElementById('lat');
  const lngField = document.getElementById('lng');
  const tzField = document.getElementById('tz');

  /** Show a message under the form (errors are styled red). */
  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  /** Returns true if a skin type is selected, otherwise focuses the dropdown. */
  function requireSkinType() {
    if (!skinSelect.value) {
      showStatus('Please choose your skin type first.', true);
      skinSelect.focus();
      return false;
    }
    return true;
  }

  // ---- Normal city search ------------------------------------------------
  form.addEventListener('submit', (event) => {
    // Clear coordinates left over from an earlier "Use my location" attempt,
    // so a typed city always wins.
    latField.value = '';
    lngField.value = '';

    if (cityInput.value.trim().length < 2) {
      event.preventDefault();
      showStatus('Please type a city name, or use your location.', true);
      cityInput.focus();
      return;
    }
    if (!requireSkinType()) {
      event.preventDefault();
      return;
    }
    showStatus('Looking up the UV index…');
  });

  // ---- "Use my location" -------------------------------------------------
  locationButton.addEventListener('click', () => {
    if (!requireSkinType()) return;

    if (!('geolocation' in navigator)) {
      showStatus("Your browser can't share its location. Please type a city instead.", true);
      return;
    }

    locationButton.disabled = true;
    showStatus('Finding your location…');

    navigator.geolocation.getCurrentPosition(
      // Success: fill the hidden fields and submit.
      (position) => {
        latField.value = position.coords.latitude.toFixed(4);
        lngField.value = position.coords.longitude.toFixed(4);
        tzField.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        showStatus('Got it! Looking up the UV index…');
        // form.submit() skips the submit listener above, which is what we want here.
        form.submit();
      },
      // Failure: explain what happened in plain words.
      (error) => {
        locationButton.disabled = false;
        const messages = {
          1: 'Location permission was denied. Allow it in your browser, or type a city instead.',
          2: "We couldn't work out your location. Please type a city instead.",
          3: 'Finding your location took too long. Please try again or type a city.',
        };
        showStatus(messages[error.code] || 'Something went wrong getting your location.', true);
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  });
})();
