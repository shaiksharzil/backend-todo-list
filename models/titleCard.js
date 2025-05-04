const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "Admin",
    required: true,
  },
  title: { type: String, required: true },
});

module.exports = mongoose.model("Card", CardSchema);