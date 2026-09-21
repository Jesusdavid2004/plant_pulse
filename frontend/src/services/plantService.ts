import { apiClient } from './apiClient';

export interface Plant {
  id: string;
  name: string;
  species?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantData {
  name: string;
  species?: string;
  userId: string;
}

export const plantService = {
  getAll: () => apiClient.get<Plant[]>('/plants'),

  getById: (id: string) => apiClient.get<Plant>(`/plants/${id}`),

  create: (data: CreatePlantData) => apiClient.post<Plant>('/plants', data),

  update: (id: string, data: Partial<Plant>) =>
    apiClient.put<Plant>(`/plants/${id}`, data),

  delete: (id: string) => apiClient.delete<{ message: string }>(`/plants/${id}`),

  uploadImage: (plantId: string, file: File, dayLabel: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('dayLabel', dayLabel);
    return apiClient.upload<{ filename: string; path: string }>(
      `/plants/${plantId}/images`,
      formData
    );
  },
};
