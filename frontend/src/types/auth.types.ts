// ─── Auth types ──────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// ─── Form field types ─────────────────────────────────────────────────────────

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
