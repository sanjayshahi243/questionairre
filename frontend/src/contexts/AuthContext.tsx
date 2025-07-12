import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authApi } from '../services/auth';

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Context
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const user = await authApi.getCurrentUser(state.token);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token: state.token } });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        // No token, user is not authenticated
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    };

    // Add a small delay to prevent immediate API calls during development
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authData = await authApi.login(credentials);
      localStorage.setItem('authToken', authData.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: authData.user, token: authData.token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authData = await authApi.register(credentials);
      localStorage.setItem('authToken', authData.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: authData.user, token: authData.token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    if (state.token) {
      await authApi.logout(state.token);
    }
    localStorage.removeItem('authToken');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 