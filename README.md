# ☀️ SunSafety

SunSafety is a small website that tells you how strong the sun is right now, anywhere in the world.
Type a city (or use your current location), pick your skin type, and you get:

- **The live UV index**, colour-coded on the official WHO scale (Low → Extreme)
- **Today's peak UV**, plus sunrise, solar noon, sunset and ozone level
- **Sunscreen hours**: the time window today when UV is 3 or higher
- **Advice for your skin type**: minutes until you'd burn without sunscreen, a suggested SPF, and what to do now
- **An hourly UV forecast** as a colour-coded bar chart, with the exact numbers in a table
- **A UV Guide** page explaining the scale and the six skin types

Built with **Node.js, Express, Axios and EJS**, using the [OpenUV API](https://www.openuv.io/).

---

## Quick start

You need **Node.js 18 or newer** (check with `node -v`).

```bash
# 1. Go into the project folder
cd sunsafety

# 2. Install the dependencies
npm i

# 3. Start the server (restarts automatically when you edit files)
nodemon index.js
```

Then open **http://localhost:3000** in your browser.

> **Don't have nodemon?** Either install it once globally with `npm i -g nodemon`,
> or use the copy that `npm i` already installed in the project: `npm run dev`.
> To run without nodemon at all: `npm start` (same as `node index.js`).

### The API key

The project reads your OpenUV key from a file called **`.env`** in the project root:

```
OPENUV_API_KEY=your-openuv-api-key-here
PORT=3000
```

The included `.env` already contains your key. If you ever need to recreate it,
copy `.env.example` to `.env` and paste your key in. `.env` is listed in `.gitignore`,
so it will **not** be uploaded if you push the project to GitHub.

### Available commands

| Command          | What it does                                     |
| ---------------- | ------------------------------------------------ |
| `npm i`          | Installs everything listed in `package.json`     |
| `nodemon index.js` | Starts the server and restarts it on file changes |
| `npm run dev`    | Same as above, using the project's own nodemon    |
| `npm start`      | Starts the server with plain Node (used when deployed) |

---

## How it works

```
Browser                    SunSafety server (Express)                 External APIs
───────                    ──────────────────────────                 ─────────────
Home page form  ──POST /check──▶  validate input
                                  city typed?  ──Axios──▶ Open-Meteo Geocoding (name → lat/lng, timezone)
                                  "my location"? use browser's lat/lng
                ◀──redirect──     /results?lat=..&lng=..&skin=..
GET /results    ──────────────▶  cache hit? reuse it
                                  otherwise ──Axios (3 calls at once)──▶ OpenUV /uv, /forecast, /protection
                                  build report (local times, WHO level, advice)
                ◀──EJS page──     render results.ejs
```

- **Post/Redirect/Get:** the form posts to `/check`, which redirects to `/results?...`.
  This means refreshing the results page doesn't resubmit the form, and the link can be bookmarked.
- **Local times:** OpenUV returns times in UTC. SunSafety converts them to the searched
  city's timezone (from Open-Meteo), or to your browser's timezone for "Use my location".
- **Saving your API quota:** the free OpenUV plan has a small daily request limit, and each
  search uses 3 requests. Results are cached in memory for 15 minutes per location
  (city lookups for 24 hours), so refreshes and repeat searches cost nothing. The cache is
  cleared when the server restarts.

---

## Project structure

```
sunsafety/
├── index.js                 # Entry point: Express setup, middleware, 404 + error handler
├── routes/
│   └── index.js             # Pages: /, /check, /results, /guide
├── services/
│   ├── openuv.js            # All OpenUV API calls (Axios) + friendly error messages
│   ├── geocode.js           # City name → coordinates (Open-Meteo, Axios)
│   └── cache.js             # Tiny in-memory cache with expiry
├── utils/
│   ├── AppError.js          # Error class carrying an HTTP status + user-friendly message
│   ├── report.js            # Turns raw API data into what the results page displays
│   ├── uvScale.js           # WHO UV levels, colours, advice and SPF suggestion
│   ├── skinTypes.js         # The six Fitzpatrick skin types
│   └── format.js            # Time, duration and number formatting
├── views/
│   ├── pages/               # index.ejs, results.ejs, guide.ejs, error.ejs
│   └── partials/            # header.ejs, footer.ejs, searchForm.ejs
├── public/
│   ├── css/styles.css       # All styling (responsive)
│   ├── js/main.js           # "Use my location" button + form checks (browser)
│   ├── js/forecast-chart.js # Draws the forecast chart with Chart.js (browser)
│   └── images/favicon.svg
├── .env                     # Your API key (never commit this)
├── .env.example             # Template for .env
├── .gitignore
├── package.json
└── README.md
```

---

## Error handling

Errors are logged in full to the terminal for you, while visitors only see plain-language messages.

| Situation | What the user sees |
| --- | --- |
| No skin type chosen / city name too short | Message on the form, with their input kept |
| City not found | "We couldn't find a place called …" on the form |
| Location permission denied in the browser | Explanation under the form, suggesting a city search |
| Geocoding service down | Message on the form, suggesting "Use my location" |
| OpenUV daily limit reached | "Daily limit reached" page asking them to try tomorrow |
| Invalid or missing API key | Error page; the terminal says to check `OPENUV_API_KEY` |
| OpenUV slow or unreachable (10 s timeout) | "We could not reach the UV service" page |
| Edited or broken results link | Back to the form with "That results link is missing some details" |
| Unknown page | Styled 404 page |
| Chart.js fails to load | Chart hidden, hourly table opened automatically |
| No forecast (e.g. polar night) / UV too low to burn | Clear "not needed" / "no burn risk" messages instead of empty values |

---

## Deploying for free (Render)

[Render](https://render.com/) offers a free tier for Node.js web services, deployed straight from GitHub,
with no credit card needed. The catch: a free service **goes to sleep after 15 minutes
without visitors**, and the next visit takes about a minute to wake it up. That's fine for a
portfolio or bootcamp project. (Free tier details checked October 2026; they can change, so see
[render.com/docs/free](https://render.com/docs/free).)

1. **Push the project to GitHub.** `.gitignore` keeps `.env` and `node_modules` out.
   Double-check on GitHub that `.env` is *not* in the repository.
2. Sign in to Render and choose **New → Web Service**, then connect your GitHub repository.
3. Fill in the settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Under **Environment Variables**, add `OPENUV_API_KEY` with your key as the value.
   (Don't set `PORT`; Render provides it, and the app already reads `process.env.PORT`.)
5. Click **Deploy**. When it finishes, Render gives you a public URL like
   `https://sunsafety.onrender.com`.

> "Use my location" only works on **https** pages or on `localhost`. Render gives you https
> automatically, so it works there too.

---

## Notes and limitations

- UV readings and burn times come from OpenUV and are estimates. SunSafety gives general
  guidance, not medical advice.
- When you use your location, the page shows your coordinates rather than a place name.
- If the API key is ever exposed publicly, generate a new one in your OpenUV dashboard
  and update `.env` (and the Render environment variable).

## Credits

- UV data: [OpenUV](https://www.openuv.io/)
- City search: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- Charts: [Chart.js](https://www.chartjs.org/)
- Fonts: Fraunces and Inter from Google Fonts
