// api/index.js
import app from '../src/server/index';

// Export a serverless handler
export default async function handler(req, res) {
  // Forward the request to your Express app
  return app(req, res);
}