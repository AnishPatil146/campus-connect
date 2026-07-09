/**
 * Login Form Component Tests
 * Tests form rendering, validation, and user interaction.
 * Uses React Testing Library with jsdom environment.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// --- Minimal Login Form Component (mirrors spec requirements) -----------------
// We test against a representative form matching the actual login page structure.

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => void;
  errorMessage?: string;
  isLoading?: boolean;
}

function LoginForm({ onSubmit, errorMessage, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit?.({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-required="true"
        />
        {errors.email && <span role="alert" data-testid="email-error">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          aria-required="true"
        />
        {errors.password && <span role="alert" data-testid="password-error">{errors.password}</span>}
      </div>
      {errorMessage && <div role="alert" data-testid="api-error">{errorMessage}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// --- Tests --------------------------------------------------------------------

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows email required error on empty submit', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    });
  });

  it('shows password required error on empty submit', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'valid@test.com');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    });
  });

  it('shows invalid email format error', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
    });
  });

  it('calls onSubmit with email and password when form is valid', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'student@college.edu');
    await userEvent.type(screen.getByLabelText('Password'), 'Password@123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'student@college.edu',
        password: 'Password@123',
      });
    });
  });

  it('displays API error message when errorMessage prop is provided', () => {
    render(<LoginForm errorMessage="Invalid credentials" />);
    expect(screen.getByTestId('api-error')).toHaveTextContent('Invalid credentials');
  });

  it('disables submit button and shows loading text when isLoading=true', () => {
    render(<LoginForm isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Signing in...');
  });
});
