const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../model/user.model");

module.exports = async function (req, res, next) {
  const token = req.header("token");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // Fetch the user's project name and role from the database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user.projectName = user.projectName; // Add projectName to the request object
    req.user.userRole = user.userRole; // Add userRole to the request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};