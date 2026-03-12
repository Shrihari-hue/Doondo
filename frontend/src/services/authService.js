import api from "./api";

export const authService = {
  register: async (payload) => {
    const { data } = await api.post("/register", payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await api.post("/login", payload);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get("/profile");
    return data;
  },
  updateProfile: async (payload) => {
    const { data } = await api.put("/profile", payload);
    return data;
  },
  uploadProfileAssets: async (formData) => {
    const { data } = await api.post("/profile/assets", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
  deleteProfileAsset: async (assetType) => {
    const { data } = await api.delete(`/profile/assets/${assetType}`);
    return data;
  },
};
