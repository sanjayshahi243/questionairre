import React, { useState } from 'react';
import { Question } from '../../types/questionnaire';

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onToggleActive: (questionId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'text' | 'type' | 'created_at'>('text');

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

  const filteredQuestions = questions
    .filter(question => {
      const matchesType = filterType === 'all' || question.type === filterType;
      const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'text':
          return a.text.localeCompare(b.text);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="textarea">Text Area</option>
              <option value="number">Number</option>
              <option value="boolean">Yes/No</option>
              <option value="checklist">Checklist</option>
              <option value="radio">Radio</option>
              <option value="select">Select</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="text">Sort by Text</option>
              <option value="type">Sort by Type</option>
              <option value="created_at">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="divide-y divide-gray-200">
        {filteredQuestions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm || filterType !== 'all' ? 'No questions match your filters' : 'No questions found'}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div key={question.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                      {getQuestionTypeLabel(question.type)}
                    </span>
                    {!question.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {question.options && question.options.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {question.options.length} options
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {question.text}
                  </h3>
                  
                  {question.options && question.options.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Options:</p>
                      <div className="flex flex-wrap gap-1">
                        {question.options.map((option, index) => (
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
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(question.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onToggleActive(question.id, !question.is_active)}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      question.is_active
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {question.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => onEdit(question)}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => onDelete(question.id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>
      </div>
    </div>
  );
}; 