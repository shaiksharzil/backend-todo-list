const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const AdminModel = require("./models/admin");
const CardModel = require("./models/titleCard");
const TaskModel = require("./models/task");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const SECRET = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGO_URI);

app.post("/login", (req,res) => {
    const { username, password } = req.body
    AdminModel.findOne({ username: username }).then(user => {
        if (user && user.password === password) {
            const token = jwt.sign({ username }, SECRET, { expiresIn: "30d" })
            res.json({ message: "Success" , token,username})
        } else {
            res.json({ message: "username or password is incorrect" })
        }
    })
})

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await AdminModel.findOne({ username });

    if (existingUser) {
      return res.json({ message: "This username is already exist" });
    }

    const newUser = await AdminModel.create({ username, password });
    const token = jwt.sign({ username }, SECRET, { expiresIn: "30d" });

    return res.json({ message: "Success", token,username });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});


function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  const token = bearerHeader && bearerHeader.split(" ")[1];

  if (!token) return res.status(401).json("Access denied. No token provided.");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}


app.get("/", verifyToken, (req, res) => {
  res.json({ username: req.user.username });
});


app.post("/addcard", (req, res) => {
  const { userId, title } = req.body;
  CardModel.create({ userId, title })
    .then((card) => res.json(card))
    .catch((err) => res.status(500).json(err));
});

app.get("/cards/:userId", (req, res) => {
  CardModel.find({ userId: req.params.userId })
    .then((cards) => res.json(cards))
    .catch((err) => res.status(500).json(err));
});

app.get("/tasks/:titleId", (req, res) => {
  const { titleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(titleId)) {
    return res.status(400).json({ error: "Invalid title ID format" });
  }

  TaskModel.find({ titleId })
    .then((tasks) => res.json(tasks))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Add task under a specific title
app.post("/tasks", (req, res) => {
  const { titleId, task } = req.body;
  TaskModel.create({ titleId, task })
    .then((newTask) => res.json(newTask))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.get("/card/:titleId", (req, res) => {
  CardModel.findById(req.params.titleId)
    .then((card) => {
      if (!card) return res.status(404).json({ message: "Title not found" });
      res.json(card);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.delete("/tasks/:taskId", (req, res) => {
  TaskModel.findByIdAndDelete(req.params.taskId)
    .then(() => res.json({ message: "Task deleted" }))
    .catch((err) => res.status(500).json({ error: err.message }));
});
 
// Save checked state and input values
app.put("/tasks/save", async (req, res) => {
  const { tasks } = req.body;

  try {
    const updates = tasks.map((task) =>
      TaskModel.findByIdAndUpdate(
        task._id,
        {
          checked: task.checked,
          inputValue: task.details,
          task: task.task, // save inputValue from frontend
        },
        { new: true }
      )
    );

    const updatedTasks = await Promise.all(updates);
    res.json({ message: "Tasks updated", updatedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { task, checked, inputValue } = req.body;

  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      {
        ...(task !== undefined && { task }),
        ...(checked !== undefined && { checked }),
        ...(inputValue !== undefined && { inputValue }),
      },
      { new: true }
    );

    if (!updatedTask)
      return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task updated", task: updatedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/cards/:id", async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const updatedCard = await CardModel.findByIdAndUpdate(
      id,
      { title },
      { new: true }
    );
    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(updatedCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/tasks/byTitle/:titleId", async (req, res) => {
  try {
    const result = await TaskModel.deleteMany({ titleId: req.params.titleId });
    res.json({ message: "Tasks deleted", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/cards/:id", async (req, res) => {
  try {
    const deletedCard = await CardModel.findByIdAndDelete(req.params.id);
    if (!deletedCard)
      return res.status(404).json({ message: "Card not found" });
    res.json({ message: "Card deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(process.env.PORT, () => {
    console.log("server is running")
})