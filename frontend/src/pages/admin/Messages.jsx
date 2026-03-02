import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader";
import {
  deleteMessage,
  getAllMessages,
  markMessageRead,
} from "../../services/contactService";

export default function Messages() {
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState([]);
  const [query, setQuery] = useState("");
  const [activeChatKey, setActiveChatKey] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllMessages();
      setMsgs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMsgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chats = useMemo(() => {
    const map = new Map();

    for (const m of msgs) {
      const name = m.name || m.email || "User";
      const email = m.email || "";
      const key = email || `${name}-unknown`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          email,
          messages: [],
          unread: 0,
          lastAt: null,
          lastText: "",
        });
      }

      const row = map.get(key);
      row.messages.push(m);
      if (String(m.status).toLowerCase() !== "read") row.unread += 1;
    }

    const arr = Array.from(map.values()).map((c) => {
      const sorted = c.messages
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const last = sorted[sorted.length - 1];
      return {
        ...c,
        messages: sorted,
        lastAt: last?.createdAt || null,
        lastText: last?.message || "",
      };
    });

    arr.sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
    return arr;
  }, [msgs]);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      `${c.name} ${c.email} ${c.lastText}`.toLowerCase().includes(q)
    );
  }, [chats, query]);

  useEffect(() => {
    if (!activeChatKey && filteredChats.length > 0) {
      setActiveChatKey(filteredChats[0].key);
    }
  }, [activeChatKey, filteredChats]);

  const activeChat = useMemo(
    () => chats.find((c) => c.key === activeChatKey) || null,
    [chats, activeChatKey]
  );

  const onMarkRead = async (id) => {
    try {
      setActingId(id);
      await markMessageRead(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to mark as read");
    } finally {
      setActingId(null);
    }
  };

  const onDelete = async (id) => {
    const ok = confirm("Delete this message?");
    if (!ok) return;
    try {
      setActingId(id);
      await deleteMessage(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete message");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <Loader label="Loading messages..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • CONTACT • CHAT VIEW
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Messages <span className="text-gold">Inbox</span>
        </h1>
      </div>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden min-h-[70vh] grid lg:grid-cols-[320px_1fr]">
        {/* Left chat list */}
        <aside className="border-r border-white/10 bg-black/25">
          <div className="p-4 border-b border-white/10">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#f7d774]/40"
            />
          </div>

          <div className="max-h-[calc(70vh-86px)] overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-sm text-white/60">No chats found.</div>
            ) : (
              filteredChats.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveChatKey(c.key)}
                  className={`w-full text-left p-4 border-b border-white/10 transition ${
                    c.key === activeChatKey
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{c.name}</p>
                    {c.unread > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#f7d774] text-black font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate mt-1">
                    {c.email || "No email"}
                  </p>
                  <p className="text-xs text-white/55 truncate mt-1">
                    {c.lastText || "No message"}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right chat window */}
        <section className="flex flex-col bg-[#0b0b0b]">
          {!activeChat ? (
            <div className="h-full grid place-items-center text-white/60">
              Select a chat to view messages.
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/10 bg-black/30">
                <p className="font-bold text-lg">{activeChat.name}</p>
                <p className="text-sm text-white/65">{activeChat.email || "-"}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
                {activeChat.messages.map((m) => {
                  const isRead = String(m.status).toLowerCase() === "read";
                  return (
                    <div key={m._id} className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-sm">
                            {m.subject || "No Subject"}
                          </p>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              isRead
                                ? "bg-green-500/20 text-green-300"
                                : "bg-yellow-400/20 text-yellow-200"
                            }`}
                          >
                            {isRead ? "read" : "unread"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/85 whitespace-pre-wrap break-words">
                          {m.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-white/55">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleString()
                              : "-"}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <button
                                onClick={() => onMarkRead(m._id)}
                                disabled={actingId === m._id}
                                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs disabled:opacity-60"
                              >
                                {actingId === m._id ? "..." : "Mark Read"}
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(m._id)}
                              disabled={actingId === m._id}
                              className="px-2.5 py-1 rounded-lg bg-red-500/85 text-white text-xs disabled:opacity-60"
                            >
                              {actingId === m._id ? "..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
