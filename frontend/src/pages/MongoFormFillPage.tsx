import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResolvedMongoForm, MongoFormAnswer } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SuccessMessage } from '../components/common/SuccessMessage';

export const MongoFormFillPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ResolvedMongoForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedForm = await apiService.getMongoForm(formId!);
      setForm(fetchedForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch form');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (form?.resolved_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    try {
      setSubmitting(true);
      setError(null);

      const submission = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          question_id: questionId,
          value,
        })),
      };

      await apiService.submitMongoFormAnswers(form._id, submission);
      setSuccess('Form submitted successfully!');
      
      // Redirect to forms list after a delay
      setTimeout(() => {
        navigate('/mongo-forms');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: any) => {
    const answer = answers[question._id] || '';

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your answer..."
          />
        );
      case 'textarea':
        return (
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Type your answer..."
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, parseFloat(e.target.value) || '')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a number..."
          />
        );
      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name={`question-${question._id}`}
                value="true"
                checked={answer === true}
                onChange={() => handleAnswerChange(question._id, true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`question-${question._id}`}
                value="false"
                checked={answer === false}
                onChange={() => handleAnswerChange(question._id, false)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );
      case 'select':
        return (
          <select
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'checklist':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(answer) && answer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer) ? answer : [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter(a => a !== option);
                    handleAnswerChange(question._id, newAnswers);
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your answer..."
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form not found</h2>
          <p className="text-gray-600">The requested form could not be found.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = form.resolved_questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{form.name}</h1>
          <p className="mt-2 text-gray-600">{form.description}</p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {form.resolved_questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / form.resolved_questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / form.resolved_questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.text}
          </h3>
          {currentQuestion.required && (
            <p className="text-red-600 text-sm mb-4">* Required</p>
          )}
          {renderQuestionInput(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex space-x-2">
            {currentQuestionIndex < form.resolved_questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 