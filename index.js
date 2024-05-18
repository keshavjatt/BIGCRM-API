const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());

// CORS setup with specific origin
app.use(cors({
  origin: 'http://localhost:3000', // replace with your frontend's URL
  credentials: true
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));