import apiClient from "../client";

export const planesService = {
  getPlanes: async () => {
    const response = await apiClient.get('/planes');
    return response.data;
  },

  suscribirPlan: async (planId: string) => {
    const response = await apiClient.post(`/planes/${planId}`);
    return response.data;
  },
};

export default planesService;
