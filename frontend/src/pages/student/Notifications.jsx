import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

const typeLabel = {
  course: "Course",
  payment: "Payment",
  certificate: "Certificate",
  message: "Message",
  system: "System",
};

export default function StudentNotifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications({ limit: 60, unreadOnly });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setUnreadCount(Number(res.data?.unreadCount || 0));
    } catch (err) {
      console.error(err);
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [unreadOnly]);

  const emptyText = useMemo(
    () =>
      unreadOnly
        ? "No unread notifications."
        : "No notifications yet. You will see course, payment, and certificate updates here.",
    [unreadOnly]
  );

  const onMarkRead = async (id) => {
    try {
      setActingId(id);
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const onMarkAll = async () => {
    try {
      setActingId("all");
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const onOpenLink = async (item) => {
    if (!item.isRead) await onMarkRead(item._id);
    if (item.link) navigate(item.link);
  };

  if (loading) return <Loader label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl border border-white/10 p-6">
        <p className="text-xs tracking-[0.25em] text-white/60">STUDENT • NOTIFICATIONS</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          My <span className="text-gold">Notifications</span>
        </h1>
        <p className="mt-2 text-white/65">
          New course announcements, payment replies, certificate updates, and more.
        </p>
      </div>

      <div className="glass rounded-3xl border border-white/10 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
              Unread: {unreadCount}
            </span>
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                unreadOnly
                  ? "border-[#f7d774]/40 bg-[#f7d774]/20 text-[#f7d774]"
                  : "border-white/10 bg-white/5 text-white/80"
              }`}
            >
              {unreadOnly ? "Showing unread" : "Show unread only"}
            </button>
          </div>

          <button
            type="button"
            onClick={onMarkAll}
            disabled={actingId === "all" || unreadCount === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition hover:bg-white/10 disabled:opacity-50"
          >
            {actingId === "all" ? "Marking..." : "Mark all read"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-white/60">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className={`rounded-2xl border p-4 transition ${
                  item.isRead
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-[#f7d774]/30 bg-[#f7d774]/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/60">{typeLabel[item.type] || "Update"}</p>
                    <p className="text-base font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-white/75">{item.message}</p>
                    <p className="mt-2 text-xs text-white/50">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.link ? (
                      <button
                        type="button"
                        onClick={() => onOpenLink(item)}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                      >
                        Open
                      </button>
                    ) : null}
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => onMarkRead(item._id)}
                        disabled={actingId === item._id}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 disabled:opacity-50"
                      >
                        {actingId === item._id ? "..." : "Mark read"}
                      </button>
                    ) : (
                      <span className="rounded-lg border border-green-400/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-300">
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
