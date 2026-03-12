import api from "./api";

export const chatService = {
  getConversations: async () => {
    const { data } = await api.get("/chat/conversations");
    return data;
  },
  createConversation: async (payload) => {
    const { data } = await api.post("/chat/conversations", payload);
    return data;
  },
  getMessages: async (conversationId) => {
    const { data } = await api.get(`/chat/${conversationId}/messages`);
    return data;
  },
  sendMessage: async (conversationId, text) => {
    const { data } = await api.post(`/chat/${conversationId}/messages`, { text });
    return data;
  },
};
