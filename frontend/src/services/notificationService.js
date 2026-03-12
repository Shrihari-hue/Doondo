import api from "./api";

export const notificationService = {
  getNotifications: async () => {
    const { data } = await api.get("/notifications");
    return data;
  },
  markRead: async (id) => {
    const { data } = await api.post(`/notifications/${id}/read`);
    return data;
  },
};
