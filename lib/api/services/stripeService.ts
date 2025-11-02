import apiClient from "../client";

export const stripeService = {
  createCheckoutSession: async (items: {
    type: 'plan' | 'productos';
    planId?: string;
    productos?: { id: string; cantidad: number }[];
  }) => {
    const response = await apiClient.post('/stripe/create-checkout-session', items);
    return response.data;
  },
};

export default stripeService;
