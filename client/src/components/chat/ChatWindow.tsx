/**
 * ChatWindow — WhatsApp-style chat panel.
 * Rendered via React portal so it always floats above everything.
 *
 * Props:
 *  - messages       : array of ChatMessage
 *  - historyLoading : show skeleton while history loads
 *  - peerName       : display name of the other person
 *  - peerOnline     : show green dot when true
 *  - peerInitials   : 1-2 letter avatar fallback
 *  - accentColor    : bubble / header color (default #b71c1c)
 *  - socket         : Socket.IO socket (for typing indicator)
 *  - peerId         : recipient's user ID (for typing events)
 *  - onSend         : called with the typed text
 *  - onClose        : close the panel
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Socket } from "socket.io-client";

export interface ChatMsg {
  id: string;
  text: string;
  timestamp: Date;
  mine: boolean;
  senderName?: string;
}

interface ChatWindowProps {
  messages: ChatMsg[];
  historyLoading?: boolean;
  peerName: string;
  peerOnline?: boolean;
  peerInitials: string;
  accentColor?: string;
  socket: Socket | null;
  peerId: string;
  onSend: (text: string) => void;
  onClose: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateLabel(d: Date): string {
  const now = new Date();
  const date = new Date(d);
  const diff = Math.floor((now.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(d).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a: Date, b: Date) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function Bubble({ msg, accent }: { msg: ChatMsg; accent: string }) {
  return (
    <div style={{ display: "flex", justifyContent: msg.mine ? "flex-end" : "flex-start", marginBottom: 2 }}>
      <div
        style={{
          maxWidth: "72%",
          minWidth: 80,
          padding: "7px 12px 6px",
          borderRadius: msg.mine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          background: msg.mine ? accent : "#fff",
          color: msg.mine ? "#fff" : "#1a1c1d",
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <p style={{ fontSize: 14.5, margin: 0, lineHeight: 1.45, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
          {msg.text}
        </p>
        {/* time + tick row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
          <span style={{ fontSize: 10.5, opacity: 0.65, letterSpacing: 0.1 }}>
            {fmtTime(msg.timestamp)}
          </span>
          {msg.mine && (
            <span style={{ fontSize: 13, opacity: 0.7, lineHeight: 1 }}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TypingDots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 2 }}>
      <div style={{ background: "#fff", borderRadius: "4px 18px 18px 18px", padding: "10px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.12)", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#999", display: "inline-block", animation: "wa-bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── DateSeparator ────────────────────────────────────────────────────────────

function DateSep({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 6px" }}>
      <span style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", color: "#666", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
        {label}
      </span>
    </div>
  );
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────

const ChatWindow = ({
  messages,
  historyLoading = false,
  peerName,
  peerOnline = false,
  peerInitials,
  accentColor = "#b71c1c",
  socket,
  peerId,
  onSend,
  onClose,
}: ChatWindowProps) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // Listen for peer typing
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { from: string; isTyping: boolean }) => {
      if (data.from !== peerId) return;
      setPeerTyping(data.isTyping);
    };
    socket.on("user_typing_indicator", handler);
    return () => { socket.off("user_typing_indicator", handler); };
  }, [socket, peerId]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
    if (isTyping) {
      setIsTyping(false);
      socket?.emit("user_typing", { recipientId: peerId, isTyping: false });
    }
  };

  const handleChange = (val: string) => {
    setInput(val);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("user_typing", { recipientId: peerId, isTyping: true });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("user_typing", { recipientId: peerId, isTyping: false });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Build message list with date separators
  const rows: Array<{ type: "sep"; label: string } | { type: "msg"; msg: ChatMsg }> = [];
  let lastDate: Date | null = null;
  for (const msg of messages) {
    const d = new Date(msg.timestamp);
    if (!lastDate || !isSameDay(lastDate, d)) {
      rows.push({ type: "sep", label: fmtDateLabel(d) });
      lastDate = d;
    }
    rows.push({ type: "msg", msg });
  }

  return createPortal(
    <>
      {/* Global keyframe for typing dots */}
      <style>{`
        @keyframes wa-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes wa-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {/* Backdrop */}
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />

        {/* Panel */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "92vh",
            maxHeight: 680,
            borderRadius: "24px 24px 0 0",
            overflow: "hidden",
            boxShadow: "0 -12px 48px rgba(0,0,0,0.25)",
            animation: "wa-slide-up 0.28s cubic-bezier(0.34,1.06,0.64,1) both",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background: accentColor,
              padding: "14px 16px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Back / close */}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginLeft: -4, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Avatar */}
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0, position: "relative", letterSpacing: 0.5 }}>
              {peerInitials}
              {peerOnline && (
                <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#4ade80", border: "2px solid " + accentColor }} />
              )}
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {peerName}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "1px 0 0" }}>
                {peerTyping ? (
                  <span style={{ color: "#d4f5c0", fontStyle: "italic" }}>typing…</span>
                ) : peerOnline ? "online" : ""}
              </p>
            </div>
          </div>

          {/* ── Messages area ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px 8px",
              display: "flex",
              flexDirection: "column",
              background: "#ece5dd",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d0c8be' fill-opacity='0.35'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {historyLoading ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                {[1, 0.7, 0.5].map((op, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start", width: "100%" }}>
                    <div style={{ width: `${45 + i * 18}%`, height: 44, borderRadius: 16, background: `rgba(255,255,255,${op})`, animation: "wa-bounce 1.4s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                  </div>
                ))}
                <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>Loading messages…</p>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                  💬
                </div>
                <p style={{ color: "#555", fontSize: 14, fontWeight: 600, margin: 0 }}>No messages yet</p>
                <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Say hello to {peerName}!</p>
              </div>
            ) : (
              <>
                {rows.map((row, i) =>
                  row.type === "sep"
                    ? <DateSep key={`sep-${i}`} label={row.label} />
                    : <Bubble key={row.msg.id} msg={row.msg} accent={accentColor} />
                )}
                {peerTyping && <TypingDots />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ── */}
          <div
            style={{
              background: "#f0f0f0",
              padding: "10px 12px",
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {/* Text input */}
            <div style={{ flex: 1, background: "#fff", borderRadius: 24, padding: "10px 16px", display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                rows={1}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 15,
                  lineHeight: 1.4,
                  background: "transparent",
                  fontFamily: "inherit",
                  maxHeight: 100,
                  overflowY: "auto",
                  color: "#1a1c1d",
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: input.trim() ? accentColor : "#ccc",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.18s, transform 0.1s",
                boxShadow: input.trim() ? `0 2px 8px ${accentColor}55` : "none",
              }}
              onMouseDown={(e) => { if (input.trim()) (e.currentTarget.style.transform = "scale(0.92)"); }}
              onMouseUp={(e) => { (e.currentTarget.style.transform = "scale(1)"); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ChatWindow;
