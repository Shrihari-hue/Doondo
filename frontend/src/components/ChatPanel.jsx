import { SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { getSocket } from "../services/socket";

const ChatPanel = ({ initialConversationId = "" }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    chatService.getConversations().then((data) => {
      setConversations(data);
      if (!selectedConversationId && data[0]?._id) {
        setSelectedConversationId(data[0]._id);
      }
    });
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return undefined;
    }

    chatService.getMessages(selectedConversationId).then(setMessages);

    const socket = getSocket();
    socket.emit("conversation:join", selectedConversationId);
    socket.on("chat:message", (message) => {
      const senderId = typeof message.sender === "object" ? message.sender?._id : message.sender;

      if (
        String(message.conversation) === String(selectedConversationId) &&
        String(senderId) !== String(user?.id || user?._id)
      ) {
        setMessages((current) => [...current, message]);
      }
    });

    return () => {
      socket.off("chat:message");
    };
  }, [selectedConversationId, user]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim() || !selectedConversationId) {
      return;
    }

    const nextMessage = await chatService.sendMessage(selectedConversationId, text);
    setMessages((current) => [...current, nextMessage]);
    setText("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="card-surface p-4">
        <h3 className="mb-4 font-display text-xl">Chats</h3>
        <div className="space-y-3">
          {conversations.length ? (
            conversations.map((conversation) => {
              const otherParticipant = conversation.participants?.find(
                (participant) => String(participant._id) !== String(user?.id || user?._id)
              );
              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation._id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    selectedConversationId === conversation._id ? "border-coral bg-coral/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="font-semibold">{otherParticipant?.employerProfile?.businessName || otherParticipant?.name}</div>
                  <div className="mt-1 text-xs text-white/55">{conversation.lastMessage || "Start conversation"}</div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">
              No conversations yet.
            </div>
          )}
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="mb-4 h-[320px] space-y-3 overflow-y-auto pr-2">
          {messages.length ? (
            messages.map((message) => (
              <div key={message._id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/45">{message.sender?.name || "You"}</div>
                <div className="mt-1 text-sm">{message.text}</div>
              </div>
            ))
          ) : (
            <div className="grid h-full place-items-center text-sm text-white/50">Select a conversation to start chatting.</div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-3">
          <input className="input-base" value={text} onChange={(event) => setText(event.target.value)} placeholder="Message employer or candidate" />
          <button type="submit" className="button-primary px-4">
            <SendHorizonal size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
