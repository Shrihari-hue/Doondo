import api from "./api";

export const employerService = {
  getJobs: async () => {
    const { data } = await api.get("/employer/jobs");
    return data;
  },
  getApplicants: async (params = {}) => {
    const { data } = await api.get("/employer/applicants", { params });
    return data;
  },
  updateJob: async (id, payload) => {
    const { data } = await api.put(`/employer/jobs/${id}`, payload);
    return data;
  },
  updateApplicantStatus: async (id, status) => {
    const { data } = await api.put(`/employer/applicants/${id}/status`, { status });
    return data;
  },
  updateApplicantDetails: async (id, payload) => {
    const { data } = await api.put(`/employer/applicants/${id}/details`, payload);
    return data;
  },
};
