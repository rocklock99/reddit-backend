import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../index.js";
export const subredditRouter = express.Router();

// GET: "/subreddits"
subredditRouter.get("/", async (req, res) => {
  const allSubreddits = await prisma.subreddit.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });
  res.json({ success: true, subreddits: allSubreddits });
});

// POST: "/subreddits"
subredditRouter.post("/", async (req, res) => {
  try {
    // check if req.body is empty or non-existant
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Request body is empty or non-existant.",
      });
    }
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check for erroneous keys in the request body that aren't specified by API docs
    const validKeys = ["name"];
    for (const key in req.body) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid request data. Erroneous keys contained in the request.",
        });
      }
    }
    // deconstruct name from request body
    const { name } = req.body;
    // deconstruct the user's id property from req.user (created inside middleware)
    const { id } = req.user;
    // check the request body for missing required keys per the API docs
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data. Required request keys are missing.",
      });
    }
    // create a new subreddit in the DB using prisma
    const newSubreddit = await prisma.subreddit.create({
      data: {
        name, // required property
        userId: id, // required property
      },
    });
    // check if the new subreddit was added to the DB and send error if it wasn't
    if (!newSubreddit) {
      return res.status(400).json({
        success: false,
        error: "Could not create new subreddit.",
      });
    }
    // send back a successful response with the new subreddit
    res.json({ success: true, subreddit: newSubreddit });
    // error response for caught errors
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DELETE: "/subreddits/:subredditId"
subredditRouter.delete("/:subredditId", async (req, res) => {
  try {
    console.log(req.body);
    // check if req.body is empty, if it isn't then send an error
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Delete request contains a body.",
      });
    }
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the route path included a subreddit id, otherwise send an error message
    if (!req.params) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. DELETE request requires subreddit id in URL path.",
      });
    }
    // deconstruct subredditId from req.params
    const { subredditId } = req.params;
    // deconstruct the user's id property from req.user
    const { id } = req.user;
    // check if subredditId is in the DB
    const foundSubreddit = await prisma.subreddit.findUnique({
      where: {
        id: subredditId,
      },
    });
    if (!foundSubreddit) {
      return res
        .status(404)
        .json({ success: false, error: "Resource not found." });
    }
    // check if the requestor has authorization to delete the subreddit
    if (foundSubreddit.userId !== id) {
      return res
        .status(403)
        .json({ success: false, error: "Permission denied." });
    }
    // delete the subreddit
    const deletedSubreddit = await prisma.subreddit.delete({
      where: { id: subredditId },
    });
    // check if the post was deleted
    if (!deletedSubreddit) {
      return res.status(500).json({
        success: false,
        error: "Could not delete subreddit.",
      });
    }
    // send back a successful response with the deleted subreddit
    res.json({ success: true, subreddit: deletedSubreddit });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
