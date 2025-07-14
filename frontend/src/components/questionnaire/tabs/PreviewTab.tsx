import React, { useState } from 'react';
import { MongoForm } from '../../../types/questionnaire';

interface PreviewTabProps {
  form: MongoForm;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ form }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < form.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const renderQuestionInput = (questionRef: any) => {
    const answer = answers[questionRef.question_id] || '';

    // This is a simplified preview - in a real implementation,
    // you'd need to fetch the actual question details
    const questionType = 'text'; // This would come from the actual question

    switch (questionType) {
      case 'text':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(questionRef.question_id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your answer..."
          />
        );
      case 'textarea':
        return (
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(questionRef.question_id, e.target.value)}
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
            onChange={(e) => handleAnswerChange(questionRef.question_id, parseFloat(e.target.value) || '')}
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
                name={`question-${questionRef.question_id}`}
                value="true"
                checked={answer === true}
                onChange={() => handleAnswerChange(questionRef.question_id, true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`question-${questionRef.question_id}`}
                value="false"
                checked={answer === false}
                onChange={() => handleAnswerChange(questionRef.question_id, false)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(questionRef.question_id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your answer..."
          />
        );
    }
  };

  if (form.questions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
          <p className="text-sm text-gray-600">
            Preview how your form will look to respondents
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>No questions added yet. Add questions in the Questions tab to see a preview.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = form.questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
        <p className="text-sm text-gray-600">
          Preview how your form will look to respondents
        </p>
      </div>

      {/* Form Preview */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {form.questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / form.questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / form.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Question #{currentQuestion.order}
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
              {currentQuestionIndex < form.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Controls</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentQuestionIndex(0)}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            First Question
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(form.questions.length - 1)}
            disabled={currentQuestionIndex === form.questions.length - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Last Question
          </button>
          <button
            onClick={() => setAnswers({})}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Answers
          </button>
        </div>
      </div>
    </div>
  );
}; 