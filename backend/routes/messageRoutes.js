// routes/messageRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getMessages,
  sendMessage,
} from "../controllers/messageController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getMessages);

router.post(
  "/",
  protect,
  upload.single("image"),
  sendMessage
);

export default router;