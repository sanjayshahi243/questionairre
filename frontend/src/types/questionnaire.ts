export interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'checklist' | 'radio' | 'select';
  is_active: boolean;
  options?: string[];
  visible_if?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  description: string;
  version: number;
  is_active: boolean;
  question_set_questions: QuestionSetQuestion[];
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionSetQuestion {
  id: string;
  question_set: string;
  question: Question;
  question_id: string;
  order: number;
  is_required: boolean;
  overrides?: Record<string, any>;
  effective_text: string;
  effective_options?: string[];
  effective_visible_if?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionSetRequest {
  name: string;
  description: string;
  version: number;
  is_active?: boolean;
}

export interface CreateQuestionSetQuestionRequest {
  question_set: string;
  question_id: string;
  order: number;
  is_required: boolean;
  overrides?: Record<string, any>;
}

export interface SelectedQuestion {
  question: Question;
  order: number;
  is_required: boolean;
}

export interface Dependency {
  id: string;
  question: string;
  dependent_question: string;
  operator: string;
  value: string;
  created_at: string;
  updated_at: string;
} 