const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
require("dotenv").config();

const registerUser = async (req, res) => {
  try {
    const { name, mobileNo, empId, password, address, userRole, projectName } =
      req.body;

    if (
      !name ||
      !mobileNo ||
      !empId ||
      !password ||
      !address ||
      !userRole ||
      !projectName
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ empId });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      mobileNo,
      empId,
      password: hashedPassword,
      address,
      userRole,
      projectName,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ projectName: req.user.projectName }); // Filter by projectName
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      projectName: req.user.projectName,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "User nahi mila" });
    }
    res.status(500).send("Server Error");
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, mobileNo, empId, password, address, userRole, projectName } =
      req.body;

    // Check if user exists with the given projectName and ID
    let user = await User.findOne({
      _id: req.params.id,
      projectName: req.user.projectName,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.name = name;
    user.mobileNo = mobileNo;
    user.empId = empId;
    user.address = address;
    user.userRole = userRole;
    user.projectName = projectName;

    // If password is being updated, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.json({ message: "User successfully updated", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const deleteUser = async (req, res) => {
  try {
    // Filter by projectName and user ID
    const deletedUser = await User.findOneAndDelete({
      _id: req.params.id,
      projectName: req.user.projectName,
    });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted succesfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const loginUser = async (req, res) => {
  try {
    const { empId, password } = req.body;

    // Check if empId and password are provided
    if (!empId || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by empId
    const user = await User.findOne({ empId });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create payload for JWT with projectName from user object
    const payload = {
      user: {
        id: user.id,
        projectName: user.projectName, // Include project name in the token
      },
    };

    // Sign JWT and send it to the client
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: "User logged in successfully",
          token,
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments({
      projectName: req.user.projectName,
    }); // Filter by projectName
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getUserCount,
};