"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, Send, MessageSquare, CheckCheck, X } from "lucide-react";
import type {
  Conversation,
  Message,
  Profile,
} from "@/src/types/messages";
import "./messages.css";

/*mock current user*/
const CURRENT_USER_ID = "user-tenant-001";

/* mock profiles  */
const MOCK_PROFILES: Profile[] = [
  { id: "manager-001", first_name: "Ahmad", last_name: "Santoso", role_id: "manager", phone: "", created_at: "", updated_at: "" },
  { id: "manager-002", first_name: "Siti", last_name: "Rahayu", role_id: "manager", phone: "", created_at: "", updated_at: "" },
  { id: "tenant-002", first_name: "Budi", last_name: "Prasetyo", role_id: "tenant", phone: "", created_at: "", updated_at: "" },
];

/* mock conversations */
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-001",
    created_at: "2026-04-28T10:00:00Z",
    participants: [MOCK_PROFILES[0]],
    unread_count: 2,
    last_message: {
      id: "msg-003",
      conversation_id: "conv-001",
      sender_id: "manager-001",
      content: "Your payment has been confirmed.",
      created_at: "2026-04-28T11:57:00Z",
    },
  },
  {
    id: "conv-002",
    created_at: "2026-04-27T09:00:00Z",
    participants: [MOCK_PROFILES[1]],
    unread_count: 0,
    last_message: {
      id: "msg-006",
      conversation_id: "conv-002",
      sender_id: CURRENT_USER_ID,
      content: "Thank you, I'll check that.",
      created_at: "2026-04-27T14:20:00Z",
    },
  },
];

/* mock messages*/
const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-001": [
    { id: "msg-001", conversation_id: "conv-001", sender_id: "manager-001", content: "Hello! How can I help you today?", created_at: "2026-04-28T11:50:00Z" },
    { id: "msg-002", conversation_id: "conv-001", sender_id: CURRENT_USER_ID, content: "Hi, I wanted to ask about my payment status for April.", created_at: "2026-04-28T11:53:00Z" },
    { id: "msg-003", conversation_id: "conv-001", sender_id: "manager-001", content: "Your payment has been confirmed.", created_at: "2026-04-28T11:57:00Z" },
  ],
  "conv-002": [
    { id: "msg-004", conversation_id: "conv-002", sender_id: "manager-002", content: "There's a scheduled maintenance on May 3rd. Water will be off from 8–10 AM.", created_at: "2026-04-27T14:10:00Z" },
    { id: "msg-005", conversation_id: "conv-002", sender_id: CURRENT_USER_ID, content: "Okay, noted!", created_at: "2026-04-27T14:15:00Z" },
    { id: "msg-006", conversation_id: "conv-002", sender_id: CURRENT_USER_ID, content: "Thank you, I'll check that.", created_at: "2026-04-27T14:20:00Z" },
  ],
};

/* ─────────────────────── helpers ─────────────────────────── */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB") + " " + formatTime(iso);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getInitials(p: Profile) {
  return `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
}

function getParticipantName(participants: Profile[]) {
  return participants.map(p => `${p.first_name} ${p.last_name}`).join(", ");
}

/* main component  */
export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : [];

  // auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // filter conversations by participant name
  const filteredConvs = conversations.filter(c =>
    getParticipantName(c.participants)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // filter profiles in modal
  const filteredProfiles = MOCK_PROFILES.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    // TODO: mark as read — PATCH /api/conversations/:id/read
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c)
    );
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConvId) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConvId,
      sender_id: CURRENT_USER_ID,
      content: inputText.trim(),
      created_at: new Date().toISOString(),
      // TODO: POST /api/messages { conversation_id, content }
    };

    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), newMsg],
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === activeConvId
          ? { ...c, last_message: newMsg }
          : c
      )
    );

    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    if (!selectedProfile) return;

    // TODO: POST /api/conversations { participant_ids: [selectedProfile.id] }
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      created_at: new Date().toISOString(),
      participants: [selectedProfile],
      unread_count: 0,
    };

    setConversations(prev => [newConv, ...prev]);
    setMessages(prev => ({ ...prev, [newConv.id]: [] }));
    setActiveConvId(newConv.id);
    setShowNewModal(false);
    setSelectedProfile(null);
    setModalSearch("");
  };

  return (
    <div className="messages-layout">

      {/* ── Left: conversation list ── */}
      <div className="conv-panel">
        <div className="conv-panel-header">
          <h1 className="conv-panel-title">Messages</h1>
          <div className="conv-search-row">
            <div className="conv-search-wrap">
              <span className="conv-search-icon"><Search size={14} /></span>
              <input
                className="conv-search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="new-conv-btn" onClick={() => setShowNewModal(true)} title="New conversation">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="conv-list">
          {filteredConvs.length === 0 && (
            <p className="no-conv-empty">No conversations found.</p>
          )}
          {filteredConvs.map(conv => {
            const name = getParticipantName(conv.participants);
            const initials = conv.participants[0]
              ? getInitials(conv.participants[0])
              : "?";
            const isManager = conv.participants[0]?.role_id === "manager";

            return (
              <div
                key={conv.id}
                className={`conv-item ${activeConvId === conv.id ? "active" : ""}`}
                onClick={() => handleSelectConv(conv.id)}
              >
                <div className={`conv-avatar ${isManager ? "manager" : ""}`}>
                  {initials}
                </div>
                <div className="conv-info">
                  <p className="conv-name">{name}</p>
                  {conv.last_message && (
                    <p className="conv-preview">
                      {conv.last_message.sender_id === CURRENT_USER_ID ? "You: " : ""}
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
                <div className="conv-meta">
                  {conv.last_message && (
                    <span className="conv-time">{timeAgo(conv.last_message.created_at)}</span>
                  )}
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="conv-badge">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: chat panel */}
      <div className="chat-panel">
        {!activeConv ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessageSquare size={28} />
            </div>
            <p className="chat-empty-text">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                {activeConv.participants[0] ? getInitials(activeConv.participants[0]) : "?"}
              </div>
              <div>
                <p className="chat-header-name">{getParticipantName(activeConv.participants)}</p>
                <p className="chat-header-sub">
                  {activeConv.participants[0]?.role_id === "manager" ? "Management" : "Tenant"}
                </p>
              </div>
            </div>

            {/* messages */}
            <div className="chat-messages">
              {activeMessages.map((msg, i) => {
                const isMine = msg.sender_id === CURRENT_USER_ID;
                const sender = isMine
                  ? null
                  : activeConv.participants.find(p => p.id === msg.sender_id);
                const showName = !isMine && (i === 0 || activeMessages[i - 1]?.sender_id !== msg.sender_id);

                return (
                  <div key={msg.id} className={`msg-group ${isMine ? "mine" : "theirs"}`}>
                    {showName && sender && (
                      <p className="msg-sender-name">{sender.first_name} {sender.last_name}</p>
                    )}
                    <div className={`msg-row ${isMine ? "mine" : ""}`}>
                      {!isMine && (
                        <div className={`msg-avatar-sm ${activeConv.participants[0]?.role_id === "manager" ? "manager" : ""}`}>
                          {sender ? getInitials(sender) : "?"}
                        </div>
                      )}
                      <div className={`msg-bubble ${isMine ? "mine" : "theirs"}`}>
                        {msg.content}
                      </div>
                    </div>
                    <p className={`msg-time ${isMine ? "mine" : ""}`}>{formatDate(msg.created_at)}</p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* input */}
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                placeholder="Send a message..."
                rows={1}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputText.trim()}
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── New conversation modal ── */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p className="modal-title">New Conversation</p>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#a0886a", display: "grid", placeItems: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <input
              className="modal-search"
              placeholder="Search by name..."
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              autoFocus
            />

            <div className="modal-user-list">
              {filteredProfiles.map(profile => (
                <div
                  key={profile.id}
                  className={`modal-user-item ${selectedProfile?.id === profile.id ? "selected" : ""}`}
                  onClick={() => setSelectedProfile(
                    selectedProfile?.id === profile.id ? null : profile
                  )}
                >
                  <div className="modal-avatar">
                    {getInitials(profile)}
                  </div>
                  <span className="modal-user-name">
                    {profile.first_name} {profile.last_name}
                    <span style={{ fontSize: "11px", color: "#a0886a", marginLeft: "6px" }}>
                      {profile.role_id}
                    </span>
                  </span>
                  {selectedProfile?.id === profile.id && (
                    <CheckCheck size={16} className="modal-check" />
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleNewConversation}
                disabled={!selectedProfile}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
