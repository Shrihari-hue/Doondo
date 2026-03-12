import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";
import { getSocket } from "../services/socket";

const NotificationBell = ({ compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const loadNotifications = async () => {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);

    const socket = getSocket();
    socket.emit("user:join", user.id || user._id);
    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current]);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.message });
      }
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      clearInterval(interval);
      socket.off("notification:new");
    };
  }, [user]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const resolveNotificationTarget = (notification) => {
    if (notification.type === "chat" && notification.metadata?.conversationId) {
      return {
        path: user?.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker",
        state: {
          focus: "chat",
          conversationId: notification.metadata.conversationId,
        },
      };
    }

    if (notification.type === "job" && notification.metadata?.jobId) {
      return {
        path: `/jobs/${notification.metadata.jobId}`,
      };
    }

    if (notification.type === "application") {
      if (user?.role === "employer") {
        return {
          path: "/dashboard/employer",
          state: {
            focus: "applicants",
            jobId: notification.metadata?.jobId || "",
          },
        };
      }

      return {
        path: "/dashboard/seeker",
        state: {
          focus: "applications",
          jobId: notification.metadata?.jobId || "",
        },
      };
    }

    if (notification.type === "subscription") {
      return {
        path: "/subscription",
      };
    }

    return {
      path: user?.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker",
    };
  };

  const handleNotificationClick = async (notification) => {
    if (notification._id && !notification.read) {
      try {
        await notificationService.markRead(notification._id);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
      } catch {
        // Keep navigation responsive even if marking as read fails.
      }
    }

    const target = resolveNotificationTarget(notification);
    setOpen(false);
    navigate(target.path, { state: target.state });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`rounded-2xl border border-white/10 bg-white/5 ${compact ? "p-3" : "px-4 py-2"}`}
      >
        <span className="relative inline-flex">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-3xl border border-white/10 bg-[#14201c] p-4 shadow-glow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg">Alerts</h3>
            <span className="text-xs text-white/50">{unreadCount} unread</span>
          </div>
          <div className="space-y-3">
            {notifications.length ? (
              notifications.slice(0, 6).map((notification) => (
                <button
                  key={notification._id || `${notification.title}-${notification.message}`}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-2xl border bg-white/5 p-3 text-left transition hover:border-coral/40 hover:bg-white/10 ${
                    notification.read ? "border-white/10" : "border-coral/20"
                  }`}
                >
                  <div className="text-sm font-semibold">{notification.title}</div>
                  <div className="mt-1 text-xs text-white/65">{notification.message}</div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
