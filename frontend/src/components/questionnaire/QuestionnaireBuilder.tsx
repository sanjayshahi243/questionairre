import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MongoForm, MongoQuestion } from '../../types/questionnaire';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { QuestionsTab } from './tabs/QuestionsTab';
import { LogicTab } from './tabs/LogicTab';
import { PreviewTab } from './tabs/PreviewTab';
import { SettingsTab } from './tabs/SettingsTab';

type TabType = 'questions' | 'logic' | 'preview' | 'settings';

export const QuestionnaireBuilder: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [form, setForm] = useState<MongoForm | null>(null);
  const [questions, setQuestions] = useState<MongoQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isNewForm = !formId || formId === 'new';

  useEffect(() => {
    if (isNewForm) {
      // Initialize new form
      setForm({
        _id: '',
        title: 'Untitled Form',
        description: '',
        questions: [],
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    } else {
      // Load existing form
      fetchForm();
    }
    fetchQuestions();
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

  const fetchQuestions = async () => {
    try {
      const fetchedQuestions = await apiService.getMongoQuestions();
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const handleSave = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setError(null);

      if (isNewForm) {
        const newForm = await apiService.createMongoForm(form);
        setForm(newForm);
        navigate(`/builder/${newForm._id}`);
        setSuccess('Form created successfully!');
      } else {
        const updatedForm = await apiService.updateMongoForm(form._id, form);
        setForm(updatedForm);
        setSuccess('Form updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!form || isNewForm) return;

    try {
      setSaving(true);
      setError(null);
      const duplicatedForm = await apiService.duplicateMongoForm(form._id);
      navigate(`/builder/${duplicatedForm._id}`);
      setSuccess('Form duplicated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate form');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form || isNewForm) return;

    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await apiService.deleteMongoForm(form._id);
      navigate('/mongo-forms');
      setSuccess('Form deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete form');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (updates: Partial<MongoForm>) => {
    if (form) {
      setForm({ ...form, ...updates });
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading form..." />;
  }

  if (!form) {
    return <ErrorMessage message="Form not found" />;
  }

  const tabs = [
    { id: 'questions' as TabType, label: 'Questions', icon: '📝' },
    { id: 'logic' as TabType, label: 'Logic', icon: '🔗' },
    { id: 'preview' as TabType, label: 'Preview', icon: '👁️' },
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/mongo-forms')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isNewForm ? 'Create New Form' : form.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {isNewForm ? 'Build your questionnaire' : 'Edit your questionnaire'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDuplicate}
                disabled={saving || isNewForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Duplicate
              </button>
              <button
                onClick={handleDelete}
                disabled={saving || isNewForm}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {success && <SuccessMessage message={success} onClose={clearMessages} />}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'questions' && (
          <QuestionsTab
            form={form}
            questions={questions}
            onUpdateForm={updateForm}
            onRefreshQuestions={fetchQuestions}
          />
        )}
        {activeTab === 'logic' && (
          <LogicTab
            form={form}
            onUpdateForm={updateForm}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewTab form={form} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            form={form}
            onUpdateForm={updateForm}
          />
        )}
      </div>
    </div>
  );
}; 