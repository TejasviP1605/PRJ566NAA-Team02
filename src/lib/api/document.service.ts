import { apiRequest } from './client';
import type { Document, ApiResponse } from '@/types';

export const documentService = {
  async getDocuments(householdId: string): Promise<ApiResponse<Document[]>> {
    return apiRequest<Document[]>(`/households/${householdId}/documents`);
  },

  async uploadDocument(payload: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ApiResponse<Document>> {
    return apiRequest<Document>(`/households/${payload.householdId}/documents`, {
      method: 'POST',
      body: payload,
    });
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/documents/${documentId}`, { method: 'DELETE' });
  },
};
