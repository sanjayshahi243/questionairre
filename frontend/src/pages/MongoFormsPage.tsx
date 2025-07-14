import React, { useState, useEffect } from 'react';
import { MongoForm } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Link } from 'react-router-dom';

export const MongoFormsPage: React.FC = () => {
  const [forms, setForms] = useState<MongoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedForms = await apiService.getMongoForms();
      setForms(fetchedForms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dynamic Forms</h1>
            <p className="mt-2 text-gray-600">
              Fill out dynamic forms built with MongoDB-backed question definitions
            </p>
          </div>
          <Link
            to="/builder"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Form
          </Link>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms available</h3>
            <p className="text-gray-600 mb-6">
              There are no dynamic forms available at the moment.
            </p>
            <Link
              to="/builder"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Form
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div key={form._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    <p className="text-sm text-gray-500">Version {form.questions.length} questions</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {form.questions.length} questions
                  </span>
                </div>
                
                {form.description && (
                  <p className="text-gray-600 text-sm mb-4">{form.description}</p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Created: {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/builder/${form._id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/mongo-forms/${form._id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Fill Form
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 