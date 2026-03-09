const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema({

  keyHash: {
    type: String,
    required: true,
    unique: true
  },

  orgId: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  active: {
    type: Boolean,
    default: true
  },

  expiresAt: {
    type: Date,
    default: (Date.now() + 10000000)
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

ApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ApiKey", ApiKeySchema);