import React, { useState } from 'react';

interface SimpleConditionBuilderProps {
  questionId: string;
  visibleIf: Record<string, any>;
  onUpdate: (questionId: string, visibleIf: Record<string, any>) => void;
  onCancel: () => void;
  availableQuestions: { id: string; text: string }[];
}

export const SimpleConditionBuilder: React.FC<SimpleConditionBuilderProps> = ({
  questionId,
  visibleIf,
  onUpdate,
  onCancel,
  availableQuestions,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>(
    visibleIf.conditions?.[0]?.question_id || ''
  );
  const [selectedOperator, setSelectedOperator] = useState<string>(
    visibleIf.conditions?.[0]?.operator || 'equals'
  );
  const [selectedValue, setSelectedValue] = useState<string>(
    visibleIf.conditions?.[0]?.value || ''
  );

  const operators = [
    { value: 'equals', label: 'equals', icon: '=' },
    { value: 'not_equals', label: 'does not equal', icon: '≠' },
    { value: 'contains', label: 'contains', icon: '⊃' },
    { value: 'not_contains', label: 'does not contain', icon: '⊅' },
  ];

  const handleSave = () => {
    if (selectedQuestion && selectedValue) {
      const newVisibleIf = {
        logic_operator: 'AND',
        conditions: [{
          question_id: selectedQuestion,
          operator: selectedOperator,
          value: selectedValue,
        }],
      };
      onUpdate(questionId, newVisibleIf);
    }
  };

  const handleClear = () => {
    onUpdate(questionId, {});
  };

  const getSelectedQuestionText = () => {
    return availableQuestions.find(q => q.id === selectedQuestion)?.text || 'Select a question';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Simple Condition Builder</h3>
          <p className="text-sm text-gray-600">
            Show this question when another question meets a condition
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Question Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show this question when:
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a question...</option>
              {availableQuestions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.text}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {operators.map((operator) => (
                <button
                  key={operator.value}
                  onClick={() => setSelectedOperator(operator.value)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedOperator === operator.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">{operator.icon}</div>
                  <div className="text-xs">{operator.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value:
            </label>
            <input
              type="text"
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              placeholder="Enter the expected answer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Preview */}
          {selectedQuestion && selectedValue && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview:</h4>
              <p className="text-sm text-blue-800">
                Show this question when <strong>{getSelectedQuestionText()}</strong>{' '}
                <strong>{operators.find(op => op.value === selectedOperator)?.label}</strong>{' '}
                <strong>"{selectedValue}"</strong>
              </p>
            </div>
          )}

          {/* Current Condition Display */}
          {visibleIf.conditions && visibleIf.conditions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Current Condition:</h4>
              <p className="text-sm text-gray-700">
                {visibleIf.conditions.map((condition: any, index: number) => (
                  <span key={index}>
                    {availableQuestions.find(q => q.id === condition.question_id)?.text} {condition.operator} "{condition.value}"
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              Clear Condition
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!selectedQuestion || !selectedValue}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Condition
          </button>
        </div>
      </div>
    </div>
  );
}; 