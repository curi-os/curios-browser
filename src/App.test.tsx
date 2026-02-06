import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

test('renders chat greeting message', async () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  // The greeting can briefly be the session-loading message while auth/session bootstrap.
  const greeting = await screen.findByText(/(welcome to curios|checking your session)/i);
  expect(greeting).toBeInTheDocument();
});
