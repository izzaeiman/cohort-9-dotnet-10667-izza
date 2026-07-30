// ─── Auth Form Interfaces ───────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type UserRole = 'Regular User' | 'Administrator';

export interface SignupCredentials {
  fullName: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword?: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// ─── Form Field Types ────────────────────────────────────────────────────────

export interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export interface FormButtonProps {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'primary' | 'google' | 'outlined';
}
