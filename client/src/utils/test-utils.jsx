import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Create basic mock providers
const MockAuthProvider = ({ children }) => {
  const value = {
    user: { id: 'test-user', name: 'Test User', role: 'user' },
    token: 'fake-token',
    loading: false,
    isAuthenticated: true,
    isAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    checkAuth: vi.fn(),
    updateFCMToken: vi.fn()
  };
  
  // We need to provide the actual context, but importing it might trigger actual api calls if not careful.
  // Instead, we can just mock the hooks using vi.mock in the test files.
  return <>{children}</>;
};

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
