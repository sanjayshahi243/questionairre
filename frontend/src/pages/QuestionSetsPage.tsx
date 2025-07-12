import React, { useState, useEffect } from 'react';
import { QuestionSet } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SuccessMessage } from '../components/common/SuccessMessage';

export const QuestionSetsPage: React.FC = () => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getQuestionSets();
      setQuestionSets(data);
    } catch (err) {
      setError('Failed to load question sets');
      console.error('Error fetching question sets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Question Sets</h1>
        <p className="mt-2 text-gray-600">
          View and manage your question sets
        </p>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {success && <SuccessMessage message={success} onClose={clearMessages} />}

      {/* Question Sets List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            All Question Sets ({questionSets.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {questionSets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No question sets found
            </div>
          ) : (
            questionSets.map((questionSet) => (
              <div key={questionSet.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {questionSet.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        v{questionSet.version}
                      </span>
                      {!questionSet.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {questionSet.description && (
                      <p className="text-gray-600 mb-3">
                        {questionSet.description}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>
                        Questions: {questionSet.question_count || 0}
                      </div>
                      <div>
                        Created: {new Date(questionSet.created_at).toLocaleDateString()}
                      </div>
                      {questionSet.updated_at && (
                        <div>
                          Updated: {new Date(questionSet.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      View Details
                    </button>
                    <button
                      className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 