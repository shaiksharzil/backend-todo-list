const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "Admin",
    required: true,
  },
  title: { type: String, required: true },
  time: String,
});

module.exports = mongoose.model("Card", CardSchema);