/**
 * SunSafety - entry point
 * -----------------------
 * Sets up the Express server: configuration, middleware, routes and error handling.
 *
 * Start it with:  npm run dev   (or: nodemon index.js)
 */

// Load variables from .env into process.env BEFORE anything reads them.
import 'dotenv/config';

import express from 'express';
import bodyParser from 'body-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';

// ES modules don't have __dirname built in, so we recreate it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// View engine: EJS templates live in /views
// ---------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
// Serve CSS, browser JavaScript and images from /public.
app.use(express.static(path.join(__dirname, 'public')));

// body-parser reads HTML form submissions into req.body.
app.use(bodyParser.urlencoded({ extended: true }));

// Values every template can use (e.g. the year in the footer, the current page).
app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  res.locals.currentPath = req.path;
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/', routes);

// ---------------------------------------------------------------------------
// 404 - no route matched
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Page not found',
    status: 404,
    heading: 'Page not found',
    message: "We couldn't find the page you were looking for.",
  });
});

// ---------------------------------------------------------------------------
// Central error handler - Express knows it's an error handler because it has
// 4 arguments. Any error passed to next(error), or thrown in an async route,
// ends up here.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Full details for the developer in the terminal...
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}`);
  console.error(err.details?.cause || err.stack || err);

  // ...but only a friendly message for the visitor.
  res.status(status).render('pages/error', {
    title: 'Something went wrong',
    status,
    heading: status === 429 ? 'Daily limit reached' : 'Something went wrong',
    message: err.userMessage || 'An unexpected error happened on our side. Please try again.',
  });
});

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`SunSafety is running at http://localhost:${PORT}`);
  if (!process.env.OPENUV_API_KEY) {
    console.warn('Warning: OPENUV_API_KEY is not set. UV lookups will fail until you add it to .env');
  }
});
