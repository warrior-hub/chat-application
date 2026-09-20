import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Phone,
  Search,
  Video,
  Send,
  Smile,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MessageCircle,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";

import socket from "../services/socket";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ChatWindow = ({
  selectedUser,
  messages,
  setMessages,
  onBack,
  onVideoCall,
}) => {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Selected image
  const [selectedImage, setSelectedImage] = useState(null);

  // Image preview
  const [imagePreview, setImagePreview] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // =====================================================
  // CURRENT USER ID
  // =====================================================

  const currentUserId = user?.id || user?._id;

  // =====================================================
  // SCROLL TO BOTTOM
  // =====================================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // =====================================================
  // FETCH MESSAGES
  // =====================================================

  useEffect(() => {
    if (!selectedUser?._id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          `/messages/${selectedUser._id}`
        );

        setMessages(response.data.messages || []);

        if (currentUserId) {
          socket.emit("mark-messages-read", {
            readerId: currentUserId,
            senderId: selectedUser._id,
          });
        }
      } catch (error) {
        console.error("Messages fetch error:", error);

        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [
    selectedUser?._id,
    currentUserId,
    setMessages,
  ]);


  // =====================================================
// REAL-TIME RECEIVE MESSAGE
// =====================================================

useEffect(() => {
  if (!selectedUser?._id || !currentUserId) return;

  const handleReceiveMessage = (message) => {
    const senderId =
      message.sender?._id || message.sender;

    const receiverId =
      message.receiver?._id || message.receiver;

    // Check karo message current chat ka hai ya nahi
    const isCurrentChat =
      (
        String(senderId) === String(currentUserId) &&
        String(receiverId) === String(selectedUser._id)
      ) ||
      (
        String(senderId) === String(selectedUser._id) &&
        String(receiverId) === String(currentUserId)
      );

    if (!isCurrentChat) {
      return;
    }

    setMessages((prevMessages) => {
      // Duplicate message prevent
      const alreadyExists = prevMessages.some(
        (msg) =>
          String(msg._id) === String(message._id)
      );

      if (alreadyExists) {
        return prevMessages;
      }

      return [...prevMessages, message];
    });
  };

  socket.on(
    "receive-message",
    handleReceiveMessage
  );

  return () => {
    socket.off(
      "receive-message",
      handleReceiveMessage
    );
  };
}, [
  selectedUser?._id,
  currentUserId,
  setMessages,
]);

  // =====================================================
  // IMAGE SELECT
  // =====================================================

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Only images
    if (!file.type.startsWith("image/")) {
      alert("Sirf image file select karein.");
      e.target.value = "";
      return;
    }

    // 5 MB frontend limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Image maximum 5MB ki honi chahiye.");
      e.target.value = "";
      return;
    }

    // Previous preview cleanup
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);

    // Same file dobara select karne ke liye
    e.target.value = "";
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    const messageText = text.trim();

    // Text bhi nahi aur image bhi nahi
    if (!messageText && !selectedImage) {
      return;
    }

    if (!selectedUser?._id) {
      return;
    }

    if (!currentUserId) {
      console.error(
        "Current user ID missing:",
        user
      );

      return;
    }

    try {
      setSending(true);

      // =================================================
      // TEXT MESSAGE / IMAGE MESSAGE
      // =================================================

      const formData = new FormData();

      formData.append(
        "receiverId",
        selectedUser._id
      );

      if (messageText) {
        formData.append("text", messageText);
      }

      if (selectedImage) {
        formData.append(
          "image",
          selectedImage
        );
      }

      console.log("Sending message:", {
        receiverId: selectedUser._id,
        text: messageText,
        hasImage: !!selectedImage,
        imageName: selectedImage?.name,
      });

      // =================================================
      // SEND TO BACKEND
      // =================================================

      const response = await api.post(
        "/messages",
        formData
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Message send failed"
        );
      }

      const newMessage = response.data.data;

      // =================================================
      // IMPORTANT
      // =================================================
      // Backend REST API ne message save kar diya hai.
      //
      // Socket server bhi message ko receiver tak
      // realtime bhejega.
      //
      // Agar socket server sender ko bhi receive-message
      // emit karta hai, to manually setMessages karne se
      // duplicate message aa sakta hai.
      //
      // Isliye yahan manually message add nahi kar rahe.
      // Socket event receive hone ka wait karenge.
      // =================================================

      console.log(
        "Message sent successfully:",
        newMessage
      );

      // Clear text
      setText("");

      // Clear image
      removeSelectedImage();

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      console.error(
        "Response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Message send nahi ho saka."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // ENTER PRESS
  // =====================================================

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      if (!sending) {
        handleSendMessage(e);
      }
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // EMPTY CHAT
  // =====================================================

  if (!selectedUser) {
    return (
      <main className="flex-1 h-[100dvh] min-w-0 relative overflow-hidden bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-56 sm:w-72 h-56 sm:h-72 bg-indigo-600/10 rounded-full blur-3xl" />

          <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-72 h-56 sm:h-72 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-sm px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/10 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
            <MessageCircle
              size={30}
              className="text-indigo-400 sm:w-[34px] sm:h-[34px]"
            />
          </div>

          <h2 className="mt-5 sm:mt-6 text-lg sm:text-xl font-bold text-white">
            Select a conversation
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-6">
            Choose someone from your contacts
            and start a real-time conversation.
          </p>

          <div className="mt-5 sm:mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />

            <span className="text-[11px] sm:text-xs text-slate-500">
              Your messages are ready
            </span>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // USER INFO
  // =====================================================

  const firstLetter =
    selectedUser?.name
      ?.charAt(0)
      ?.toUpperCase() || "U";

  const isOnline =
    selectedUser?.status === "online";

  return (
    <main className="flex-1 h-[100dvh] min-w-0 bg-slate-950 flex flex-col relative overflow-hidden">

      {/* ================================================= */}
      {/* CHAT HEADER */}
      {/* ================================================= */}

      <header className="h-[64px] sm:h-[76px] flex-shrink-0 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between border-b border-white/[0.07] bg-slate-950/90 backdrop-blur-xl">

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">

          <button
            type="button"
            onClick={onBack}
            className="md:hidden w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="relative flex-shrink-0">

            {selectedUser.profileImage ? (
              <img
                src={selectedUser.profileImage}
                alt={selectedUser.name}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm sm:text-base font-bold border-2 border-white/10">
                {firstLetter}
              </div>
            )}

            {isOnline && (
              <span className="absolute right-0 bottom-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 border-2 sm:border-[3px] border-slate-950 shadow-sm shadow-emerald-400/40" />
            )}

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2 min-w-0">

              <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                {selectedUser.name}
              </h2>

              {isOnline && (
                <span className="hidden sm:inline-flex flex-shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-[9px] font-medium text-emerald-400">
                  ONLINE
                </span>
              )}

            </div>

            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {isOnline ? (
                <span className="text-emerald-400">
                  Active now
                </span>
              ) : (
                "Offline"
              )}
            </p>

          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

          <button
            type="button"
            title="Search messages"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Search
              size={17}
              className="sm:w-[19px] sm:h-[19px]"
            />
          </button>

          <button
            type="button"
            title="Voice call"
            className="hidden xs:flex w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Phone
              size={17}
              className="sm:w-[19px] sm:h-[19px]"
            />
          </button>

          <button
            type="button"
            title="Video call"
            onClick={() => {
              if (onVideoCall) {
                onVideoCall();
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
          >
            <Video
              size={17}
              className="sm:w-[19px] sm:h-[19px]"
            />
          </button>

          <button
            type="button"
            title="More"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <MoreVertical
              size={17}
              className="sm:w-[19px] sm:h-[19px]"
            />
          </button>

        </div>
      </header>

      {/* ================================================= */}
      {/* MESSAGES AREA */}
      {/* ================================================= */}

      <div className="flex-1 min-h-0 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        <div className="absolute inset-0 pointer-events-none overflow-hidden">

          <div className="absolute top-10 left-1/4 w-52 h-52 sm:w-64 sm:h-64 bg-indigo-600/[0.04] rounded-full blur-3xl" />

          <div className="absolute bottom-20 right-1/4 w-52 h-52 sm:w-64 sm:h-64 bg-purple-600/[0.04] rounded-full blur-3xl" />

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="relative h-full flex flex-col items-center justify-center px-6">

            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">

              <Loader2
                size={21}
                className="text-indigo-400 animate-spin"
              />

            </div>

            <p className="mt-4 text-xs text-slate-600">
              Loading conversation...
            </p>

          </div>
        ) : messages.length === 0 ? (
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">

            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-xl shadow-indigo-500/20">
              {firstLetter}
            </div>

            <h3 className="mt-4 sm:mt-5 text-sm sm:text-base font-semibold text-white truncate max-w-[250px]">
              {selectedUser.name}
            </h3>

            <p className="mt-2 text-xs text-slate-500 max-w-xs leading-5">
              This is the beginning of your
              conversation. Send a message to
              start chatting.
            </p>

            <div className="mt-5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">

              <p className="text-[10px] sm:text-[11px] text-slate-600">
                🔒 Messages are private
              </p>

            </div>

          </div>
        ) : (
          <div className="relative px-3 sm:px-5 lg:px-6 py-4 sm:py-6">

            <div className="flex items-center justify-center mb-5 sm:mb-6">

              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[9px] sm:text-[10px] text-slate-600">
                Today
              </span>

            </div>

            <div className="space-y-3">

              {messages.map((message) => {

                const senderId =
                  message.sender?._id ||
                  message.sender;

                const isMine =
                  String(senderId) ===
                  String(currentUserId);

                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`
                        group
                        max-w-[88%]
                        sm:max-w-[75%]
                        lg:max-w-[65%]
                        flex flex-col
                        ${
                          isMine
                            ? "items-end"
                            : "items-start"
                        }
                      `}
                    >

                      <div
                        className={`
                          relative
                          px-3.5 sm:px-4
                          py-2 sm:py-2.5
                          rounded-2xl
                          ${
                            isMine
                              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md shadow-lg shadow-indigo-600/10"
                              : "bg-white/[0.06] border border-white/[0.07] text-slate-200 rounded-bl-md"
                          }
                        `}
                      >

                        {/* IMAGE */}

                        {message.image && (
                          <div className="mb-2 overflow-hidden rounded-xl">

                            <img
                              src={message.image}
                              alt="Shared"
                              className="max-w-full max-h-[350px] object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                              onClick={() => {
                                window.open(
                                  message.image,
                                  "_blank"
                                );
                              }}
                            />

                          </div>
                        )}

                        {/* TEXT */}

                        {message.text && (
                          <p className="text-[13px] sm:text-sm leading-5 sm:leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {message.text}
                          </p>
                        )}

                        {/* TIME + STATUS */}

                        <div
                          className={`
                            flex
                            items-center
                            justify-end
                            gap-1.5
                            mt-1
                            ${
                              isMine
                                ? "text-indigo-200/70"
                                : "text-slate-600"
                            }
                          `}
                        >

                          <span className="text-[8px] sm:text-[9px]">
                            {formatTime(
                              message.createdAt
                            )}
                          </span>

                          {isMine && (
                            <>
                              {message.read ? (
                                <CheckCheck
                                  size={13}
                                  strokeWidth={2.5}
                                  className="text-sky-300"
                                  title="Seen"
                                />
                              ) : message.delivered ? (
                                <CheckCheck
                                  size={13}
                                  strokeWidth={2.5}
                                  className="text-slate-300"
                                  title="Delivered"
                                />
                              ) : (
                                <Check
                                  size={13}
                                  strokeWidth={2.5}
                                  className="text-slate-300"
                                  title="Sent"
                                />
                              )}
                            </>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            <div ref={messagesEndRef} />

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* IMAGE PREVIEW */}
      {/* ================================================= */}

      {imagePreview && (
        <div className="flex-shrink-0 px-3 sm:px-5 py-2 border-t border-white/[0.06] bg-slate-950">

          <div className="relative inline-block">

            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-white/10"
            />

            <button
              type="button"
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-400 transition"
              title="Remove image"
            >
              <X size={14} />
            </button>

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* MESSAGE INPUT */}
      {/* ================================================= */}

      <div className="flex-shrink-0 px-2.5 sm:px-4 lg:px-5 py-2.5 sm:py-3 border-t border-white/[0.07] bg-slate-950/95 backdrop-blur-xl">

        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-1.5 sm:gap-2"
        >

          {/* HIDDEN FILE INPUT */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* ATTACH IMAGE */}

          <button
            type="button"
            title="Send image"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={sending}
            className="
              w-10 h-10
              sm:w-10 sm:h-11
              flex-shrink-0
              rounded-xl
              flex items-center justify-center
              text-slate-600
              hover:text-indigo-400
              hover:bg-white/[0.04]
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <ImageIcon size={19} />
          </button>

          {/* INPUT */}

          <div className="flex-1 min-w-0 relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl sm:rounded-2xl focus-within:border-indigo-500/30 focus-within:bg-white/[0.05] transition-all">

            <input
              ref={inputRef}
              type="text"
              placeholder={`Message ${selectedUser.name}...`}
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="w-full h-10 sm:h-11 bg-transparent px-3.5 sm:px-4 pr-11 text-[13px] sm:text-sm text-white placeholder:text-slate-600 outline-none min-w-0 disabled:opacity-50"
            />

            <button
              type="button"
              title="Emoji"
              disabled={sending}
              className="absolute right-1.5 sm:right-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-yellow-400 hover:bg-white/[0.05] transition-all disabled:opacity-50"
            >
              <Smile size={17} />
            </button>

          </div>

          {/* SEND */}

          <button
            type="submit"
            disabled={
              sending ||
              (!text.trim() &&
                !selectedImage)
            }
            title="Send message"
            className={`
              w-10 h-10
              sm:w-11 sm:h-11
              flex-shrink-0
              rounded-xl
              flex items-center justify-center
              transition-all duration-200
              ${
                (text.trim() ||
                  selectedImage) &&
                !sending
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02]"
                  : "bg-white/[0.04] text-slate-700 cursor-not-allowed border border-white/[0.06]"
              }
            `}
          >
            {sending ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Send
                size={17}
                className={
                  text.trim() ||
                  selectedImage
                    ? "translate-x-[1px]"
                    : ""
                }
              />
            )}
          </button>

        </form>

        <p className="hidden sm:block text-[9px] text-slate-700 text-center mt-2">
          Press Enter to send • Click image icon to share an image
        </p>

      </div>

    </main>
  );
};

export default ChatWindow;
