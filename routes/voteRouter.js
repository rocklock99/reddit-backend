import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../index.js";
export const voteRouter = express.Router();

// POST: "/votes/upvotes/:postId"
voteRouter.post("/upvotes/:postId", async (req, res) => {
  try {
    // check if req.body is empty, if it isn't then send an error
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Request contains a body.",
      });
    }
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the postId is in route URL, otherwise send an error message
    if (!req.params.postId) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Ensure the request url includes a post id.",
      });
    }
    // deconstruct postId from req.params
    const { postId } = req.params;
    // deconstruct the user's id property from req.user (created in middleware)
    const { id } = req.user;
    // check if the postId is in the DB
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
    // check if the post was already upvoted by the user
    const foundUpvote = await prisma.upvote.findUnique({
      where: {
        // because of unique constraint, must query with userId_postId in the where-clause
        userId_postId: {
          userId: id,
          postId,
        },
      },
    });
    // send error if upvote found
    if (foundUpvote) {
      return res.status(403).json({
        success: false,
        error: "User already upvoted specified post.",
      });
    }
    // check if the user already downvoted the same post
    const foundDownvote = await prisma.downvote.findUnique({
      where: {
        userId_postId: {
          // unique constraint where-clause
          userId: id,
          postId,
        },
      },
    });
    // if downvote was found for the same post, then delete it
    if (foundDownvote) {
      const deleteDownvote = await prisma.downvote.delete({
        // unique constraint where-clause
        where: {
          userId_postId: {
            userId: id,
            postId,
          },
        },
      });
      // send error if the downvote wasn't deleted from DB
      if (!deleteDownvote) {
        return res.status(403).json({
          success: false,
          error: "Resource downvote could not be deleted before adding upvote.",
        });
      }
    }
    // create a new upvote
    const newUpvote = await prisma.upvote.create({
      data: {
        userId: id, // required key
        postId, // required key
      },
    });
    // check if the new upvote was created
    if (!newUpvote) {
      return res.status(400).json({
        success: false,
        error: "Could not create upvote.",
      });
    }
    // send back a successful response with the new upvote
    res.json({ success: true, upvote: newUpvote });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// POST: "/votes/downvotes/:postId"
voteRouter.post("/downvotes/:postId", async (req, res) => {
  try {
    // check if req.body is empty, if it isn't then send an error
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Request contains a body.",
      });
    }
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the route path includes postId, otherwise send an error message
    if (!req.params.postId) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Ensure the request url includes a post id.",
      });
    }
    // deconstruct postId from req.params
    const { postId } = req.params;
    // deconstruct the user's id property from req.user (created in middleware)
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
    // check if the post was already downvoted by the user
    const foundDownvote = await prisma.downvote.findUnique({
      where: {
        // because of unique constraint, must query with userId_postId in the where-clause
        userId_postId: {
          userId: id,
          postId,
        },
      },
    });
    // send error if downvote found
    if (foundDownvote) {
      return res.status(403).json({
        success: false,
        error: "User already downvoted specified post.",
      });
    }
    // check if the user already upvoted the same post
    const foundUpvote = await prisma.upvote.findUnique({
      where: {
        userId_postId: {
          // unique constraint where-clause
          userId: id,
          postId,
        },
      },
    });
    // if upvote was found for the same post, then delete it
    if (foundUpvote) {
      const deleteUpvote = await prisma.upvote.delete({
        // unique constraint where-clause
        where: {
          userId_postId: {
            userId: id,
            postId,
          },
        },
      });
      // send error if the upvote wasn't deleted from DB
      if (!deleteUpvote) {
        return res.status(403).json({
          success: false,
          error: "Resource upvote could not be deleted before adding downvote.",
        });
      }
    }
    // create a new downvote
    const newDownvote = await prisma.downvote.create({
      data: {
        userId: id, // required key
        postId, // required key
      },
    });
    // check if the new downvote was created
    if (!newDownvote) {
      return res.status(400).json({
        success: false,
        error: "Could not create downvote.",
      });
    }
    // send back a successful response with the new downvote
    res.json({ success: true, downvote: newDownvote });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DELETE: "/votes/upvotes/:postId"
voteRouter.delete("/upvotes/:postId", async (req, res) => {
  try {
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the route path included a post id, otherwise send an error message
    if (!req.params) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Request URL does not contain a post id.",
      });
    }
    // deconstruct postId from req.params
    const { postId } = req.params;
    // For DEBUGGING
    // console.log(`postId after deconstruction: ${postId}`);
    // deconstruct the user's id property from req.user
    const { id } = req.user;
    // check if the post id is in the DB
    const foundPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    // if post id is not in the database then send an error
    if (!foundPost) {
      return res
        .status(404)
        .json({ success: false, error: "Resource post not found." });
    }
    // For DEBUGGING
    // console.log(
    //   `foundPost.userId: ${
    //     foundPost.userId
    //   } with type ${typeof foundPost.userId}`
    // );
    // console.log(`id: ${id} with type ${typeof id}`);
    // delete the upvote
    const deletedUpvote = await prisma.upvote.delete({
      // unique constraint where-clause
      where: {
        userId_postId: {
          userId: id,
          postId,
        },
      },
    });
    // check if the upvote was deleted
    if (!deletedUpvote) {
      return res.status(500).json({
        success: false,
        error: "Resource upvote could not be deleted.",
      });
    }
    // send back a successful response with the deleted upvote
    res.json({ success: true, upvote: deletedUpvote });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DELETE: "/votes/downvotes/:postId"
voteRouter.delete("/downvotes/:postId", async (req, res) => {
  try {
    // Check if req.user exists (req.user should exist if middleware authenticated)
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    // check if the route path included a post id, otherwise send an error message
    if (!req.params) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Request URL does not contain a post id.",
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
    // if post id is not in the database then send an error
    if (!foundPost) {
      return res
        .status(404)
        .json({ success: false, error: "Resource post not found." });
    }
    // For DEBUGGING
    // console.log(
    //   `foundPost.userId: ${
    //     foundPost.userId
    //   } with type ${typeof foundPost.userId}`
    // );
    // console.log(`id: ${id} with type ${typeof id}`);
    // delete the downvote
    const deletedDownvote = await prisma.downvote.delete({
      // unique constraint where-clause
      where: {
        userId_postId: {
          userId: id,
          postId,
        },
      },
    });
    // check if the downvote was deleted
    if (!deletedDownvote) {
      return res.status(500).json({
        success: false,
        error: "Resource downvote could not be deleted.",
      });
    }
    // send back a successful response with the deleted upvote
    res.json({ success: true, downvote: deletedDownvote });
    // error response for additional caught errors not directly handled
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
