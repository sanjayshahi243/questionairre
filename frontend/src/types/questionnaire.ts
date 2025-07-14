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

// MongoDB Types
export interface MongoQuestion {
  _id: string;
  text: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  options?: string[];
  required: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MongoForm {
  _id: string;
  title: string;
  description?: string;
  questions: MongoFormQuestionRef[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MongoFormQuestionRef {
  question_id: string;
  order: number;
  required: boolean;
  visible_if?: Record<string, any>;
}

export interface ResolvedMongoForm extends MongoForm {
  resolved_questions: (MongoQuestion & {
    order: number;
    required: boolean;
    visible_if?: Record<string, any>;
  })[];
}

export interface MongoFormSubmission {
  answers: {
    question_id: string;
    value: any;
  }[];
}

export interface MongoFormAnswer {
  id: string;
  form_id: string;
  question_id: string;
  user: string;
  value: any;
  created_at: string;
  updated_at: string;
}

// API Request Types
export interface CreateQuestionRequest {
  text: string;
  type: Question['type'];
  options?: string[];
  visible_if?: Record<string, any>;
}

export interface UpdateQuestionRequest {
  text?: string;
  type?: Question['type'];
  options?: string[];
  visible_if?: Record<string, any>;
  is_active?: boolean;
}

// MongoDB API Request Types
export interface CreateMongoQuestionRequest {
  text: string;
  type: MongoQuestion['type'];
  options?: string[];
  required?: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
}

export interface UpdateMongoQuestionRequest {
  text?: string;
  type?: MongoQuestion['type'];
  options?: string[];
  required?: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
}

export interface CreateMongoFormRequest {
  title: string;
  description?: string;
  questions?: MongoFormQuestionRef[];
  is_active?: boolean;
}

export interface UpdateMongoFormRequest {
  title?: string;
  description?: string;
  questions?: MongoFormQuestionRef[];
  is_active?: boolean;
} 