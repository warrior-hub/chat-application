import { useEffect, useState } from "react";
import {
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
  X,
  Users,
} from "lucide-react";

import socket from "../services/socket";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserItem from "./UserItem";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ onSelectUser, selectedUser }) => {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // =====================================================
  // CURRENT USER ID
  // =====================================================

  const currentUserId = user?.id || user?._id;

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async (searchValue = "") => {
    try {
      setLoading(true);

      const response = await api.get(
        `/users?search=${encodeURIComponent(searchValue)}`
      );

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Users fetch error:", error);

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =====================================================
  // SEARCH DEBOUNCE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // USER STATUS REALTIME
  // =====================================================

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      status,
      lastSeen,
    }) => {
      if (!userId) return;

      setUsers((prevUsers) =>
        prevUsers.map((item) => {
          if (
            String(item._id) !==
            String(userId)
          ) {
            return item;
          }

          return {
            ...item,
            status,
            lastSeen: lastSeen || null,
          };
        })
      );
    };

    socket.on(
      "user-status",
      handleUserStatus
    );

    return () => {
      socket.off(
        "user-status",
        handleUserStatus
      );
    };
  }, []);

  // =====================================================
  // REALTIME NEW MESSAGE / UNREAD COUNT
  // =====================================================

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (!message) return;

      const senderId =
        message.sender?._id ||
        message.sender;

      const receiverId =
        message.receiver?._id ||
        message.receiver;

      if (!senderId || !receiverId) {
        return;
      }

      // Current user ko identify karo
      const isReceivedMessage =
        String(receiverId) ===
        String(currentUserId);

      if (!isReceivedMessage) {
        return;
      }

      // Agar sender current open chat hai
      const isCurrentChat =
        String(selectedUser?._id) ===
        String(senderId);

      setUsers((prevUsers) =>
        prevUsers.map((item) => {
          if (
            String(item._id) !==
            String(senderId)
          ) {
            return item;
          }

          // Current chat already open hai
          // to unread count increase mat karo
          if (isCurrentChat) {
            return {
              ...item,
              lastMessage:
                message.text ||
                item.lastMessage,
              unreadCount: 0,
            };
          }

          // Dusri chat se message aaya
          // unread count +1
          return {
            ...item,
            lastMessage:
              message.text ||
              item.lastMessage,
            unreadCount:
              (item.unreadCount || 0) + 1,
          };
        })
      );
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
    currentUserId,
    selectedUser?._id,
  ]);

  // =====================================================
  // SELECT USER
  // =====================================================

  const handleUserSelect = (selected) => {
    if (!selected?._id) return;

    // Sidebar me unread count immediately zero
    setUsers((prevUsers) =>
      prevUsers.map((item) => {
        if (
          String(item._id) !==
          String(selected._id)
        ) {
          return item;
        }

        return {
          ...item,
          unreadCount: 0,
        };
      })
    );

    // Parent ko updated user bhejo
    onSelectUser({
      ...selected,
      unreadCount: 0,
    });
  };

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    setSearch("");
  };

  // =====================================================
  // TOTAL UNREAD COUNT
  // =====================================================

  const totalUnreadCount = users.reduce(
    (total, item) =>
      total + (item.unreadCount || 0),
    0
  );

  return (
    <aside className="w-full md:w-[330px] lg:w-[350px] h-full flex-shrink-0 bg-slate-950 border-r border-white/[0.08] flex flex-col">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">

        <div className="flex items-center justify-between">

          {/* BRAND */}

          <div className="flex items-center gap-3">

            <div className="relative">

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">

                <MessageCircle
                  size={22}
                  className="text-white"
                  fill="white"
                />

              </div>

              <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[3px] border-slate-950" />

            </div>

            <div>

              <h1 className="text-white font-bold text-lg tracking-tight">
                ChatFlow
              </h1>

              <p className="text-[11px] text-slate-500">
                Messages & conversations
              </p>

            </div>

          </div>

          {/* SETTINGS */}

          <button
            type="button"
            title="Settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-200"
            onClick={()=>navigate("/profile")}
          >
            <Settings size={18}  />
          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* MY PROFILE */}
      {/* ================================================= */}

      <div className="px-4 pt-4">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/[0.08] p-3">

          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-3">

            {/* AVATAR */}

            <div className="relative flex-shrink-0">

              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || "Profile"}
                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-400/30"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-indigo-400/20">
                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>
              )}

              <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />

            </div>

            {/* USER INFO */}

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">

                <h3 className="text-sm font-semibold text-white truncate">
                  {user?.name || "User"}
                </h3>

                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/10 text-[9px] font-medium text-emerald-400">
                  YOU
                </span>

              </div>

              <p className="text-xs text-emerald-400 mt-0.5">
                ● Online
              </p>

            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 transition-all duration-200"
            >
              <LogOut size={17} />
            </button>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <div className="px-4 pt-4">

        <div className="relative">

          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
          />

          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/5 hover:border-white/[0.12]"
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* CONTACT HEADER */}
      {/* ================================================= */}

      <div className="px-5 pt-5 pb-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Users
              size={15}
              className="text-indigo-400"
            />

            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Contacts
            </span>

          </div>

          <div className="flex items-center gap-2">

            {/* TOTAL UNREAD */}

            {totalUnreadCount > 0 && (
              <span className="min-w-6 h-6 px-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 flex items-center justify-center">
                {totalUnreadCount > 99
                  ? "99+"
                  : totalUnreadCount}
              </span>
            )}

            {/* USERS COUNT */}

            <span className="min-w-6 h-6 px-2 rounded-lg bg-white/[0.05] border border-white/[0.06] text-[10px] font-semibold text-slate-500 flex items-center justify-center">
              {users.length}
            </span>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* USERS LIST */}
      {/* ================================================= */}

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {loading ? (

          <div className="space-y-2">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-2xl animate-pulse"
                >

                  <div className="w-12 h-12 rounded-full bg-white/[0.06] flex-shrink-0" />

                  <div className="flex-1 space-y-2">

                    <div className="h-3 w-28 bg-white/[0.06] rounded" />

                    <div className="h-2.5 w-20 bg-white/[0.04] rounded" />

                  </div>

                </div>
              )
            )}

          </div>

        ) : users.length === 0 ? (

          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center px-6">

            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">

              <User
                size={26}
                className="text-slate-600"
              />

            </div>

            <h3 className="text-sm font-semibold text-slate-300">
              No users found
            </h3>

            <p className="text-xs text-slate-600 mt-1 max-w-[220px]">
              {search
                ? `No users match "${search}"`
                : "There are no other users available yet."}
            </p>

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400 hover:bg-indigo-500/15 transition-all"
              >
                Clear search
              </button>
            )}

          </div>

        ) : (

          <div className="space-y-1">

            {users.map((item) => (

              <UserItem
                key={item._id}
                user={item}
                onClick={() =>
                  handleUserSelect(item)
                }
                active={
                  String(
                    selectedUser?._id
                  ) ===
                  String(item._id)
                }
                unreadCount={
                  item.unreadCount || 0
                }
              />

            ))}

          </div>

        )}

      </div>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <div className="px-4 py-3 border-t border-white/[0.06]">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />

            <span className="text-[11px] text-slate-600">
              Connected
            </span>

          </div>

          <span className="text-[10px] text-slate-700">
            ChatFlow
          </span>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;
