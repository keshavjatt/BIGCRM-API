const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db.config");
const userRoutes = require("./routes/user.routes");
const assetRoutes = require("./routes/asset.routes");
const ticketRoutes = require("./routes/ticket.routes");
const pingRoutes = require("./routes/ping.routes");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};
app.use(cors(corsOptions));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/pingProgram", pingRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));