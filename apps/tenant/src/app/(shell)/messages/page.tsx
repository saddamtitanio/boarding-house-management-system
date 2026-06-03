"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Send, MessageSquare, CheckCheck, X, User } from "lucide-react";
import type {
  Conversation,
  Message,
  Profile,
} from "@/src/types/messages";
import { KosanCard, KosanButton, KosanSearchBar, LoadingSpinner, useToast } from "@sbhms/ui";

/* Helper functions for formatting dates and text initials */
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  if (!p) return "?";
  const first = p.first_name?.[0] || "";
  const last = p.last_name?.[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
}

function getParticipantName(participants: Profile[]) {
  return participants.map(p => `${p.first_name} ${p.last_name || ""}`).join(", ");
}

export default function MessagesPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : [];

  // Scroll to the bottom of the chat panel on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Fetch current user details and initialize conversation list
  useEffect(() => {
    async function loadInitialData() {
      try {
        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          setMyId(profileData.data.id);
        }

        await fetchConversations();
        await fetchStaffList();
      } catch (err) {
        console.error("Failed to load initial chat details", err);
        toast.error("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Poll for messages in the active conversation and overall threads
  useEffect(() => {
    if (!activeConvId) return;

    fetchMessages(activeConvId);
    const interval = setInterval(() => {
      fetchMessages(activeConvId);
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeConvId]);

  // Fetch conversation threads from database
  const fetchConversations = async (selectId?: string) => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: Conversation[] = data.data.map((conv: any) => {
          const participants = (conv.conversation_participants || [])
            .map((cp: any) => cp.profile)
            .filter(Boolean);
          return {
            id: conv.id,
            created_at: conv.created_at,
            participants,
            unread_count: conv.unread_count || 0
          };
        });
        setConversations(mapped);
        if (selectId) {
          setActiveConvId(selectId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      toast.error("Failed to load conversations.");
    }
  };

  // Fetch messages inside a conversation thread
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(prev => ({
          ...prev,
          [convId]: data.data
        }));
      }
    } catch (err) {
      console.error("Failed to fetch messages for conversation", convId, err);
      toast.error("Failed to load message history.");
    }
  };

  // Fetch staff members to start a conversation
  const fetchStaffList = async () => {
    try {
      const res = await fetch("/api/messages/staff");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStaffList(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff list", err);
      toast.error("Failed to load staff contacts.");
    }
  };

  // Filter threads by other participant's name
  const getOtherParticipants = (participants: Profile[]) => {
    return participants.filter(p => p.id !== myId);
  };

  const filteredConvs = conversations.filter(c => {
    const others = getOtherParticipants(c.participants);
    return getParticipantName(others)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // Filter staff profiles inside the selection modal
  const filteredProfiles = staffList.filter(p =>
    `${p.first_name} ${p.last_name || ""}`.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
  };

  // Send a message reply to active conversation
  const handleSend = async () => {
    if (!inputText.trim() || !activeConvId || !myId) return;

    const text = inputText.trim();
    setInputText("");

    try {
      const res = await fetch(`/api/messages/${activeConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages(activeConvId);
        await fetchConversations();
        toast.success("Message sent.");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Create conversation thread with selected staff member
  const handleNewConversation = async () => {
    if (!selectedProfile) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [selectedProfile.id] }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        await fetchConversations(data.data.id);
        setShowNewModal(false);
        setSelectedProfile(null);
        setModalSearch("");
        toast.success("Conversation started.");
      }
    } catch (err) {
      console.error("Failed to create new conversation", err);
      toast.error("Failed to create conversation.");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading messages…" />;
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Messages</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">Communicate directly with Kosan Mama staff</p>
        </div>
        <KosanButton
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setShowNewModal(true)}
        >
          New Chat
        </KosanButton>
      </div>

      {/* Main Messaging Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        {/* Conversations List Card */}
        <KosanCard className="flex flex-col h-[600px] overflow-hidden">
          <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Conversations</h2>

          <div className="mb-4">
            <KosanSearchBar
              placeholder="Search by name..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredConvs.length === 0 ? (
              <p className="text-xs text-[#8B6F5E] text-center py-8">No conversations found.</p>
            ) : (
              filteredConvs.map(conv => {
                const others = getOtherParticipants(conv.participants);
                const partner = others[0] || conv.participants[0];
                const name = partner ? `${partner.first_name} ${partner.last_name || ""}` : "Management";
                const initials = partner ? getInitials(partner) : "?";
                const isSelected = activeConvId === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 cursor-pointer ${
                      isSelected
                      ? "bg-[#553D2B] text-white border-transparent"
                      : "bg-[#EFE3D0] text-[#2C1A0E] border-[#C8A96E]/20 hover:bg-[#D6B98A]/60 hover:border-[#B88B3E]/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? "bg-white/10 text-white" : "bg-[#DFC9A8] text-[#553D2B]"}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{name}</p>
                      <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-white/60" : "text-[#8B6F5E]"}`}>
                        Click to view discussion
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] ${isSelected ? "text-white/50" : "text-[#8B6F5E]"}`}>
                        {timeAgo(conv.created_at)}
                      </span>
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="bg-[#E07B39] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </KosanCard>

        {/* Message View Area Card */}
        <KosanCard className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
          {activeConv ? (
            <>
              {/* Active Conversation Header */}
              {(() => {
                const others = getOtherParticipants(activeConv.participants);
                const partner = others[0] || activeConv.participants[0];
                const name = partner ? `${partner.first_name} ${partner.last_name || ""}` : "Management";
                return (
                  <div className="pb-3 border-b border-[#C8A96E]/15 flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#DFC9A8] text-[#553D2B] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {partner ? getInitials(partner) : "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#2C1A0E]">
                        Chat with {name}
                      </h3>
                      <p className="text-xs text-[#8B6F5E] mt-0.5">
                        Management Staff
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {activeMessages.map((msg, i) => {
                  const isMine = msg.sender_id === myId;
                  const sender = isMine
                    ? null
                    : activeConv.participants.find(p => p.id === msg.sender_id);
                  const showName = !isMine && (i === 0 || activeMessages[i - 1]?.sender_id !== msg.sender_id);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${isMine ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      {showName && sender && (
                        <p className="text-[10px] font-semibold text-[#8B6F5E] mb-1 px-1">
                          {sender.first_name} {sender.last_name || ""}
                        </p>
                      )}
                      <div className="flex items-end gap-2">
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full bg-[#DFC9A8] text-[#553D2B] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {sender ? getInitials(sender) : "?"}
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? "bg-[#553D2B] text-white rounded-br-none"
                              : "bg-[#EFE3D0] text-[#2C1A0E] rounded-bl-none border border-[#C8A96E]/20"
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] text-[#8B6F5E] mt-1 ${isMine ? "text-right" : ""}`}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#C8A96E]/15 mt-auto">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-3 bg-[#553D2B] text-white rounded-xl hover:bg-[#3d2b1f] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[#8B6F5E]">
              <MessageSquare size={48} className="text-[#C8A96E]/30 mb-3" />
              <h3 className="font-semibold text-lg text-[#2C1A0E]">No Chat Selected</h3>
              <p className="text-sm max-w-xs mt-1">
                Select a conversation from the list or start a new chat with the management.
              </p>
            </div>
          )}
        </KosanCard>
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 flex flex-col max-h-[500px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-[#2C1A0E]">New Conversation</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-[#8B6F5E] hover:text-[#553D2B] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-3">
              <KosanSearchBar
                placeholder="Search staff by name..."
                value={modalSearch}
                onChange={setModalSearch}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {filteredProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(
                    selectedProfile?.id === profile.id ? null : profile
                  )}
                  className={`w-full text-left p-3 border rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                    selectedProfile?.id === profile.id
                      ? "bg-[#553D2B] text-white border-transparent"
                      : "bg-[#DFC9A8]/30 hover:bg-[#DFC9A8]/70 border-[#C8A96E]/20 text-[#2C1A0E]"
                  }`}
                >
                  <div className={`p-2 rounded-full ${selectedProfile?.id === profile.id ? "bg-white/10 text-white" : "bg-[#DFC9A8] text-[#553D2B]"}`}>
                    <User size={14} />
                  </div>
                  <span className="font-bold text-sm flex-1 text-left">
                    {profile.first_name} {profile.last_name || ""}
                  </span>
                  {selectedProfile?.id === profile.id && (
                    <CheckCheck size={16} className="text-white" />
                  )}
                </button>
              ))}
              {filteredProfiles.length === 0 && (
                <p className="text-xs text-[#8B6F5E] text-center py-6">No staff found.</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <KosanButton variant="secondary" size="sm" onClick={() => setShowNewModal(false)}>
                Cancel
              </KosanButton>
              <KosanButton
                variant="primary"
                size="sm"
                onClick={handleNewConversation}
                disabled={!selectedProfile}
              >
                Start Conversation
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
