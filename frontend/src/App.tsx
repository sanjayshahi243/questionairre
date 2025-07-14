import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Navigation } from './components/layout/Navigation';
import { Dashboard } from './pages/Dashboard';
import { QuestionsPage } from './pages/QuestionsPage';
import { MongoFormsPage } from './pages/MongoFormsPage';
import { MongoFormFillPage } from './pages/MongoFormFillPage';
import { QuestionnaireBuilder } from './components/questionnaire/QuestionnaireBuilder';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const AuthPages: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        {showRegister ? (
          <RegisterForm />
        ) : (
          <LoginForm />
        )}
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {showRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {showRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const ProtectedApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/mongo-forms" element={<MongoFormsPage />} />
          <Route path="/mongo-forms/:formId" element={<MongoFormFillPage />} />
          <Route path="/builder" element={<QuestionnaireBuilder />} />
          <Route path="/builder/:formId" element={<QuestionnaireBuilder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <Router>
      {isAuthenticated ? <ProtectedApp /> : <AuthPages />}
    </Router>
  );
}; 