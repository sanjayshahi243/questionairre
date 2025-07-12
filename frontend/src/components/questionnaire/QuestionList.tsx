import React from 'react';
import { Question } from '../../types/questionnaire';

interface QuestionListProps {
  questions: Question[];
  selectedQuestionIds: string[];
  onQuestionSelect: (question: Question) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  selectedQuestionIds,
  onQuestionSelect,
}) => {
  const getQuestionTypeColor = (type: Question['type']) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      textarea: 'bg-green-100 text-green-800',
      number: 'bg-purple-100 text-purple-800',
      boolean: 'bg-yellow-100 text-yellow-800',
      checklist: 'bg-red-100 text-red-800',
      radio: 'bg-indigo-100 text-indigo-800',
      select: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getQuestionTypeLabel = (type: Question['type']) => {
    const labels = {
      text: 'Text',
      textarea: 'Text Area',
      number: 'Number',
      boolean: 'Yes/No',
      checklist: 'Checklist',
      radio: 'Radio',
      select: 'Select',
    };
    return labels[type] || type;
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No questions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => {
        const isSelected = selectedQuestionIds.includes(question.id);
        
        return (
          <div
            key={question.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onClick={() => !isSelected && onQuestionSelect(question)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isSelected ? 'text-green-800' : 'text-gray-900'
                }`}>
                  {question.text}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                    {getQuestionTypeLabel(question.type)}
                  </span>
                  {question.options && (
                    <span className="text-xs text-gray-500">
                      {question.options.length} options
                    </span>
                  )}
                </div>
              </div>
              {isSelected && (
                <div className="ml-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 