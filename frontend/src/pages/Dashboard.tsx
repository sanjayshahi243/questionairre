import React, { useState, useEffect } from 'react';
import { Question, QuestionSet } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Dashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [questionsData, questionSetsData] = await Promise.all([
        apiService.getQuestions(),
        apiService.getQuestionSets(),
      ]);
      setQuestions(questionsData);
      setQuestionSets(questionSetsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }
  const activeQuestions = questions.filter(q => q.is_active);
  const activeQuestionSets = questionSets.filter(qs => qs.is_active);

  const questionTypeStats = questions.reduce((acc, question) => {
    acc[question.type] = (acc[question.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your questionnaire system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Questions</p>
              <p className="text-2xl font-semibold text-gray-900">{questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Questions</p>
              <p className="text-2xl font-semibold text-gray-900">{activeQuestions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Question Sets</p>
              <p className="text-2xl font-semibold text-gray-900">{questionSets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sets</p>
              <p className="text-2xl font-semibold text-gray-900">{activeQuestionSets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Type Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Type Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(questionTypeStats).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                {getQuestionTypeLabel(type)}
              </span>
              <span className="text-sm font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Questions</h3>
          <div className="space-y-3">
            {questions.slice(0, 5).map((question) => (
              <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {question.text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getQuestionTypeLabel(question.type)} • {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  question.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {question.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Question Sets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Question Sets</h3>
          <div className="space-y-3">
            {questionSets.slice(0, 5).map((questionSet) => (
              <div key={questionSet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {questionSet.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    v{questionSet.version} • {questionSet.question_count} questions • {new Date(questionSet.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  questionSet.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {questionSet.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 