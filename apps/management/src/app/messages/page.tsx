"use client";

import { useEffect, useState, useRef } from "react";
import { Send, User, MessageSquare, Plus, Phone, Megaphone } from "lucide-react";
import { KosanCard, KosanButton, KosanSearchBar, KosanInput, useToast } from "@sbhms/ui";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: {
    name: string;
  };
}

interface Participant {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    role?: {
      id: string;
      name: string;
    };
  };
}

interface Conversation {
  id: string;
  created_at: string;
  conversation_participants: Participant[];
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function MessagesPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "tenant" | "non-tenant">("all");

  // New Chat Modal
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [searchTenant, setSearchTenant] = useState("");

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessageText, setBroadcastMessageText] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (selectConvId?: string) => {
    try {
      setLoadingConv(true);
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
        if (selectConvId) {
          const matched = (data.data || []).find((c: Conversation) => c.id === selectConvId);
          if (matched) setSelectedConv(matched);
        } else if (data.data && data.data.length > 0 && !selectedConv) {
          setSelectedConv(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMsgs(true);
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setMyId(data.data.id);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data || []).filter((u: Profile) => u.role?.name === "tenant");
        setTenants(filtered);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  useEffect(() => {
    // Initial fetches
    fetchMyProfile();
    fetchConversations();
    fetchTenants();

    // Setup polling for messages and conversations
    const interval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    try {
      const res = await fetch(`/api/messages/${selectedConv.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchMessages(selectedConv.id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleStartConversation = async (tenantId: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [tenantId] }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setIsNewChatOpen(false);
        setSearchTenant("");
        await fetchConversations(data.data.id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessageText.trim()) return;
    try {
      setBroadcasting(true);
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: broadcastMessageText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Broadcast message sent successfully!");
        setBroadcastMessageText("");
        setIsBroadcastOpen(false);
        await fetchConversations();
      } else {
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Error sending broadcast message");
    } finally {
      setBroadcasting(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.conversation_participants.find((p) => p.profile.id !== myId);
    return other?.profile || conv.conversation_participants[0]?.profile;
  };

  const filteredTenants = tenants.filter((t) => {
    const fullName = `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase();
    return fullName.includes(searchTenant.toLowerCase());
  });

  const filteredConversations = conversations.filter((conv) => {
    const partner = getOtherParticipant(conv);
    if (filterType === "all") return true;
    if (filterType === "tenant") return partner?.role?.name === "tenant";
    if (filterType === "non-tenant") return partner?.role?.name !== "tenant";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Tenant Chat</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">Communicate directly with Kosan Mama tenants</p>
        </div>
        <div className="flex gap-2">
          <KosanButton
            variant="secondary"
            size="sm"
            leftIcon={<Megaphone size={14} />}
            onClick={() => setIsBroadcastOpen(true)}
          >
            Broadcast
          </KosanButton>
          <KosanButton
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsNewChatOpen(true)}
          >
            New Chat
          </KosanButton>
        </div>
      </div>

      {/* Main Messaging Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        {/* Conversations List Card */}
        <KosanCard className="flex flex-col h-[600px] overflow-hidden">
          <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Conversations</h2>
          
          {/* Filtering tabs */}
          <div className="flex gap-1 mb-4 bg-[#EFE3D0] p-1 rounded-xl">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-[#553D2B] text-white shadow-sm"
                  : "text-[#8B6F5E] hover:bg-[#DFC9A8]/30"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("tenant")}
              className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "tenant"
                  ? "bg-[#553D2B] text-white shadow-sm"
                  : "text-[#8B6F5E] hover:bg-[#DFC9A8]/30"
              }`}
            >
              Tenants
            </button>
            <button
              onClick={() => setFilterType("non-tenant")}
              className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "non-tenant"
                  ? "bg-[#553D2B] text-white shadow-sm"
                  : "text-[#8B6F5E] hover:bg-[#DFC9A8]/30"
              }`}
            >
              Non-Tenants
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredConversations.length === 0 ? (
              <p className="text-xs text-[#8B6F5E] text-center py-8">No active chats found.</p>
            ) : (
              filteredConversations.map((conv) => {
                const partner = getOtherParticipant(conv);
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-[#553D2B] text-white border-transparent"
                        : "bg-[#EFE3D0] text-[#2C1A0E] border-[#C8A96E]/20 hover:bg-[#DFC9A8]/40"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${isSelected ? "bg-white/10" : "bg-[#DFC9A8]"}`}>
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {partner?.first_name} {partner?.last_name || ""}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-white/60" : "text-[#8B6F5E]"}`}>
                        {partner?.phone || "No phone details"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </KosanCard>

        {/* Message View Area Card */}
        <KosanCard className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
          {selectedConv ? (
            <>
              {/* Active Conversation Header */}
              <div className="pb-3 border-b border-[#C8A96E]/15 flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-[#2C1A0E]">
                    Chat with {getOtherParticipant(selectedConv)?.first_name}{" "}
                    {getOtherParticipant(selectedConv)?.last_name || ""}
                  </h3>
                  <p className="text-xs text-[#8B6F5E] mt-0.5">
                    {getOtherParticipant(selectedConv)?.phone || "No contact info available"}
                  </p>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-[#8B6F5E]">Loading message history...</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === myId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-[#553D2B] text-white rounded-br-none"
                              : "bg-[#EFE3D0] text-[#2C1A0E] rounded-bl-none border border-[#C8A96E]/20"
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[9px] text-[#8B6F5E] mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#C8A96E]/15">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="flex-1 bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-[#553D2B] text-white rounded-xl hover:bg-[#3d2b1f] transition-all cursor-pointer"
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
                Select an existing conversation from the list or start a new chat with a tenant.
              </p>
            </div>
          )}
        </KosanCard>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 flex flex-col max-h-[500px]">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-3">Start a Chat</h2>

            <div className="mb-3">
              <KosanSearchBar
                placeholder="Search tenant by name..."
                value={searchTenant}
                onChange={setSearchTenant}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {filteredTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleStartConversation(t.id)}
                  className="w-full text-left p-3 bg-[#DFC9A8]/30 hover:bg-[#DFC9A8]/70 border border-[#C8A96E]/20 rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-[#DFC9A8] text-[#553D2B]">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2C1A0E]">
                      {t.first_name} {t.last_name || ""}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#8B6F5E] mt-0.5">
                      <Phone size={10} />
                      <span>{t.phone || "No phone info"}</span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredTenants.length === 0 && (
                <p className="text-xs text-[#8B6F5E] text-center py-6">No matching tenants found.</p>
              )}
            </div>

            <KosanButton variant="secondary" onClick={() => setIsNewChatOpen(false)}>
              Close
            </KosanButton>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 flex flex-col">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-1 flex items-center gap-2">
              <Megaphone size={20} className="text-[#C8A96E]" />
              Broadcast Message
            </h2>
            <p className="text-xs text-[#8B6F5E] mb-4">
              This message will be sent to all active tenants individually. They will be able to reply to you directly in their individual chats.
            </p>

            <textarea
              placeholder="Type your announcement here..."
              rows={4}
              value={broadcastMessageText}
              onChange={(e) => setBroadcastMessageText(e.target.value)}
              className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] mb-4 resize-none"
            />

            <div className="flex justify-end gap-2">
              <KosanButton variant="secondary" onClick={() => setIsBroadcastOpen(false)} disabled={broadcasting}>
                Cancel
              </KosanButton>
              <KosanButton
                variant="primary"
                onClick={handleSendBroadcast}
                loading={broadcasting}
                disabled={!broadcastMessageText.trim() || broadcasting}
              >
                Send Broadcast
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}