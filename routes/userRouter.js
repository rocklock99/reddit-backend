import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../index.js";
export const userRouter = express.Router();

// POST: "/users/register"
userRouter.post("/register", async (req, res) => {
  try {
    // deconstruct username, password from the request body
    const { username, password } = req.body;
    // check if username already exists in the DB
    const usernameFound = await prisma.user.findUnique({ where: { username } });
    //console.log(usernameFound);
    if (usernameFound) {
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }
    // use the bcrypt module to salt and hash the password for DB storage
    const hash = await bcrypt.hash(password, 10);
    // add the username and password to the DB using prisma
    const newUser = await prisma.user.create({
      data: { username, password: hash },
    });
    // generate a JWT token with new user data
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET);
    // send a successful response with the token
    res.json({ success: true, token });
    // error response for caught errors
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// POST: "/users/login"
userRouter.post("/login", async (req, res) => {
  try {
    // Check if req.user exists (user is already authenticated from middleware)
    if (req.user) {
      const token = req.user.token; // token sent with the authenticated user
      return res.json({ success: true, token });
    }
    // if req.user does not exist, user is not authenticated and must be authenticated
    const { username, password } = req.body;
    // Use Prisma to find the user by username in the database
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    // verify the provided password against the hashed password in the database
    const doesPasswordMatch = await bcrypt.compare(password, user.password);
    // if passwords don't match, return an error
    if (!doesPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    // generate a JWT token with authenticated user data
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    // send a successful response with the token
    res.json({ success: true, token });
    // error response for caught errors
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: "/"
userRouter.get("/token", async (req, res) => {
  try {
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // return the user with the associated token
    res.json({ success: true, user: req.user });
    // error response for caught errors
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
