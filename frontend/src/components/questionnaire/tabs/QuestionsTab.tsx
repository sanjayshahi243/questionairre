import React, { useState } from 'react';
import { MongoForm, MongoQuestion } from '../../../types/questionnaire';
import { apiService } from '../../../services/api';
import { ErrorMessage } from '../../common/ErrorMessage';
import { SuccessMessage } from '../../common/SuccessMessage';

interface QuestionsTabProps {
  form: MongoForm;
  questions: MongoQuestion[];
  onUpdateForm: (updates: Partial<MongoForm>) => void;
  onRefreshQuestions: () => void;
}

export const QuestionsTab: React.FC<QuestionsTabProps> = ({
  form,
  questions,
  onUpdateForm,
  onRefreshQuestions,
}) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MongoQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: MongoQuestion) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async (questionData: Partial<MongoQuestion>) => {
    try {
      setError(null);
      if (editingQuestion) {
        await apiService.updateMongoQuestion(editingQuestion._id, questionData);
        setSuccess('Question updated successfully!');
      } else {
        await apiService.createMongoQuestion(questionData);
        setSuccess('Question created successfully!');
      }
      setShowQuestionForm(false);
      onRefreshQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  const handleAddToForm = (question: MongoQuestion) => {
    const newOrder = form.questions.length + 1;
    const updatedQuestions = [
      ...form.questions,
      {
        question_id: question._id,
        order: newOrder,
        required: false,
      },
    ];
    onUpdateForm({ questions: updatedQuestions });
  };

  const handleRemoveFromForm = (questionId: string) => {
    const updatedQuestions = form.questions.filter(q => q.question_id !== questionId);
    // Reorder remaining questions
    const reorderedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      order: index + 1,
    }));
    onUpdateForm({ questions: reorderedQuestions });
  };

  const handleReorderQuestions = (fromIndex: number, toIndex: number) => {
    const updatedQuestions = [...form.questions];
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1);
    updatedQuestions.splice(toIndex, 0, movedQuestion);
    
    // Update order numbers
    const reorderedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      order: index + 1,
    }));
    onUpdateForm({ questions: reorderedQuestions });
  };

  const getQuestionById = (questionId: string) => {
    return questions.find(q => q._id === questionId);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          <p className="text-sm text-gray-600">
            Add and organize questions for your form
          </p>
        </div>
        <button
          onClick={handleAddQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Question
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {success && <SuccessMessage message={success} onClose={clearMessages} />}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h3>
              <QuestionForm
                question={editingQuestion}
                onSave={handleSaveQuestion}
                onCancel={() => setShowQuestionForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Questions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Form Questions ({form.questions.length})
          </h3>
        </div>
        
        {form.questions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No questions added yet. Add questions from the library below.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {form.questions.map((formQuestion, index) => {
              const question = getQuestionById(formQuestion.question_id);
              if (!question) return null;

              return (
                <div key={formQuestion.question_id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">#{formQuestion.order}</div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{question.text}</h4>
                        <p className="text-xs text-gray-500">
                          Type: {question.type} • Required: {formQuestion.required ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveFromForm(formQuestion.question_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Library */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Question Library ({questions.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {questions.map((question) => {
            const isInForm = form.questions.some(q => q.question_id === question._id);
            
            return (
              <div key={question._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{question.text}</h4>
                    <p className="text-xs text-gray-500">
                      Type: {question.type} • Required: {question.required ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    {isInForm ? (
                      <span className="text-green-600 text-sm">Added</span>
                    ) : (
                      <button
                        onClick={() => handleAddToForm(question)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Add to Form
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Simple Question Form Component
interface QuestionFormProps {
  question?: MongoQuestion | null;
  onSave: (data: Partial<MongoQuestion>) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    text: question?.text || '',
    type: question?.type || 'text',
    options: question?.options || [],
    required: question?.required || false,
    default_value: question?.default_value || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Question Text</label>
        <input
          type="text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Yes/No</option>
          <option value="select">Select</option>
          <option value="multiselect">Multi-select</option>
          <option value="date">Date</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.required}
            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Required</span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}; 