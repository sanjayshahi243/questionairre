import { 
  Question, 
  QuestionSet, 
  CreateQuestionSetRequest, 
  CreateQuestionSetQuestionRequest,
  Dependency
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

  // Question Sets
  async getQuestionSets(): Promise<QuestionSet[]> {
    const response = await fetch(`${API_BASE_URL}/question-sets/`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<QuestionSet[]>(response);
  },

  async createQuestionSet(data: CreateQuestionSetRequest): Promise<QuestionSet> {
    const response = await fetch(`${API_BASE_URL}/question-sets/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<QuestionSet>(response);
  },

  async addQuestionToSet(data: CreateQuestionSetQuestionRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/question-set-questions/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  async bulkAddQuestionsToSet(questionSetId: string, questions: CreateQuestionSetQuestionRequest[]): Promise<any[]> {
    const promises = questions.map(question => 
      this.addQuestionToSet({
        ...question,
        question_set: questionSetId,
      })
    );
    return Promise.all(promises);
  },

  // Dependencies
  async getDependencies(): Promise<Dependency[]> {
    const response = await fetch(`${API_BASE_URL}/dependencies/`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<Dependency[]>(response);
  },

  async createDependency(data: Partial<Dependency>): Promise<Dependency> {
    const response = await fetch(`${API_BASE_URL}/dependencies/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Dependency>(response);
  },

  async updateDependency(id: string, data: Partial<Dependency>): Promise<Dependency> {
    const response = await fetch(`${API_BASE_URL}/dependencies/${id}/`, {
      method: 'PATCH',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Dependency>(response);
  },

  async deleteDependency(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dependencies/${id}/`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete dependency');
  },
}; 