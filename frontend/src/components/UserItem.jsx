import {
  Circle,
  CheckCheck,
} from "lucide-react";

const UserItem = ({
  user,
  onClick,
  active = false,
  unreadCount = 0,
}) => {
  const firstLetter =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  const isOnline = user?.status === "online";

  // ================= LAST SEEN =================
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Offline";

    const date = new Date(lastSeen);

    if (Number.isNaN(date.getTime())) {
      return "Offline";
    }

    const now = new Date();
    const diffInSeconds = Math.floor(
      (now - date) / 1000
    );

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(
      diffInSeconds / 60
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }

    const diffInHours = Math.floor(
      diffInMinutes / 60
    );

    if (diffInHours < 24) {
      return `${diffInHours} hr${
        diffInHours > 1 ? "s" : ""
      } ago`;
    }

    const diffInDays = Math.floor(
      diffInHours / 24
    );

    if (diffInDays < 7) {
      return `${diffInDays} day${
        diffInDays > 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString();
  };

  const statusText = isOnline
    ? "Active now"
    : formatLastSeen(user?.lastSeen);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group w-full text-left
        flex items-center gap-3
        px-3 py-3
        rounded-2xl
        transition-all duration-200
        border
        ${
          active
            ? "bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5"
            : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
        }
      `}
    >
      {/* ================= AVATAR ================= */}

      <div className="relative flex-shrink-0">

        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name}
            className={`
              w-12 h-12
              rounded-full
              object-cover
              border-2
              transition-all duration-200
              ${
                isOnline
                  ? "border-emerald-400/70"
                  : "border-white/10"
              }
            `}
          />
        ) : (
          <div
            className={`
              w-12 h-12
              rounded-full
              flex items-center justify-center
              text-white
              font-semibold
              text-base
              border-2
              ${
                active
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/30"
                  : "bg-gradient-to-br from-slate-700 to-slate-800 border-white/10"
              }
            `}
          >
            {firstLetter}
          </div>
        )}

        {/* ================= ONLINE DOT ================= */}

        {isOnline && (
          <span
            className="
              absolute bottom-0 right-0
              w-3.5 h-3.5
              rounded-full
              bg-emerald-400
              border-[3px]
              border-slate-900
              shadow-sm
              shadow-emerald-400/40
            "
          />
        )}

      </div>

      {/* ================= USER INFO ================= */}

      <div className="flex-1 min-w-0">

        {/* NAME + TIME */}

        <div className="flex items-center justify-between gap-2">

          <div className="flex items-center gap-1.5 min-w-0">

            <h3
              className={`
                truncate text-sm font-semibold
                ${
                  active
                    ? "text-white"
                    : "text-slate-200 group-hover:text-white"
                }
              `}
            >
              {user?.name || "Unknown User"}
            </h3>

            {/* Small Online Indicator */}

            {isOnline && (
              <Circle
                size={7}
                fill="currentColor"
                className="text-emerald-400 flex-shrink-0"
              />
            )}

          </div>

          {/* Last Message Time */}

          {user?.lastMessageTime && (
            <span className="text-[10px] text-slate-600 flex-shrink-0">
              {user.lastMessageTime}
            </span>
          )}

        </div>

        {/* ================= STATUS / LAST MESSAGE ================= */}

        <div className="flex items-center justify-between gap-2 mt-1">

          <div className="flex items-center gap-1.5 min-w-0">

            {user?.lastMessageSent && (
              <CheckCheck
                size={14}
                className="text-indigo-400 flex-shrink-0"
              />
            )}

            <p
              className={`
                text-xs truncate
                ${
                  isOnline
                    ? "text-emerald-400/80"
                    : "text-slate-500"
                }
              `}
            >
              {user?.lastMessage || statusText}
            </p>

          </div>

          {/* ================= UNREAD ================= */}

          {unreadCount > 0 && (
            <span
              className="
                min-w-5 h-5 px-1.5
                rounded-full
                bg-indigo-600
                text-white
                text-[10px]
                font-bold
                flex items-center justify-center
                shadow-lg
                shadow-indigo-600/20
                flex-shrink-0
              "
            >
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}

        </div>

      </div>
    </button>
  );
};

export default UserItem;