import React, { useState, useRef, useEffect } from 'react';
import { MongoForm, MongoQuestion } from '../../../types/questionnaire';
import FlowDiagram from './FlowDiagram';
import { SimpleConditionBuilder } from './SimpleConditionBuilder';

interface LogicTabProps {
  form: MongoForm;
  onUpdateForm: (updates: Partial<MongoForm>) => void;
}

export const LogicTab: React.FC<LogicTabProps> = ({ form, onUpdateForm }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);
  const [useSimpleBuilder, setUseSimpleBuilder] = useState(true);
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleToggleRequired = (questionId: string) => {
    const updatedQuestions = form.questions.map(q => 
      q.question_id === questionId 
        ? { ...q, required: !q.required }
        : q
    );
    onUpdateForm({ questions: updatedQuestions });
  };

  const handleUpdateVisibleIf = (questionId: string, visibleIf: Record<string, any>) => {
    const updatedQuestions = form.questions.map(q => 
      q.question_id === questionId 
        ? { ...q, visible_if: visibleIf }
        : q
    );
    onUpdateForm({ questions: updatedQuestions });
  };

  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestion(questionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();
    if (draggedQuestion && draggedQuestion !== targetQuestionId) {
      // Create a condition where target question is shown if dragged question has a specific answer
      const condition = {
        question_id: draggedQuestion,
        operator: 'equals',
        value: 'yes' // Default value, will be customized
      };
      
      handleUpdateVisibleIf(targetQuestionId, { conditions: [condition] });
    }
    setDraggedQuestion(null);
  };

  const getQuestionById = (questionId: string) => {
    return form.questions.find(q => q.question_id === questionId);
  };

  const getQuestionText = (questionId: string) => {
    // In a real implementation, you'd fetch this from the questions list
    return `Question ${questionId.slice(-4)}`;
  };

  const getConditionalQuestions = () => {
    return form.questions.filter(q => q.visible_if && Object.keys(q.visible_if).length > 0);
  };

  const getIndependentQuestions = () => {
    return form.questions.filter(q => !q.visible_if || Object.keys(q.visible_if).length === 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Logic & Conditions</h2>
        <p className="text-sm text-gray-600">
          Create conditional logic to show questions based on previous answers
        </p>
      </div>

      {/* Visual Flow Diagram */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Visual Flow Diagram</h3>
          <p className="text-sm text-gray-500">
            Interactive diagram showing question flow and conditional logic
          </p>
        </div>
        
        <div className="p-6">
          <FlowDiagram
            form={form}
            onQuestionClick={(questionId) => {
              setSelectedQuestion(questionId);
              setShowConditionBuilder(true);
            }}
            selectedQuestionId={selectedQuestion}
          />
        </div>
      </div>

      {/* Visual Flow Builder */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Drag & Drop Logic Builder</h3>
          <p className="text-sm text-gray-500">
            Drag questions to create conditional relationships
          </p>
        </div>
        
        <div className="p-6">
          <div 
            ref={canvasRef}
            className="min-h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6"
            onDragOver={handleDragOver}
            onDrop={(e) => e.preventDefault()}
          >
            {/* Independent Questions (Always Shown) */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Always Shown Questions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getIndependentQuestions().map((questionRef) => (
                  <div
                    key={questionRef.question_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, questionRef.question_id)}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-move hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getQuestionText(questionRef.question_id)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={questionRef.required}
                            onChange={() => handleToggleRequired(questionRef.question_id)}
                            className="sr-only peer"
                          />
                          <div className="w-6 h-3 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-xs text-gray-500">Required</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Drag to create condition
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditional Questions */}
            {getConditionalQuestions().length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Conditional Questions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getConditionalQuestions().map((questionRef) => (
                    <div
                      key={questionRef.question_id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, questionRef.question_id)}
                      className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getQuestionText(questionRef.question_id)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={questionRef.required}
                              onChange={() => handleToggleRequired(questionRef.question_id)}
                              className="sr-only peer"
                            />
                            <div className="w-6 h-3 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs text-gray-500">Required</span>
                        </div>
                      </div>
                      
                      {/* Condition Display */}
                      {questionRef.visible_if && (
                        <div className="bg-white rounded border border-blue-200 p-2 mb-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">Shown when:</div>
                          <div className="text-xs text-gray-600">
                            {questionRef.visible_if.conditions?.map((condition: any, index: number) => (
                              <div key={index} className="flex items-center space-x-1">
                                <span>{getQuestionText(condition.question_id)}</span>
                                <span className="text-blue-500">{condition.operator}</span>
                                <span className="font-medium">"{condition.value}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-blue-600">
                        Drop here to add condition
                      </div>
                      
                      {/* Edit Condition Button */}
                      <button
                        onClick={() => {
                          setSelectedQuestion(questionRef.question_id);
                          setShowConditionBuilder(true);
                        }}
                        className="absolute top-2 right-2 p-1 text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Zone Instructions */}
            {form.questions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600">
                  Add questions in the Questions tab to start building logic
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Condition Builder Modal */}
      {showConditionBuilder && selectedQuestion && (
        <>
          {useSimpleBuilder ? (
            <SimpleConditionBuilder
              questionId={selectedQuestion}
              visibleIf={getQuestionById(selectedQuestion)?.visible_if || {}}
              onUpdate={(questionId, visibleIf) => {
                handleUpdateVisibleIf(questionId, visibleIf);
                setShowConditionBuilder(false);
                setSelectedQuestion(null);
              }}
              onCancel={() => {
                setShowConditionBuilder(false);
                setSelectedQuestion(null);
              }}
              availableQuestions={form.questions.map(q => ({ id: q.question_id, text: getQuestionText(q.question_id) }))}
            />
          ) : (
            <ConditionBuilderModal
              questionId={selectedQuestion}
              visibleIf={getQuestionById(selectedQuestion)?.visible_if || {}}
              onUpdate={(questionId, visibleIf) => {
                handleUpdateVisibleIf(questionId, visibleIf);
                setShowConditionBuilder(false);
                setSelectedQuestion(null);
              }}
              onCancel={() => {
                setShowConditionBuilder(false);
                setSelectedQuestion(null);
              }}
              availableQuestions={form.questions.map(q => ({ id: q.question_id, text: getQuestionText(q.question_id) }))}
            />
          )}
          
          {/* Builder Toggle */}
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-md p-2 border border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">Builder:</span>
                <button
                  onClick={() => setUseSimpleBuilder(true)}
                  className={`px-2 py-1 text-xs rounded ${
                    useSimpleBuilder
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setUseSimpleBuilder(false)}
                  className={`px-2 py-1 text-xs rounded ${
                    !useSimpleBuilder
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logic Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Logic Summary</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getIndependentQuestions().length}
              </div>
              <div className="text-sm text-gray-500">Always Shown</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getConditionalQuestions().length}
              </div>
              <div className="text-sm text-gray-500">Conditional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {form.questions.filter(q => q.required).length}
              </div>
              <div className="text-sm text-gray-500">Required</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced Condition Builder Modal
interface ConditionBuilderModalProps {
  questionId: string;
  visibleIf: Record<string, any>;
  onUpdate: (questionId: string, visibleIf: Record<string, any>) => void;
  onCancel: () => void;
  availableQuestions: { id: string; text: string }[];
}

const ConditionBuilderModal: React.FC<ConditionBuilderModalProps> = ({
  questionId,
  visibleIf,
  onUpdate,
  onCancel,
  availableQuestions,
}) => {
  const [conditions, setConditions] = useState<any[]>(
    visibleIf.conditions || []
  );
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    visibleIf.logic_operator || 'AND'
  );

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
  ];

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        question_id: '',
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleSave = () => {
    const newVisibleIf = {
      logic_operator: logicOperator,
      conditions: conditions.filter(c => c.question_id && c.value),
    };
    onUpdate(questionId, newVisibleIf);
  };

  const updateVisibleIf = (newConditions: any[]) => {
    setConditions(newConditions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Advanced Condition Builder</h3>
          <p className="text-sm text-gray-600">
            Create complex conditional logic for this question
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Logic Operator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logic Operator
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="AND"
                  checked={logicOperator === 'AND'}
                  onChange={(e) => setLogicOperator(e.target.value as 'AND' | 'OR')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">All conditions must be true (AND)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="OR"
                  checked={logicOperator === 'OR'}
                  onChange={(e) => setLogicOperator(e.target.value as 'AND' | 'OR')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Any condition can be true (OR)</span>
              </label>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Conditions
              </label>
              <button
                onClick={handleAddCondition}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Condition
              </button>
            </div>
            
            <div className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Condition {index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={condition.question_id}
                      onChange={(e) => handleUpdateCondition(index, 'question_id', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select question...</option>
                      {availableQuestions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.text}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={condition.operator}
                      onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      placeholder="Enter value..."
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {conditions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview:</h4>
              <p className="text-sm text-blue-800">
                Show this question when {logicOperator === 'AND' ? 'all' : 'any'} of the following are true:
              </p>
              <ul className="mt-2 space-y-1">
                {conditions.map((condition, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    • {availableQuestions.find(q => q.id === condition.question_id)?.text || 'Unknown question'} {condition.operator} "{condition.value}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Save Conditions
          </button>
        </div>
      </div>
    </div>
  );
}; 