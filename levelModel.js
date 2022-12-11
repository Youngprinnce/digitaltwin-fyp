const mongoose = require('mongoose');

const waterLevelSchema = new mongoose.Schema({
  waterLevel: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Level', waterLevelSchema);
