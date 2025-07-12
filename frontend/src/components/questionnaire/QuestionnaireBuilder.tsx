import React, { useState, useEffect } from 'react';
import { Question, SelectedQuestion, CreateQuestionSetRequest, CreateQuestionSetQuestionRequest } from '../../types/questionnaire';
import { questionnaireApi } from '../../services/api';
import { QuestionList } from './QuestionList';
import { QuestionSetForm } from './QuestionSetForm';
import { SelectedQuestionsList } from './SelectedQuestionsList';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';

export const QuestionnaireBuilder: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedQuestions = await questionnaireApi.getQuestions();
      setQuestions(fetchedQuestions.filter(q => q.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (question: Question) => {
    const isAlreadySelected = selectedQuestions.some(sq => sq.question.id === question.id);
    if (isAlreadySelected) {
      setError('This question is already selected');
      return;
    }

    const newSelectedQuestion: SelectedQuestion = {
      question,
      order: selectedQuestions.length + 1,
      is_required: false,
    };

    setSelectedQuestions([...selectedQuestions, newSelectedQuestion]);
    setError(null);
  };

  const handleQuestionRemove = (questionId: string) => {
    const updatedQuestions = selectedQuestions
      .filter(sq => sq.question.id !== questionId)
      .map((sq, index) => ({ ...sq, order: index + 1 }));
    
    setSelectedQuestions(updatedQuestions);
  };

  const handleQuestionUpdate = (questionId: string, updates: Partial<SelectedQuestion>) => {
    setSelectedQuestions(prev => 
      prev.map(sq => 
        sq.question.id === questionId 
          ? { ...sq, ...updates }
          : sq
      )
    );
  };

  const handleOrderChange = (questionId: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > selectedQuestions.length) return;

    const updatedQuestions = [...selectedQuestions];
    const currentIndex = updatedQuestions.findIndex(sq => sq.question.id === questionId);
    const currentQuestion = updatedQuestions[currentIndex];

    // Remove the question from its current position
    updatedQuestions.splice(currentIndex, 1);

    // Insert it at the new position
    updatedQuestions.splice(newOrder - 1, 0, currentQuestion);

    // Update all order numbers
    const reorderedQuestions = updatedQuestions.map((sq, index) => ({
      ...sq,
      order: index + 1,
    }));

    setSelectedQuestions(reorderedQuestions);
  };

  const handleSubmit = async (formData: CreateQuestionSetRequest) => {
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Create the question set
      const questionSet = await questionnaireApi.createQuestionSet(formData);

      // Prepare questions for the set
      const questionSetQuestions: CreateQuestionSetQuestionRequest[] = selectedQuestions.map(sq => ({
        question_set: questionSet.id,
        question_id: sq.question.id,
        order: sq.order,
        is_required: sq.is_required,
      }));

      // Add questions to the set
      await questionnaireApi.bulkAddQuestionsToSet(questionSet.id, questionSetQuestions);

      setSuccess(`Questionnaire "${formData.name}" created successfully!`);
      setSelectedQuestions([]);
      
      // Reset form by triggering a re-render
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Questionnaire Builder</h1>
          <p className="mt-2 text-gray-600">
            Create a new questionnaire by selecting questions from the available pool
          </p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Questions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Questions ({questions.length})
              </h2>
              <QuestionList
                questions={questions}
                selectedQuestionIds={selectedQuestions.map(sq => sq.question.id)}
                onQuestionSelect={handleQuestionSelect}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Set Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Questionnaire Details
              </h2>
              <QuestionSetForm
                onSubmit={handleSubmit}
                submitting={submitting}
                disabled={selectedQuestions.length === 0}
              />
            </div>

            {/* Selected Questions */}
            {selectedQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Selected Questions ({selectedQuestions.length})
                </h2>
                <SelectedQuestionsList
                  selectedQuestions={selectedQuestions}
                  onQuestionRemove={handleQuestionRemove}
                  onQuestionUpdate={handleQuestionUpdate}
                  onOrderChange={handleOrderChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 