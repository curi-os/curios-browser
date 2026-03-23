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

  expect(await screen.findByText(/welcome to/i)).toBeInTheDocument();
  expect(screen.getByText(/signup or signin/i)).toBeInTheDocument();
  expect(screen.getAllByText(/change provider/i).length).toBeGreaterThan(0);
});
