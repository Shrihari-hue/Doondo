import api from "./api";

export const jobService = {
  getJobs: async (params) => {
    const { data } = await api.get("/jobs", { params });
    return data;
  },
  getJobById: async (id) => {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },
  createJob: async (payload) => {
    const { data } = await api.post("/jobs", payload);
    return data;
  },
  applyToJob: async (payload) => {
    const { data } = await api.post("/jobs/apply", payload);
    return data;
  },
  toggleBookmark: async (id) => {
    const { data } = await api.post(`/jobs/${id}/bookmark`);
    return data;
  },
  getSavedJobs: async () => {
    const { data } = await api.get("/jobs/saved/me");
    return data;
  },
};
