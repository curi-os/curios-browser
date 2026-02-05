import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

test('renders chat welcome message', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const welcomeElement = screen.getByText(/welcome to curios/i);
  expect(welcomeElement).toBeInTheDocument();
});
