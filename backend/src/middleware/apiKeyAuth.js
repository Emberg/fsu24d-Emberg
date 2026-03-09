const ApiKey = require("../models/ApiKey");
const { hashApiKey } = require("../utils/apiKey");

async function apiKeyAuth(req, res, next) {

  const key = req.headers["x-api-key"];

  if (!key) {
    return res.status(401).json({ message: "API key required" });
  }

  const keyHash = hashApiKey(key);

  const apiKey = await ApiKey.findOne({
    keyHash,
    active: true
  });

  if (!apiKey) {
    return res.status(403).json({ message: "Invalid API key" });
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return res.status(403).json({ message: "API key expired" });
  }

  req.orgId = apiKey.orgId;
  req.apiKey = apiKey;

  next();
}

module.exports = apiKeyAuth;