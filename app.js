require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const User = require("./models/User");
const Weather = require("./models/Weather");

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create User
app.post("/users", async (req, res) => {
  try {
    const { name, email, location } = req.body;
    const user = new User({ name, email, location });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Location
app.patch("/users/:id/location", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { location: req.body.location },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Weather Data for a User and Store it
async function fetchWeather() {
  const users = await User.find();
  users.forEach(async (user) => {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${user.location}&units=metric&appid=${process.env.API_KEY}`;
    try {
      const response = await axios.get(url);
      const weather = new Weather({
        userId: user._id,
        location: user.location,
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        timestamp: new Date(),
      });
      await weather.save();
    } catch (error) {
      console.error("Weather fetch error:", error.message);
    }
  });
}

// Schedule weather fetching every 3 hours
cron.schedule("0 */3 * * *", fetchWeather);

// Get Weather Data for a Given Date
app.get("/weather/:id", async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const weatherData = await Weather.find({
      userId: req.params.id,
      timestamp: { $gte: start, $lte: end },
    });
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
