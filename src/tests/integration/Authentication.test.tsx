import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Login from '../../pages/Login';
import CapitalComService from '../../services/capitalcom/CapitalComService';

// Mock the services
jest.mock('../../services/capitalcom/CapitalComService');

describe('Authentication Integration Tests', () => {
  // Mock auth context
  const mockLogin = jest.fn();
  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('Login component should handle Capital.com credentials correctly', async () => {
    // Setup
    const mockCapitalComService = new CapitalComService(false);
    (mockCapitalComService.login as jest.Mock).mockResolvedValue(true);
    (CapitalComService as jest.Mock).mockImplementation(() => mockCapitalComService);

    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Fill in the form
    userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    userEvent.type(screen.getByLabelText(/password/i), 'testpassword');
    userEvent.type(screen.getByLabelText(/api key/i), 'test-api-key');
    userEvent.click(screen.getByLabelText(/use demo account/i));
    
    // Submit the form
    userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the login process to complete
    await waitFor(() => {
      expect(mockCapitalComService.login).toHaveBeenCalledWith({
        login: 'testuser',
        password: 'testpassword',
        apiKey: 'test-api-key',
        encryptedPassword: false
      });
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  test('Login should handle authentication errors', async () => {
    // Setup
    const mockCapitalComService = new CapitalComService(false);
    (mockCapitalComService.login as jest.Mock).mockResolvedValue(false);
    (CapitalComService as jest.Mock).mockImplementation(() => mockCapitalComService);

    // Render the component
    render(
      <AuthContext.Provider value={{
        ...mockAuthContext,
        error: 'Invalid credentials'
      }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Fill in the form
    userEvent.type(screen.getByLabelText(/username/i), 'wronguser');
    userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    userEvent.type(screen.getByLabelText(/api key/i), 'wrong-api-key');
    
    // Submit the form
    userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('Login should validate required fields', async () => {
    // Render the component
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Submit the form without filling in any fields
    userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
