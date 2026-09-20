import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// UPLOAD BUFFER TO CLOUDINARY
// =====================================================

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chatflow/messages",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// =====================================================
// GET MESSAGES
// =====================================================

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: req.user._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user._id,
        },
      ],
    })
      .populate(
        "sender",
        "name email profileImage"
      )
      .populate(
        "receiver",
        "name email profileImage"
      )
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// SEND MESSAGE
// =====================================================

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    console.log("REQ.FILE:", req.file);

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (!receiverId || (!text?.trim() && !req.file)) {
      return res.status(400).json({
        success: false,
        message: "Receiver and text or image are required",
      });
    }

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID",
      });
    }

    if (req.user._id.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a message to yourself",
      });
    }

    // ---------------------------------------------
    // CHECK RECEIVER
    // ---------------------------------------------

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // ---------------------------------------------
    // UPLOAD IMAGE TO CLOUDINARY
    // ---------------------------------------------

    let imageUrl = null;
    console.log(req.file);
    
    if (req.file) {
      try {
        console.log("Uploading image to Cloudinary...");

        const uploadResult = await uploadToCloudinary(
          req.file.buffer
        );

        imageUrl = uploadResult.secure_url;

        console.log(
          "Cloudinary URL:",
          imageUrl
        );
      } catch (uploadError) {
        console.error(
          "Cloudinary upload error:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    // ---------------------------------------------
    // CREATE MESSAGE
    // ---------------------------------------------

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text?.trim() || "",
      image: imageUrl,
    });

    // ---------------------------------------------
    // POPULATE USER DATA
    // ---------------------------------------------

    await message.populate([
      {
        path: "sender",
        select: "name email profileImage",
      },
      {
        path: "receiver",
        select: "name email profileImage",
      },
    ]);

    // ---------------------------------------------
    // SOCKET REAL-TIME MESSAGE
    // ---------------------------------------------

    if (req.io) {
      req.io
        .to(receiverId.toString())
        .emit("receive-message", message);

      req.io
        .to(req.user._id.toString())
        .emit("receive-message", message);
    }

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });

  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Server error",
    });
  }
};