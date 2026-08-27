import apiClient from './api';

export interface HealthResponse {
  status: string;
  message: string;
}

export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};
