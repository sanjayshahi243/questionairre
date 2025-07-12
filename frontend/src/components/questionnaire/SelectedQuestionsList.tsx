import React from 'react';
import { SelectedQuestion } from '../../types/questionnaire';

interface SelectedQuestionsListProps {
  selectedQuestions: SelectedQuestion[];
  onQuestionRemove: (questionId: string) => void;
  onQuestionUpdate: (questionId: string, updates: Partial<SelectedQuestion>) => void;
  onOrderChange: (questionId: string, newOrder: number) => void;
}

export const SelectedQuestionsList: React.FC<SelectedQuestionsListProps> = ({
  selectedQuestions,
  onQuestionRemove,
  onQuestionUpdate,
  onOrderChange,
}) => {
  const getQuestionTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      textarea: 'bg-green-100 text-green-800',
      number: 'bg-purple-100 text-purple-800',
      boolean: 'bg-yellow-100 text-yellow-800',
      checklist: 'bg-red-100 text-red-800',
      radio: 'bg-indigo-100 text-indigo-800',
      select: 'bg-pink-100 text-pink-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      text: 'Text',
      textarea: 'Text Area',
      number: 'Number',
      boolean: 'Yes/No',
      checklist: 'Checklist',
      radio: 'Radio',
      select: 'Select',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No questions selected</p>
        <p className="text-sm text-gray-400 mt-1">
          Select questions from the left panel to build your questionnaire
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedQuestions.map((selectedQuestion) => (
        <div
          key={selectedQuestion.question.id}
          className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {selectedQuestion.order}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(selectedQuestion.question.type)}`}>
                  {getQuestionTypeLabel(selectedQuestion.question.type)}
                </span>
                {selectedQuestion.is_required && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Required
                  </span>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {selectedQuestion.question.text}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Order Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.order}
                    onChange={(e) => {
                      const newOrder = parseInt(e.target.value);
                      if (!isNaN(newOrder)) {
                        onOrderChange(selectedQuestion.question.id, newOrder);
                      }
                    }}
                    min="1"
                    max={selectedQuestions.length}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Required Toggle */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Required
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedQuestion.is_required}
                      onChange={(e) => onQuestionUpdate(selectedQuestion.question.id, { is_required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs text-gray-600">
                      {selectedQuestion.is_required ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Question Type Display */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <span className="text-xs text-gray-600">
                    {getQuestionTypeLabel(selectedQuestion.question.type)}
                  </span>
                </div>
              </div>

              {/* Options Display */}
              {selectedQuestion.question.options && selectedQuestion.question.options.length > 0 && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {selectedQuestion.question.options.map((option, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onQuestionRemove(selectedQuestion.question.id)}
              className="ml-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove question"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800 font-medium">
            Total Questions: {selectedQuestions.length}
          </span>
          <span className="text-blue-600">
            Required: {selectedQuestions.filter(q => q.is_required).length}
          </span>
        </div>
      </div>
    </div>
  );
}; 