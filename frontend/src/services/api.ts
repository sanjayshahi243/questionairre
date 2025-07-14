import { 
  Question, 
  MongoForm,
  ResolvedMongoForm,
  MongoFormSubmission,
  MongoQuestion
} from '../types/questionnaire';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
  }
  return response.json();
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Create headers with authentication
function createAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
}

export const apiService = {
  // Questions
  async getQuestions(): Promise<Question[]> {
    const response = await fetch(`${API_BASE_URL}/questions/`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<Question[]>(response);
  },

  async createQuestion(data: Partial<Question>): Promise<Question> {
    const response = await fetch(`${API_BASE_URL}/questions/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    const response = await fetch(`${API_BASE_URL}/questions/${id}/`, {
      method: 'PATCH',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Question>(response);
  },

  async deleteQuestion(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/${id}/`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete question');
  },

  // MongoDB Questions
  async getMongoQuestions(params?: { type?: string; search?: string }): Promise<MongoQuestion[]> {
    const url = new URL(`${API_BASE_URL}/mongo/questions/`);
    if (params?.type) url.searchParams.append('type', params.type);
    if (params?.search) url.searchParams.append('search', params.search);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<MongoQuestion[]>(response);
  },

  async createMongoQuestion(data: Partial<MongoQuestion>): Promise<MongoQuestion> {
    const response = await fetch(`${API_BASE_URL}/mongo/questions/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MongoQuestion>(response);
  },

  async updateMongoQuestion(id: string, data: Partial<MongoQuestion>): Promise<MongoQuestion> {
    const response = await fetch(`${API_BASE_URL}/mongo/questions/${id}/`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MongoQuestion>(response);
  },

  async deleteMongoQuestion(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/mongo/questions/${id}/`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete question');
  },

  // MongoDB Forms
  async getMongoForms(params?: { is_active?: boolean; search?: string }): Promise<MongoForm[]> {
    const url = new URL(`${API_BASE_URL}/mongo/forms/`);
    if (params?.is_active !== undefined) url.searchParams.append('is_active', params.is_active.toString());
    if (params?.search) url.searchParams.append('search', params.search);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<MongoForm[]>(response);
  },

  async createMongoForm(data: Partial<MongoForm>): Promise<MongoForm> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MongoForm>(response);
  },

  async updateMongoForm(formId: string, data: Partial<MongoForm>): Promise<MongoForm> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/${formId}/`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MongoForm>(response);
  },

  async deleteMongoForm(formId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/${formId}/`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete form');
  },

  async duplicateMongoForm(formId: string): Promise<MongoForm> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/${formId}/duplicate/`, {
      method: 'POST',
      headers: createAuthHeaders(),
    });
    return handleResponse<MongoForm>(response);
  },

  async getMongoForm(formId: string): Promise<ResolvedMongoForm> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/${formId}/`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<ResolvedMongoForm>(response);
  },

  async submitMongoFormAnswers(formId: string, submission: MongoFormSubmission): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/mongo/forms/${formId}/submit/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(submission),
    });
    return handleResponse<any>(response);
  },
}; 