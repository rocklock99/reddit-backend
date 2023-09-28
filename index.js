import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { userRouter } from "./routes/userRouter.js";
import { postRouter } from "./routes/postRouter.js";
import { subredditRouter } from "./routes/subredditRouter.js";
import { voteRouter } from "./routes/voteRouter.js";

// load environment variables from .env file
dotenv.config();

// create prisma client instance
export const prisma = new PrismaClient();

// initialize express application
const app = express();

// middleware: converts JSON request payload to an Object
app.use(express.json());

// middleware: CORS enables cross-origin requests
app.use(cors());

// GET: "/"
app.get("/", async (req, res) => {
  res.json({ success: true, message: "Welcome to the Reddit server!" });
});

// middleware: authentication. checks if there's a token and if that token is valid.
//             grabs the user info and stores it in req.user
app.use(async (req, res, next) => {
  // check if theres an auth token in header
  try {
    // if no token, go to the next routing endpoint specified in request URL path
    if (!req.headers.authorization) {
      console.log("Inside no request headers");
      return next();
    }

    // pull the token string of interest from the request header and set to token
    const token = req.headers.authorization.split(" ")[1];

    // use jwt library to verify the token and get the corresponding userId
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    // use prisma to find the user by the userId
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // if user doesn't exist in the DB then go to next routing endpoint specified in URL
    if (!user) {
      return next();
    }
    // delete password from returned user object (but doesn't delete password in DB)
    delete user.password;
    // save returned user info in req.user
    req.user = user;
    next(); // proceeed to the next matching route endpoint
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
});

// mount the userRouter under the "/users" path
app.use("/users", userRouter);

// mount the postRouter under the "/posts" path
app.use("/posts", postRouter);

// mount the subredditRouter under the "/subreddits" path
app.use("/subreddits", subredditRouter);

// mount the voterRouter under the "/votes" path
app.use("/votes", voteRouter);

// error handling for incorrect request url
app.use((req, res) => {
  res.send({ success: false, error: "No route found." });
});

// express error handling
app.use((error, req, res, next) => {
  res.send({ success: false, error: error.message });
});

// catch wrong method with an existing url
app.all("*", function (req, res) {
  throw new Error("Bad request");
});

// start the express server
const server = app.listen(3000);
