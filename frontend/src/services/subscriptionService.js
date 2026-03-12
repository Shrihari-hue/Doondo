import api from "./api";

export const subscriptionService = {
  getPlans: async () => {
    const { data } = await api.get("/subscriptions/plans");
    return data;
  },
  createOrder: async (planId) => {
    const { data } = await api.post("/subscriptions/create-order", { planId });
    return data;
  },
  verifyPayment: async (payload) => {
    const { data } = await api.post("/subscriptions/verify", payload);
    return data;
  },
};
