import apiClient from './client';
import { Meditation, MantraElement } from '@/store/features/meditationSlice';

export interface CreateMantraRequest {
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  mantraArray: MantraElement[];
}

export interface CreateMantraResponse {
  message: string;
  queueId: number;
  filePath: string;
}

export interface GetAllMantrasResponse {
  mantras: Meditation[];
}

export interface FavoriteMantraResponse {
  message: string;
  mantraId: number;
  favorite: boolean;
}

export interface DeleteMantraResponse {
  message: string;
  mantraId: number;
}

// GET /mantras/all
export const getAllMantras = async (includePrivate: boolean = false): Promise<GetAllMantrasResponse> => {
  const url = includePrivate ? '/mantras/all?includePrivate=true' : '/mantras/all';
  const response = await apiClient.get<GetAllMantrasResponse>(url);
  return response.data;
};

// POST /mantras/create
export const createMantra = async (data: CreateMantraRequest): Promise<CreateMantraResponse> => {
  const response = await apiClient.post<CreateMantraResponse>('/mantras/create', data);
  return response.data;
};

// GET /mantras/:id/stream - Returns stream URL
export const getStreamUrl = (id: number): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/mantras/${id}/stream`;
};

// POST /mantras/favorite/:mantraId/:trueOrFalse
export const favoriteMantra = async (
  mantraId: number,
  isFavorite: boolean
): Promise<FavoriteMantraResponse> => {
  const trueOrFalse = isFavorite ? 'true' : 'false';
  const response = await apiClient.post<FavoriteMantraResponse>(
    `/mantras/favorite/${mantraId}/${trueOrFalse}`
  );
  return response.data;
};

// DELETE /mantras/:id
export const deleteMantra = async (id: number): Promise<DeleteMantraResponse> => {
  const response = await apiClient.delete<DeleteMantraResponse>(`/mantras/${id}`);
  return response.data;
};
