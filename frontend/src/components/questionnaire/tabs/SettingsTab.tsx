import React from 'react';
import { MongoForm } from '../../../types/questionnaire';

interface SettingsTabProps {
  form: MongoForm;
  onUpdateForm: (updates: Partial<MongoForm>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ form, onUpdateForm }) => {
  const handleInputChange = (field: keyof MongoForm, value: any) => {
    onUpdateForm({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Form Settings</h2>
        <p className="text-sm text-gray-600">
          Configure your form's basic settings and appearance
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Form Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Form Title *
            </label>
            <input
              type="text"
              id="title"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter form title"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This is the main title that respondents will see
            </p>
          </div>

          {/* Form Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter form description (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide additional context or instructions for respondents
            </p>
          </div>

          {/* Active Status */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Form Status</h4>
                <p className="text-sm text-gray-500">
                  {form.is_active 
                    ? 'This form is active and can receive responses' 
                    : 'This form is inactive and cannot receive responses'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Form Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Form Statistics</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{form.questions.length}</div>
              <div className="text-sm text-gray-500">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {form.questions.filter(q => q.required).length}
              </div>
              <div className="text-sm text-gray-500">Required Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {form.questions.filter(q => q.visible_if).length}
              </div>
              <div className="text-sm text-gray-500">Conditional Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Metadata */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Form Metadata</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Form ID</span>
            <span className="text-sm font-mono text-gray-900">{form._id || 'Not saved yet'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Created</span>
            <span className="text-sm text-gray-900">
              {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Not saved yet'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Last Updated</span>
            <span className="text-sm text-gray-900">
              {form.updated_at ? new Date(form.updated_at).toLocaleDateString() : 'Not saved yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border border-red-200">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Form</h4>
              <p className="text-sm text-red-600">
                Permanently delete this form and all its data. This action cannot be undone.
              </p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 