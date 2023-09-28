import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../index.js";
export const postRouter = express.Router();

// GET: "/posts"
postRouter.get("/", async (req, res) => {
  const allPosts = await prisma.post.findMany({
    select: {
      id: true,
      text: true,
      title: true,
      userId: true,
      subredditId: true,
      parentId: true,
      user: true,
      subreddit: true,
      upvotes: true,
      downvotes: true,
      children: true,
    },
  });
  res.json({ success: true, posts: allPosts });
});

// POST: "/posts"
postRouter.post("/", async (req, res) => {
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
    const validKeys = ["title", "text", "subredditId", "parentId"];
    for (const key in req.body) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid request data. Erroneous keys contained in the request.",
        });
      }
    }
    // deconstruct title (optional), text, subredditId, and parentId from request
    const { title, text, subredditId, parentId } = req.body;
    // deconstruct the user's id property from req.user
    const { id } = req.user;
    // check the request body for missing required keys per the API docs
    if (!text || !subredditId) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data. Required request keys are missing.",
      });
    }
    // create a new post in the DB
    const newPost = await prisma.post.create({
      data: {
        text,
        title, // optional
        userId: id,
        subredditId,
        parentId, // optional
      },
    });
    // check if the new post was added to the DB
    if (!newPost) {
      return res.status(400).json({
        success: false,
        error: "Could not create new post.",
      });
    }
    // send back a successful response with the new post
    res.json({ success: true, post: newPost });
    // error response for caught errors
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// PUT: "/posts/:postId"
postRouter.put("/:postId", async (req, res) => {
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
    // check for erroneous keys in the request body
    const validKeys = ["title", "text"]; // the only keys allowed per the API docs
    for (const key in req.body) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid request data. Erroneous keys contained in the request.",
        });
      }
    }
    // check if the route path included a post id, otherwise send an error message
    if (!req.params) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. Ensure the PUT request url includes a post id.",
      });
    }
    // deconstruct postId from req.params
    const { postId } = req.params;
    // deconstruct title, text from the request body (both are optional)
    const { title, text } = req.body;
    // deconstruct the user's id property from req.user
    const { id } = req.user;
    // check if the post id is in the DB
    const foundPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    if (!foundPost) {
      return res
        .status(404)
        .json({ success: false, error: "Resource not found." });
    }
    // check if the requestor has authorization to edit the post
    if (foundPost.userId !== id) {
      return res
        .status(403)
        .json({ success: false, error: "Permission denied." });
    }
    // update the post
    const editedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        text, // optional key
        title, // optional key
      },
    });
    // check if the post was updated
    if (!editedPost) {
      return res.status(400).json({
        success: false,
        error: "Could not update post.",
      });
    }
    // send back a successful response with the new post
    res.json({ success: true, post: editedPost });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DELETE: "/posts/:postId"
postRouter.delete("/:postId", async (req, res) => {
  try {
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the route path included a post id, otherwise send an error message
    if (!req.params) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. Ensure the DELETE request url includes a post id.",
      });
    }
    // deconstruct postId from req.params
    const { postId } = req.params;
    // deconstruct the user's id property from req.user
    const { id } = req.user;
    // check if the post id is in the DB
    const foundPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    if (!foundPost) {
      return res
        .status(404)
        .json({ success: false, error: "Resource not found." });
    }
    // check if the requestor has authorization to delete the post
    if (foundPost.userId !== id) {
      return res
        .status(403)
        .json({ success: false, error: "Permission denied." });
    }
    // delete the post
    const deletedPost = await prisma.post.delete({
      where: { id: postId },
    });
    // check if the post was deleted
    if (!deletedPost) {
      return res.status(500).json({
        success: false,
        error: "Could not delete post.",
      });
    }
    // send back a successful response with the deleted post
    res.json({ success: true, post: deletedPost });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
