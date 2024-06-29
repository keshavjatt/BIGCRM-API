const express = require("express");
const auth = require("../middleware/auth.middleware");
const router = express.Router();
const {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getUserCount,
  updateUserStatus
} = require("../controller/user.controller");

// User Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/count", auth, getUserCount);
router.get("/", auth, getAllUsers);
router.get("/:id", auth, getUserById);
router.put("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);
router.put("/Userstatus/:id", auth, updateUserStatus);

module.exports = router;