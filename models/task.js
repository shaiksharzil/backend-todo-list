const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  titleId: String, // Link to the TitleCard (use _id from title card)
  task: String,
  completed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Task", TaskSchema);
