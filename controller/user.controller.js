const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
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

const getAllUsers = async (req, res) => {
  try {
    const filter =
      req.user.userRole === "Admin"
        ? {}
        : { projectName: req.user.projectName };
    const users = await User.find(filter);
    res.json(users); // Send the users array as JSON response
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getUserById = async (req, res) => {
  try {
    const filter =
      req.user.userRole === "Admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, projectName: req.user.projectName };
    const user = await User.findOne(filter);

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

    let query = { _id: req.params.id };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    // Check if user exists with the given projectName and ID
    let user = await User.findOne(query);
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
    let query = { _id: req.params.id };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    // Filter by projectName and user ID
    const deletedUser = await User.findOneAndDelete(query);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getUserCount = async (req, res) => {
  try {
    let query = {};

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const count = await User.countDocuments(query);

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