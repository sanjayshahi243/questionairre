import { 
  Question, 
  QuestionSet, 
  CreateQuestionSetRequest, 
  CreateQuestionSetQuestionRequest 
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

export const questionnaireApi = {
  // Fetch all available questions
  async getQuestions(): Promise<Question[]> {
    const response = await fetch(`${API_BASE_URL}/questions/`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse<Question[]>(response);
  },

  // Create a new question set
  async createQuestionSet(data: CreateQuestionSetRequest): Promise<QuestionSet> {
    const response = await fetch(`${API_BASE_URL}/question-sets/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<QuestionSet>(response);
  },

  // Add a question to a question set
  async addQuestionToSet(data: CreateQuestionSetQuestionRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/question-set-questions/`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  // Bulk add questions to a question set
  async bulkAddQuestionsToSet(questionSetId: string, questions: CreateQuestionSetQuestionRequest[]): Promise<any[]> {
    const promises = questions.map(question => 
      this.addQuestionToSet({
        ...question,
        question_set: questionSetId,
      })
    );
    return Promise.all(promises);
  },
}; 