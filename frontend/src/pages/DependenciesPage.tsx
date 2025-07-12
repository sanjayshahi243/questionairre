import React, { useState, useEffect } from 'react';
import { DependencyBuilder } from '../components/dependencies/DependencyBuilder';
import { Question, Dependency } from '../types/questionnaire';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SuccessMessage } from '../components/common/SuccessMessage';

export const DependenciesPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [questionsData, dependenciesData] = await Promise.all([
        apiService.getQuestions(),
        apiService.getDependencies(),
      ]);
      setQuestions(questionsData);
      setDependencies(dependenciesData);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDependency = async (dependencyData: Partial<Dependency>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (dependencyData.id) {
        // Update existing dependency
        const updatedDependency = await apiService.updateDependency(dependencyData.id, dependencyData);
        setDependencies(prev => prev.map(d => d.id === dependencyData.id ? updatedDependency : d));
        setSuccess('Dependency updated successfully');
      } else {
        // Create new dependency
        const newDependency = await apiService.createDependency(dependencyData);
        setDependencies(prev => [newDependency, ...prev]);
        setSuccess('Dependency created successfully');
      }
    } catch (err) {
      setError('Failed to save dependency');
      console.error('Error saving dependency:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!window.confirm('Are you sure you want to delete this dependency?')) {
      return;
    }

    try {
      setError(null);
      await apiService.deleteDependency(dependencyId);
      setDependencies(prev => prev.filter(d => d.id !== dependencyId));
      setSuccess('Dependency deleted successfully');
    } catch (err) {
      setError('Failed to delete dependency');
      console.error('Error deleting dependency:', err);
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
        <h1 className="text-2xl font-bold text-gray-900">Dependencies Management</h1>
        <p className="mt-2 text-gray-600">
          Create and manage conditional logic between questions
        </p>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {success && <SuccessMessage message={success} onClose={clearMessages} />}

      {/* Dependency Builder */}
      <DependencyBuilder
        questions={questions}
        dependencies={dependencies}
        onSaveDependency={handleSaveDependency}
        onDeleteDependency={handleDeleteDependency}
        isLoading={isSubmitting}
      />
    </div>
  );
}; 