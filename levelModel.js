const mongoose = require('mongoose');

const waterLevelSchema = new mongoose.Schema({
  waterLevel: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Level', waterLevelSchema);
