import React, { useState, useEffect } from 'react';
import { Question, Dependency } from '../../types/questionnaire';

interface DependencyBuilderProps {
  questions: Question[];
  dependencies: Dependency[];
  onSaveDependency: (dependency: Partial<Dependency>) => void;
  onDeleteDependency: (dependencyId: string) => void;
  isLoading?: boolean;
}

export const DependencyBuilder: React.FC<DependencyBuilderProps> = ({
  questions,
  dependencies,
  onSaveDependency,
  onDeleteDependency,
  isLoading = false,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState<string>('');
  const [operator, setOperator] = useState<string>('equals');
  const [value, setValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingDependency, setEditingDependency] = useState<Dependency | null>(null);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
  ];

  const getQuestionById = (id: string) => questions.find(q => q.id === id);
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

  const getOperatorLabel = (op: string) => {
    return operators.find(o => o.value === op)?.label || op;
  };

  const handleSave = () => {
    if (!selectedQuestion || !selectedDependentQuestion) {
      return;
    }

    const dependencyData: Partial<Dependency> = {
      question: selectedQuestion,
      dependent_question: selectedDependentQuestion,
      operator,
      value,
    };

    if (isEditing && editingDependency) {
      dependencyData.id = editingDependency.id;
    }

    onSaveDependency(dependencyData);
    resetForm();
  };

  const handleEdit = (dependency: Dependency) => {
    setEditingDependency(dependency);
    setSelectedQuestion(dependency.question);
    setSelectedDependentQuestion(dependency.dependent_question);
    setOperator(dependency.operator);
    setValue(dependency.value);
    setIsEditing(true);
  };

  const resetForm = () => {
    setSelectedQuestion('');
    setSelectedDependentQuestion('');
    setOperator('equals');
    setValue('');
    setIsEditing(false);
    setEditingDependency(null);
  };

  const getDependentQuestion = (dependency: Dependency) => {
    return getQuestionById(dependency.dependent_question);
  };

  const getConditionQuestion = (dependency: Dependency) => {
    return getQuestionById(dependency.question);
  };

  return (
    <div className="space-y-6">
      {/* Dependency Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Dependency' : 'Create New Dependency'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Condition Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              If this question:
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select a question</option>
              {questions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.text.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Dependent Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Then show this question:
            </label>
            <select
              value={selectedDependentQuestion}
              onChange={(e) => setSelectedDependentQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select a question</option>
              {questions
                .filter(q => q.id !== selectedQuestion)
                .map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.text.substring(0, 50)}...
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Condition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator:
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value:
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter condition value"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !selectedQuestion || !selectedDependentQuestion}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Dependency' : 'Create Dependency')}
          </button>
        </div>
      </div>

      {/* Dependencies List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Existing Dependencies ({dependencies.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {dependencies.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No dependencies configured
            </div>
          ) : (
            dependencies.map((dependency) => {
              const conditionQuestion = getConditionQuestion(dependency);
              const dependentQuestion = getDependentQuestion(dependency);

              return (
                <div key={dependency.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">If</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {conditionQuestion?.text.substring(0, 30)}...
                        </span>
                        <span className="text-sm text-gray-600">
                          {getOperatorLabel(dependency.operator)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          "{dependency.value}"
                        </span>
                        <span className="text-sm font-medium text-gray-900">then show</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          {dependentQuestion?.text.substring(0, 30)}...
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          Condition: {conditionQuestion?.text} ({getQuestionTypeLabel(conditionQuestion?.type || 'text')})
                        </div>
                        <div>
                          Dependent: {dependentQuestion?.text} ({getQuestionTypeLabel(dependentQuestion?.type || 'text')})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(dependency)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteDependency(dependency.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}; 