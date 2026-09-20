import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// UPLOAD BUFFER TO CLOUDINARY
// =====================================================

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chatflow/profiles",
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
// GET ALL USERS
// =====================================================

export const getUsers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const users = await User.find({
      _id: { $ne: req.user._id },

      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          username: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .select("-password")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// GET USER BY ID
// =====================================================

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      username,
      bio,
      phone,
    } = req.body;

    console.log("Profile file:", req.file);

    // =================================================
    // CHECK USERNAME
    // =================================================

    if (username) {
      const existingUser = await User.findOne({
        username: username.trim().toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // =================================================
    // UPLOAD PROFILE IMAGE
    // =================================================

    let profileImage;

    if (req.file) {
      try {
        console.log("Uploading profile image to Cloudinary...");

        const uploadResult = await uploadToCloudinary(
          req.file.buffer
        );

        profileImage = uploadResult.secure_url;

        console.log(
          "Profile image URL:",
          profileImage
        );
      } catch (uploadError) {
        console.error(
          "Profile image Cloudinary error:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          message: "Profile image upload failed",
        });
      }
    }

    // =================================================
    // UPDATE DATA
    // =================================================

    const updateData = {
      ...(name !== undefined && {
        name: name.trim(),
      }),

      ...(username !== undefined && {
        username: username.trim().toLowerCase(),
      }),

      ...(bio !== undefined && {
        bio: bio.trim(),
      }),

      ...(phone !== undefined && {
        phone: phone.trim(),
      }),

      ...(profileImage && {
        profileImage,
      }),
    };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message || "Server error",
    });
  }
};