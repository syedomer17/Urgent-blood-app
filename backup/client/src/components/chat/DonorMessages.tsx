import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../../hooks/useSocket";
import ChatWindow, { type ChatMsg } from "./ChatWindow";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Conversation {
  peerId: string;
  peerName: string;
  messages: ChatMsg[];
  unread: number;
  lastTime: Date;
  lastPreview: string;
  lastMine: boolean;
}

interface PingNotif {
  id: string;
  from: string;
  requesterName: string;
  bloodGroup: string;
  patientName: string;
  urgency: string;
  timestamp: Date;
  dismissed: boolean;
}

interface DonorMessagesProps {
  myId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(date).toLocaleDateString([], { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const URGENCY_COLOR: Record<string, string> = {
  critical: "#b91c1c",
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a",
};

// ─── PingBanner ───────────────────────────────────────────────────────────────

function PingBanner({ ping, onReply, onDismiss }: { ping: PingNotif; onReply: () => void; onDismiss: () => void }) {
  const urgColor = URGENCY_COLOR[ping.urgency] ?? "#b71c1c";
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        borderLeft: `4px solid ${urgColor}`,
        animation: "ping-in 0.3s cubic-bezier(0.34,1.2,0.64,1) both",
      }}
    >
      <style>{`@keyframes ping-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: urgColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 22 }}>🔔</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1c1d", margin: 0 }}>
          <span style={{ color: urgColor }}>{ping.bloodGroup}</span> blood needed urgently
        </p>
        <p style={{ fontSize: 12, color: "#666", margin: "3px 0 8px" }}>
          {ping.requesterName} · Patient: {ping.patientName} · <span style={{ fontWeight: 700, color: urgColor, textTransform: "uppercase", fontSize: 10 }}>{ping.urgency}</span>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onReply}
            style={{ background: urgColor, color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Reply
          </button>
          <button
            onClick={onDismiss}
            style={{ background: "#f5f5f5", color: "#888", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
          >
            Dismiss
          </button>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>{timeAgo(ping.timestamp)}</span>
    </div>
  );
}

// ─── ConvRow ──────────────────────────────────────────────────────────────────

function ConvRow({ conv, onClick }: { conv: Conversation; onClick: () => void }) {
  const ini = initials(conv.peerName);
  const colors = ["#b71c1c", "#7c3aed", "#0369a1", "#047857", "#b45309"];
  const color = colors[conv.peerName.charCodeAt(0) % colors.length];

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        background: "#fff",
        border: "none",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget.style.background = "#f9f9f9"); }}
      onMouseLeave={(e) => { (e.currentTarget.style.background = "#fff"); }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: 0.5 }}>
          {ini}
        </div>
        {conv.unread > 0 && (
          <span style={{ position: "absolute", top: -3, right: -3, background: "#25d366", color: "#fff", borderRadius: 20, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, border: "2px solid #fff", padding: "0 4px" }}>
            {conv.unread > 99 ? "99+" : conv.unread}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <span style={{ fontWeight: conv.unread > 0 ? 700 : 600, fontSize: 15, color: "#1a1c1d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
            {conv.peerName}
          </span>
          <span style={{ fontSize: 11, color: conv.unread > 0 ? "#25d366" : "#aaa", flexShrink: 0, fontWeight: conv.unread > 0 ? 700 : 400 }}>
            {timeAgo(conv.lastTime)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {conv.lastMine && <span style={{ fontSize: 13, color: "#aaa" }}>✓✓</span>}
          <span style={{ fontSize: 13, color: conv.unread > 0 ? "#555" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unread > 0 ? 600 : 400 }}>
            {conv.lastPreview || "Start a conversation"}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── InboxSheet (portal) ──────────────────────────────────────────────────────

function InboxSheet({
  convList,
  pings,
  onOpenConv,
  onReplyPing,
  onDismissPing,
  onClose,
}: {
  convList: Conversation[];
  pings: PingNotif[];
  onOpenConv: (peerId: string, peerName: string) => void;
  onReplyPing: (ping: PingNotif) => void;
  onDismissPing: (id: string) => void;
  onClose: () => void;
}) {
  const activePings = pings.filter((p) => !p.dismissed);

  return createPortal(
    <>
      <style>{`
        @keyframes inbox-up { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
        <div
          style={{
            position: "relative",
            background: "#f0f0f0",
            borderRadius: "24px 24px 0 0",
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 -12px 48px rgba(0,0,0,0.2)",
            animation: "inbox-up 0.28s cubic-bezier(0.34,1.06,0.64,1) both",
          }}
        >
          {/* Header */}
          <div style={{ background: "#b71c1c", padding: "18px 20px 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Messages</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "2px 0 0" }}>
                {convList.length} conversation{convList.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Ping banners */}
            {activePings.length > 0 && (
              <div style={{ padding: "12px 16px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
                {activePings.map((ping) => (
                  <PingBanner
                    key={ping.id}
                    ping={ping}
                    onReply={() => onReplyPing(ping)}
                    onDismiss={() => onDismissPing(ping.id)}
                  />
                ))}
              </div>
            )}

            {/* Conversations */}
            {convList.length === 0 && activePings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#555", margin: 0 }}>No messages yet</p>
                <p style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>Messages you send and receive will appear here</p>
              </div>
            ) : (
              <div style={{ background: "#fff", marginTop: activePings.length > 0 ? 8 : 0 }}>
                {convList.map((conv) => (
                  <ConvRow key={conv.peerId} conv={conv} onClick={() => onOpenConv(conv.peerId, conv.peerName)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── DonorMessages (main export) — works for all roles ───────────────────────

const DonorMessages = ({ myId }: DonorMessagesProps) => {
  const { socket, connected } = useSocket();
  const [convs, setConvs] = useState<Map<string, Conversation>>(new Map());
  const [pings, setPings] = useState<PingNotif[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [openConvId, setOpenConvId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Load inbox from DB on mount ──────────────────────────────────────────

  useEffect(() => {
    fetch("/api/v1/chat/inbox", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const items: Array<{ peerId: string; peerName: string; lastMessage: string; lastTime: string; lastMine: boolean; unreadCount: number }> = data.data ?? [];
        setConvs((prev) => {
          const next = new Map(prev);
          for (const item of items) {
            const existing = next.get(item.peerId);
            next.set(item.peerId, {
              peerId: item.peerId,
              peerName: item.peerName,
              messages: existing?.messages ?? [],
              unread: item.unreadCount,
              lastTime: new Date(item.lastTime),
              lastPreview: item.lastMessage,
              lastMine: item.lastMine,
            });
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  // ── Load full history for a conversation ─────────────────────────────────

  const loadHistory = useCallback(async (peerId: string, peerName: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/v1/chat/${peerId}`, { credentials: "include" });
      const data = await res.json();
      const raw: Array<{ _id: string; from: string; text: string; createdAt: string }> = data.data ?? [];
      const history: ChatMsg[] = raw.map((m) => ({
        id: m._id,
        text: m.text,
        timestamp: new Date(m.createdAt),
        mine: m.from === myId,
      }));
      setConvs((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId);
        // Keep any live messages that arrived since we fetched (newer than last history msg)
        const lastHistTs = history.length > 0 ? history[history.length - 1].timestamp.getTime() : 0;
        const liveOnly = (existing?.messages ?? []).filter(
          (m) => m.id.startsWith("tmp_") || new Date(m.timestamp).getTime() > lastHistTs
        );
        next.set(peerId, {
          peerId,
          peerName,
          messages: [...history, ...liveOnly],
          unread: 0,
          lastTime: existing?.lastTime ?? new Date(),
          lastPreview: existing?.lastPreview ?? "",
          lastMine: existing?.lastMine ?? false,
        });
        return next;
      });
    } catch {
      //
    } finally {
      setHistoryLoading(false);
    }
  }, [myId]);

  // ── Socket listeners ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Incoming message from another user
    const onMessage = (data: { _id?: string; from: string; senderName: string; message: string; timestamp: string }) => {
      const msgId = data._id ?? crypto.randomUUID();
      const msg: ChatMsg = {
        id: msgId,
        text: data.message,
        timestamp: new Date(data.timestamp),
        mine: false,
        senderName: data.senderName,
      };
      setConvs((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.from);
        // Only add if not already present
        const alreadyHas = existing?.messages.some((m) => m.id === msgId) ?? false;
        next.set(data.from, {
          peerId: data.from,
          peerName: existing?.peerName ?? data.senderName ?? "Unknown",
          messages: alreadyHas ? (existing?.messages ?? []) : [...(existing?.messages ?? []), msg],
          // Don't bump unread if this conversation is open
          unread: data.from === openConvIdRef.current
            ? 0
            : (existing?.unread ?? 0) + (alreadyHas ? 0 : 1),
          lastTime: msg.timestamp,
          lastPreview: msg.text,
          lastMine: false,
        });
        return next;
      });
    };

    // Confirmation from server that our sent message was saved — update temp ID to real DB ID
    const onMessageSent = (data: { _id: string; from: string; message: string; timestamp: string }) => {
      setConvs((prev) => {
        const next = new Map(prev);
        // Update the most recent temp message for the open conversation
        for (const [peerId, conv] of next.entries()) {
          const idx = conv.messages.findIndex((m) => m.mine && m.id.startsWith("tmp_"));
          if (idx !== -1) {
            const updated = [...conv.messages];
            updated[idx] = { ...updated[idx], id: data._id, timestamp: new Date(data.timestamp) };
            next.set(peerId, { ...conv, messages: updated });
            break;
          }
        }
        return next;
      });
    };

    const onPinged = (data: { from: string; requesterName: string; bloodGroup: string; patientName: string; urgency: string; timestamp: string }) => {
      setPings((prev) => [{
        id: crypto.randomUUID(),
        from: data.from,
        requesterName: data.requesterName,
        bloodGroup: data.bloodGroup,
        patientName: data.patientName,
        urgency: data.urgency,
        timestamp: new Date(data.timestamp),
        dismissed: false,
      }, ...prev]);
      setInboxOpen(true);
    };

    socket.on("receive_message", onMessage);
    socket.on("message_sent", onMessageSent);
    socket.on("donor_pinged", onPinged);
    return () => {
      socket.off("receive_message", onMessage);
      socket.off("message_sent", onMessageSent);
      socket.off("donor_pinged", onPinged);
    };
  }, [socket]);

  // Keep a ref of openConvId so the socket handler closure stays fresh
  const openConvIdRef = useRef<string | null>(null);
  useEffect(() => { openConvIdRef.current = openConvId; }, [openConvId]);

  // ── Open conversation ────────────────────────────────────────────────────

  const openConv = useCallback(async (peerId: string, peerName: string) => {
    setInboxOpen(false);
    // Clear unread immediately
    setConvs((prev) => {
      const next = new Map(prev);
      const c = next.get(peerId);
      if (c) next.set(peerId, { ...c, unread: 0 });
      return next;
    });
    setOpenConvId(peerId);
    // Always reload history fresh
    await loadHistory(peerId, peerName);
  }, [loadHistory]);

  // ── Send message ─────────────────────────────────────────────────────────

  const handleSend = useCallback((text: string) => {
    if (!openConvId || !socket) return;
    const tempId = `tmp_${Date.now()}`;
    const msg: ChatMsg = { id: tempId, text, timestamp: new Date(), mine: true };
    socket.emit("send_message", { recipientId: openConvId, message: text });
    setConvs((prev) => {
      const next = new Map(prev);
      const c = next.get(openConvId);
      if (c) {
        next.set(openConvId, {
          ...c,
          messages: [...c.messages, msg],
          lastTime: msg.timestamp,
          lastPreview: text,
          lastMine: true,
        });
      }
      return next;
    });
  }, [socket, openConvId]);

  const totalUnread = Array.from(convs.values()).reduce((s, c) => s + c.unread, 0);
  const activePings = pings.filter((p) => !p.dismissed);
  const convList = Array.from(convs.values()).sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
  const currentConv = openConvId ? convs.get(openConvId) : undefined;

  // ── Render: floating FAB + sheets ────────────────────────────────────────

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setInboxOpen(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 20,
          zIndex: 1000,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "#b71c1c",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(183,28,28,0.45)",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget.style.transform = "scale(1.08)"); }}
        onMouseLeave={(e) => { (e.currentTarget.style.transform = "scale(1)"); }}
        title="Messages"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {(totalUnread + activePings.length) > 0 && (
          <span style={{ position: "absolute", top: 2, right: 2, background: "#25d366", color: "#fff", borderRadius: 20, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, border: "2.5px solid #fff", padding: "0 4px" }}>
            {totalUnread + activePings.length}
          </span>
        )}
        {connected && (
          <span style={{ position: "absolute", bottom: 4, left: 4, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid #fff" }} />
        )}
      </button>

      {/* Inbox sheet */}
      {inboxOpen && (
        <InboxSheet
          convList={convList}
          pings={pings}
          onOpenConv={openConv}
          onReplyPing={(ping) => {
            setPings((prev) => prev.map((p) => p.id === ping.id ? { ...p, dismissed: true } : p));
            openConv(ping.from, ping.requesterName);
          }}
          onDismissPing={(id) => setPings((prev) => prev.map((p) => p.id === id ? { ...p, dismissed: true } : p))}
          onClose={() => setInboxOpen(false)}
        />
      )}

      {/* Chat window */}
      {currentConv && openConvId && (
        <ChatWindow
          messages={currentConv.messages}
          historyLoading={historyLoading}
          peerName={currentConv.peerName}
          peerInitials={initials(currentConv.peerName)}
          socket={socket}
          peerId={openConvId}
          onSend={handleSend}
          onClose={() => setOpenConvId(null)}
        />
      )}
    </>
  );
};

export default DonorMessages;
