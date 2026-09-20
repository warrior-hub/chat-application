import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import VideoCall from "../components/VideoCall";

import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";

const Chat = () => {
  const { user } = useAuth();

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [socketConnected, setSocketConnected] =
    useState(false);

  // =====================================================
  // VIDEO CALL
  // =====================================================

  const [videoCallOpen, setVideoCallOpen] =
    useState(false);

  const [incomingCall, setIncomingCall] =
    useState(null);

  const selectedUserRef =
    useRef(null);

  const currentUserId =
    user?.id || user?._id;

  // =====================================================
  // SELECTED USER REF
  // =====================================================

  useEffect(() => {
    selectedUserRef.current =
      selectedUser;
  }, [selectedUser]);

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  useEffect(() => {
    if (!currentUserId) return;

    if (!socket.connected) {
      socket.connect();
    }

    // ===================================================
    // CONNECT
    // ===================================================

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit(
        "user-online",
        currentUserId
      );
    };

    // ===================================================
    // DISCONNECT
    // ===================================================

    const handleDisconnect = () => {
      console.log(
        "Socket disconnected"
      );

      setSocketConnected(false);
    };

    // ===================================================
    // RECEIVE MESSAGE
    // ===================================================

    const handleReceiveMessage = (
      message
    ) => {
      console.log(
        "New message:",
        message
      );

      const senderId =
        message.sender?._id ||
        message.sender;

      const receiverId =
        message.receiver?._id ||
        message.receiver;

      const currentSelectedUser =
        selectedUserRef.current;

      const selectedUserId =
        currentSelectedUser?._id;

      const belongsToCurrentChat =
        String(senderId) ===
          String(selectedUserId) ||
        String(receiverId) ===
          String(selectedUserId);

      if (!belongsToCurrentChat) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some(
          (item) =>
            String(item._id) ===
            String(message._id)
        );

        if (exists) {
          return prev;
        }

        return [...prev, message];
      });

      if (
        String(senderId) ===
        String(selectedUserId)
      ) {
        socket.emit(
          "mark-messages-read",
          {
            readerId: currentUserId,
            senderId,
          }
        );
      }
    };

    // ===================================================
    // MESSAGE READ
    // ===================================================

    const handleMessagesRead = ({
      readerId,
      senderId,
    }) => {
      console.log(
        "Messages read:",
        {
          readerId,
          senderId,
        }
      );

      if (
        String(senderId) !==
        String(currentUserId)
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          const messageSenderId =
            message.sender?._id ||
            message.sender;

          const messageReceiverId =
            message.receiver?._id ||
            message.receiver;

          if (
            String(messageSenderId) ===
              String(currentUserId) &&
            String(messageReceiverId) ===
              String(readerId)
          ) {
            return {
              ...message,
              read: true,
              delivered: true,
            };
          }

          return message;
        })
      );
    };

    // ===================================================
    // INCOMING VIDEO CALL
    // ===================================================

    const handleIncomingCall = (
      data
    ) => {
      console.log(
        "Incoming call received in Chat:",
        data
      );

      if (!data?.callerId) {
        console.error(
          "Invalid incoming call data:",
          data
        );

        return;
      }

      // Agar already kisi call me hain
      if (videoCallOpen) {
        console.log(
          "Already in a video call"
        );

        return;
      }

      setIncomingCall(data);
      setVideoCallOpen(true);
    };

    // ===================================================
    // SOCKET LISTENERS
    // ===================================================

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "receive-message",
      handleReceiveMessage
    );

    socket.on(
      "messages-read",
      handleMessagesRead
    );

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    // Already connected
    if (socket.connected) {
      handleConnect();
    }

    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "receive-message",
        handleReceiveMessage
      );

      socket.off(
        "messages-read",
        handleMessagesRead
      );

      socket.off(
        "incoming-call",
        handleIncomingCall
      );

      // IMPORTANT:
      // Do NOT disconnect here.
      // Socket must stay alive for calls.
    };
  }, [currentUserId, videoCallOpen]);

  // =====================================================
  // SELECT USER
  // =====================================================

  const handleSelectUser = (
    selected
  ) => {
    if (!selected?._id) return;

    console.log(
      "Selected user:",
      selected.name
    );

    setSelectedUser(selected);
    setMessages([]);

    if (
      currentUserId &&
      selected?._id
    ) {
      socket.emit(
        "mark-messages-read",
        {
          readerId: currentUserId,
          senderId: selected._id,
        }
      );
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  // =====================================================
  // START VIDEO CALL
  // =====================================================

  const handleVideoCall = () => {
    if (!selectedUser?._id) {
      console.log(
        "No user selected for video call"
      );

      return;
    }

    if (!socket.connected) {
      alert(
        "Socket connected nahi hai."
      );

      return;
    }

    console.log(
      "Opening video call with:",
      selectedUser.name
    );

    setIncomingCall(null);
    setVideoCallOpen(true);
  };

  // =====================================================
  // CLOSE VIDEO CALL
  // =====================================================

  const handleCloseVideoCall = () => {
    console.log(
      "Closing video call"
    );

    setVideoCallOpen(false);
    setIncomingCall(null);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-slate-950 text-white">

      <div className="relative flex h-full w-full overflow-hidden">

        {/* SIDEBAR */}

        <aside
          className={`
            h-full
            shrink-0
            w-full
            md:w-[320px]
            lg:w-[350px]
            xl:w-[380px]
            border-r
            border-white/10
            ${
              selectedUser
                ? "hidden md:block"
                : "block"
            }
          `}
        >
          <Sidebar
            selectedUser={
              selectedUser
            }
            onSelectUser={
              handleSelectUser
            }
          />
        </aside>

        {/* CHAT */}

        <main
          className={`
            min-w-0
            flex-1
            h-full
            ${
              selectedUser
                ? "block"
                : "hidden md:block"
            }
          `}
        >
          <ChatWindow
            selectedUser={
              selectedUser
            }
            messages={messages}
            setMessages={
              setMessages
            }
            onBack={handleBack}
            onVideoCall={
              handleVideoCall
            }
          />
        </main>
      </div>

      {/* ================================================= */}
      {/* GLOBAL VIDEO CALL */}
      {/* ================================================= */}

      {videoCallOpen && (
        <VideoCall
          selectedUser={
            selectedUser
          }
          incomingCall={
            incomingCall
          }
          onClose={
            handleCloseVideoCall
          }
        />
      )}

      {/* SOCKET STATUS */}

      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 pointer-events-none">
        <div
          className={`
            flex items-center gap-1.5 sm:gap-2
            px-2.5 sm:px-3
            py-1.5 sm:py-2
            rounded-lg sm:rounded-xl
            border
            backdrop-blur-xl
            shadow-xl
            transition-all duration-300
            ${
              socketConnected
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }
          `}
        >
          {socketConnected ? (
            <>
              <Wifi
                size={13}
                className="text-emerald-400"
              />

              <span className="text-[9px] sm:text-[10px] font-medium text-emerald-400">
                Connected
              </span>
            </>
          ) : (
            <>
              <WifiOff
                size={13}
                className="text-red-400"
              />

              <span className="text-[9px] sm:text-[10px] font-medium text-red-400">
                Disconnected
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
