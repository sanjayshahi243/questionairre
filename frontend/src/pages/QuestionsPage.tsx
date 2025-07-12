import React, { useState, useEffect } from 'react';
import { QuestionForm } from '../components/questions/QuestionForm';
import { QuestionList } from '../components/questions/QuestionList';
import { Question } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SuccessMessage } from '../components/common/SuccessMessage';

export const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getQuestions();
      setQuestions(data);
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error fetching questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (questionData: Partial<Question>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const newQuestion = await apiService.createQuestion(questionData);
      setQuestions(prev => [newQuestion, ...prev]);
      setSuccess('Question created successfully');
      setShowForm(false);
    } catch (err) {
      setError('Failed to create question');
      console.error('Error creating question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestion = async (questionData: Partial<Question>) => {
    if (!editingQuestion) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const updatedQuestion = await apiService.updateQuestion(editingQuestion.id, questionData);
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion : q));
      setSuccess('Question updated successfully');
      setEditingQuestion(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update question');
      console.error('Error updating question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setError(null);
      await apiService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setSuccess('Question deleted successfully');
    } catch (err) {
      setError('Failed to delete question');
      console.error('Error deleting question:', err);
    }
  };

  const handleToggleActive = async (questionId: string, isActive: boolean) => {
    try {
      setError(null);
      const updatedQuestion = await apiService.updateQuestion(questionId, { is_active: isActive });
      setQuestions(prev => prev.map(q => q.id === questionId ? updatedQuestion : q));
      setSuccess(`Question ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError('Failed to update question status');
      console.error('Error updating question status:', err);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage your questions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Question
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {success && <SuccessMessage message={success} onClose={clearMessages} />}

      {/* Question Form */}
      {showForm && (
        <QuestionForm
          question={editingQuestion || undefined}
          onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
        />
      )}

      {/* Questions List */}
      <QuestionList
        questions={questions}
        onEdit={handleEdit}
        onDelete={handleDeleteQuestion}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />
    </div>
  );
}; 