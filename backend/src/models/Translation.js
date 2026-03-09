const mongoose = require("mongoose");

const TranslationSchema = new mongoose.Schema({
  language: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
});

module.exports = mongoose.model("Translation", TranslationSchema);