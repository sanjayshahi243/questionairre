import React, { useState, useEffect } from 'react';
import { Question } from '../../types/questionnaire';

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: Partial<Question>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Question>>({
    text: '',
    type: 'text',
    is_active: true,
    options: [],
    visible_if: {},
  });

  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        type: question.type,
        is_active: question.is_active,
        options: question.options || [],
        visible_if: question.visible_if || {},
      });
    }
  }, [question]);

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'select', label: 'Dropdown' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text?.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (['checklist', 'radio', 'select'].includes(formData.type || '') && (!formData.options || formData.options.length === 0)) {
      newErrors.options = 'At least one option is required for this question type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addOption = () => {
    if (newOption.trim() && formData.options) {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  const needsOptions = ['checklist', 'radio', 'select'].includes(formData.type || '');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {question ? 'Edit Question' : 'Create New Question'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <textarea
            id="text"
            value={formData.text}
            onChange={(e) => handleInputChange('text', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.text ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your question text"
            disabled={isLoading}
          />
          {errors.text && (
            <p className="mt-1 text-sm text-red-600">{errors.text}</p>
          )}
        </div>

        {/* Question Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Question Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Options for multiple choice questions */}
        {needsOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options *
            </label>
            <div className="space-y-2">
              {formData.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(formData.options || [])];
                      newOptions[index] = e.target.value;
                      setFormData(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${index + 1}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add new option"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || !newOption.trim()}
                >
                  Add
                </button>
              </div>
            </div>
            {errors.options && (
              <p className="mt-1 text-sm text-red-600">{errors.options}</p>
            )}
          </div>
        )}

        {/* Active Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-900">Active (available for use)</span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {question ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              question ? 'Update Question' : 'Create Question'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 