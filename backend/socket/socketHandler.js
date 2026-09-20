import User from "../models/User.js";
import Message from "../models/Message.js";
const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log("Socket connected:", socket.id);

    // =====================================================
    // USER ONLINE
    // =====================================================

    socket.on("user-online", async (userId) => {
      try {
        if (!userId) return;

        const userIdString = userId.toString();

        onlineUsers.set(userIdString, socket.id);

        // User ko uske own room me join kara do
        socket.join(userIdString);

        await User.findByIdAndUpdate(userId, {
          status: "online",
          lastSeen: null,
        });

        io.emit("user-status", {
          userId: userIdString,
          status: "online",
        });

        console.log("User online:", userIdString);
      } catch (error) {
        console.error(
          "User online error:",
          error.message
        );
      }
    });

    // =====================================================
    // SEND MESSAGE
    // =====================================================

socket.on("send-message", async (data) => {
  try {
    const {
      senderId,
      receiverId,
      text,
      imageUrl,
    } = data;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !senderId ||
      !receiverId ||
      (!text?.trim() && !imageUrl)
    ) {
      socket.emit("message-error", {
        message: "Text or image is required",
      });

      return;
    }

    // =================================================
    // CHECK RECEIVER ONLINE
    // =================================================

    const receiverOnline =
      onlineUsers.has(receiverId.toString());

    const now = new Date();

    // =================================================
    // SAVE MESSAGE IN MONGODB
    // =================================================

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,

      // Text optional
      text: text?.trim() || "",

      // Cloudinary URL only
      image: imageUrl || null,

      // Delivery status
      delivered: receiverOnline,

      deliveredAt: receiverOnline
        ? now
        : null,

      // New message is unread
      read: false,

      readAt: null,
    });

    // =================================================
    // POPULATE USERS
    // =================================================

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

    // =================================================
    // SEND MESSAGE TO RECEIVER
    // =================================================

    io.to(receiverId.toString()).emit(
      "receive-message",
      message
    );

    // =================================================
    // SEND MESSAGE BACK TO SENDER
    // =================================================

    io.to(senderId.toString()).emit(
      "receive-message",
      message
    );

    // =================================================
    // LOG
    // =================================================

    console.log(
      `Message: ${senderId} → ${receiverId} | ` +
      `Type: ${imageUrl ? "IMAGE" : "TEXT"} | ` +
      `Delivered: ${receiverOnline}`
    );

  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    socket.emit("message-error", {
      message: "Message send failed",
    });
  }
});



    // =====================================================
    // MARK MESSAGES AS READ
    // =====================================================

    socket.on(
      "mark-messages-read",
      async (data) => {
        try {
          const {
            readerId,
            senderId,
          } = data;

          if (!readerId || !senderId) {
            return;
          }

          const result =
            await Message.updateMany(
              {
                sender: senderId,
                receiver: readerId,
                read: false,
              },
              {
                $set: {
                  read: true,
                  delivered: true,
                  readAt: new Date(),
                  deliveredAt: new Date(),
                },
              }
            );

          if (result.modifiedCount === 0) {
            return;
          }

          io.to(senderId.toString()).emit(
            "messages-read",
            {
              readerId:
                readerId.toString(),
              senderId:
                senderId.toString(),
            }
          );

          console.log(
            `Messages read: ${readerId} read messages from ${senderId}`
          );
        } catch (error) {
          console.error(
            "Mark messages read error:",
            error.message
          );
        }
      }
    );

    // =====================================================
    // VIDEO CALL
    // =====================================================

    // -----------------------------------------------------
    // 1. CALL USER
    // -----------------------------------------------------

    socket.on("call-user", (data) => {
      try {
        const {
          callerId,
          receiverId,
          callerName,
          callerImage,
          offer,
        } = data;

        if (
          !callerId ||
          !receiverId ||
          !offer
        ) {
          console.log(
            "Invalid call-user data"
          );
          return;
        }

        const receiverSocketId =
          onlineUsers.get(
            receiverId.toString()
          );

        // Receiver offline hai
        if (!receiverSocketId) {
          socket.emit("call-failed", {
            reason:
              "User is offline",
          });

          console.log(
            `Call failed: ${receiverId} is offline`
          );

          return;
        }

        // Receiver ko incoming call bhejo
        io.to(receiverSocketId).emit(
          "incoming-call",
          {
            callerId:
              callerId.toString(),
            receiverId:
              receiverId.toString(),
            callerName:
              callerName || "Unknown",
            callerImage:
              callerImage || "",
            offer,
          }
        );

        console.log(
          `Incoming call: ${callerId} → ${receiverId}`
        );
      } catch (error) {
        console.error(
          "Call user error:",
          error.message
        );
      }
    });

    // -----------------------------------------------------
    // 2. ACCEPT CALL
    // -----------------------------------------------------

    socket.on("accept-call", (data) => {
      try {
        const {
          callerId,
          receiverId,
          answer,
        } = data;

        if (
          !callerId ||
          !receiverId ||
          !answer
        ) {
          console.log(
            "Invalid accept-call data"
          );
          return;
        }

        const callerSocketId =
          onlineUsers.get(
            callerId.toString()
          );

        if (!callerSocketId) {
          console.log(
            "Caller is no longer online"
          );

          return;
        }

        // Caller ko answer bhejo
        io.to(callerSocketId).emit(
          "call-accepted",
          {
            callerId:
              callerId.toString(),
            receiverId:
              receiverId.toString(),
            answer,
          }
        );

        console.log(
          `Call accepted: ${receiverId} accepted ${callerId}`
        );
      } catch (error) {
        console.error(
          "Accept call error:",
          error.message
        );
      }
    });

    // -----------------------------------------------------
    // 3. ICE CANDIDATE
    // -----------------------------------------------------

    socket.on(
      "ice-candidate",
      (data) => {
        try {
          const {
            senderId,
            receiverId,
            candidate,
          } = data;

          if (
            !senderId ||
            !receiverId ||
            !candidate
          ) {
            return;
          }

          const receiverSocketId =
            onlineUsers.get(
              receiverId.toString()
            );

          if (!receiverSocketId) {
            return;
          }

          io.to(receiverSocketId).emit(
            "ice-candidate",
            {
              senderId:
                senderId.toString(),
              receiverId:
                receiverId.toString(),
              candidate,
            }
          );
        } catch (error) {
          console.error(
            "ICE candidate error:",
            error.message
          );
        }
      }
    );

    // -----------------------------------------------------
    // 4. REJECT CALL
    // -----------------------------------------------------

    socket.on("reject-call", (data) => {
      try {
        const {
          callerId,
          receiverId,
        } = data;

        if (
          !callerId ||
          !receiverId
        ) {
          return;
        }

        const callerSocketId =
          onlineUsers.get(
            callerId.toString()
          );

        if (!callerSocketId) {
          return;
        }

        io.to(callerSocketId).emit(
          "call-rejected",
          {
            callerId:
              callerId.toString(),
            receiverId:
              receiverId.toString(),
          }
        );

        console.log(
          `Call rejected: ${receiverId} rejected ${callerId}`
        );
      } catch (error) {
        console.error(
          "Reject call error:",
          error.message
        );
      }
    });

    // -----------------------------------------------------
    // 5. END CALL
    // -----------------------------------------------------

    socket.on("end-call", (data) => {
      try {
        const {
          callerId,
          receiverId,
        } = data;

        if (
          !callerId ||
          !receiverId
        ) {
          return;
        }

        const receiverSocketId =
          onlineUsers.get(
            receiverId.toString()
          );

        if (!receiverSocketId) {
          return;
        }

        io.to(receiverSocketId).emit(
          "call-ended",
          {
            callerId:
              callerId.toString(),
            receiverId:
              receiverId.toString(),
          }
        );

        console.log(
          `Call ended: ${callerId} → ${receiverId}`
        );
      } catch (error) {
        console.error(
          "End call error:",
          error.message
        );
      }
    });

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", async () => {
      try {
        console.log(
          "Socket disconnected:",
          socket.id
        );

        let disconnectedUserId = null;

        for (const [
          userId,
          socketId,
        ] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }

        if (!disconnectedUserId) {
          return;
        }

        onlineUsers.delete(
          disconnectedUserId
        );

        const lastSeen = new Date();

        await User.findByIdAndUpdate(
          disconnectedUserId,
          {
            status: "offline",
            lastSeen,
          }
        );

        io.emit("user-status", {
          userId: disconnectedUserId,
          status: "offline",
          lastSeen,
        });

        console.log(
          "User offline:",
          disconnectedUserId
        );
      } catch (error) {
        console.error(
          "Disconnect error:",
          error.message
        );
      }
    });
  });
};

export default socketHandler;
