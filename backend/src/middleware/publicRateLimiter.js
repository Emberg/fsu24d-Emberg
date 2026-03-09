const rateLimit = require("express-rate-limit");

const publicRateLimiter = rateLimit({

  windowMs: 60 * 1000, // 1 minute

  max: 100, // 100 requests per minute

  standardHeaders: true,
  legacyHeaders: false

});

module.exports = publicRateLimiter;