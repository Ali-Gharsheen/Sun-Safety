/**
 * AppError
 * --------
 * A small custom error class used across the app.
 *
 * Why? A normal Error only has a technical message. We want two things:
 *   1. an HTTP status code (404, 429, 502 ...) so the error page responds correctly
 *   2. a friendly "userMessage" that is safe to show to visitors
 *
 * The technical details still go to the console (see the error handler in index.js),
 * so developers can debug without exposing internals to users.
 */
export default class AppError extends Error {
  /**
   * @param {string} userMessage - plain-language message shown on the page
   * @param {number} status      - HTTP status code for the response
   * @param {object} [details]   - optional extra info that is only logged
   */
  constructor(userMessage, status = 500, details = {}) {
    super(userMessage);
    this.name = 'AppError';
    this.status = status;
    this.userMessage = userMessage;
    this.details = details;
  }
}
