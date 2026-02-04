import apiClient from './client';
import { Meditation } from '@/store/features/meditationSlice';

export interface AdminUser {
  id: number;
  username?: string | null;
  email: string;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersResponse {
  users: AdminUser[];
}

export interface DeleteUserResponse {
  message: string;
  userId: number;
}

export interface GetAllMantrasResponse {
  mantras: Meditation[];
}

export interface DeleteMantraResponse {
  message: string;
  mantraId: number;
}

export interface QueueRecord {
  id: number;
  userId: number;
  status: 'queued' | 'started' | 'elevenlabs' | 'concatenator' | 'done';
  jobFilename: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetQueuerResponse {
  queue: QueueRecord[];
}

export interface DeleteQueueRecordResponse {
  message: string;
  queueId: number;
}

// GET /admin/users
export const getUsers = async (): Promise<GetUsersResponse> => {
  const response = await apiClient.get<GetUsersResponse>('/admin/users');
  return response.data;
};

// DELETE /admin/users/:id
export const deleteUser = async (id: number): Promise<DeleteUserResponse> => {
  const response = await apiClient.delete<DeleteUserResponse>(`/admin/users/${id}`);
  return response.data;
};

// GET /admin/mantras
export const getAllMantras = async (): Promise<GetAllMantrasResponse> => {
  const response = await apiClient.get<GetAllMantrasResponse>('/admin/mantras');
  return response.data;
};

// DELETE /admin/mantras/:mantraId
export const deleteMantra = async (mantraId: number): Promise<DeleteMantraResponse> => {
  const response = await apiClient.delete<DeleteMantraResponse>(`/admin/mantras/${mantraId}`);
  return response.data;
};

// GET /admin/queuer
export const getQueuerRecords = async (): Promise<GetQueuerResponse> => {
  const response = await apiClient.get<GetQueuerResponse>('/admin/queuer');
  return response.data;
};

// DELETE /admin/queuer/:id
export const deleteQueuerRecord = async (id: number): Promise<DeleteQueueRecordResponse> => {
  const response = await apiClient.delete<DeleteQueueRecordResponse>(`/admin/queuer/${id}`);
  return response.data;
};
