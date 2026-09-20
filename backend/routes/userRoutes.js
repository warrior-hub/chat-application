import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  getUserById,
  getUsers,
  updateProfile,
} from "../controllers/userController.js";

const router = express.Router();

// =====================================================
// CURRENT LOGGED-IN USER
// =====================================================

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// =====================================================
// UPDATE PROFILE
// =====================================================

router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);

// =====================================================
// GET ALL USERS / SEARCH USERS
// =====================================================

router.get("/", protect, getUsers);

// =====================================================
// GET USER BY ID
// =====================================================

router.get("/:userId", protect, getUserById);

export default router;