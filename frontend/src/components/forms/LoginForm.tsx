import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';

import { loginSchema, type LoginFormData } from '../../utils/loginSchema';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSubmit: SubmitHandler<LoginFormData>;
  isLoading?: boolean;
  serverError?: string;
  successMessage?: string;
  onGoogleSignIn?: () => void;
}

const LoginForm = ({ onSubmit, isLoading = false, serverError, successMessage, onGoogleSignIn }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Login form"
    >
      {/* Success banner */}
      {successMessage && (
        <div className={styles.successBanner} role="status" aria-live="polite">
          <span className={styles.errorIcon}>🎉</span>
          {successMessage}
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div className={styles.serverError} role="alert" aria-live="polite">
          <span className={styles.errorIcon}>⚠️</span>
          {serverError}
        </div>
      )}

      {/* Email field */}
      <AppInput
        id="login-email"
        label="Email Address"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        leftIcon={<MdEmail />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password field */}
      <AppInput
        id="login-password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter your password"
        autoComplete="current-password"
        leftIcon={<MdLock />}
        error={errors.password?.message}
        rightSlot={
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={togglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
          </button>
        }
        {...register('password')}
      />

      {/* Remember me + Forgot password row */}
      <div className={styles.row}>
        <label className={styles.checkboxLabel}>
          <input
            id="login-remember"
            type="checkbox"
            className={styles.checkbox}
            {...register('rememberMe')}
          />
          <span className={styles.checkmark} aria-hidden="true" />
          Remember me
        </label>
        <Link
          to="/forgot-password"
          className={styles.forgotLink}
          tabIndex={0}
        >
          Forgot password?
        </Link>
      </div>

      {/* Login button */}
      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        id="login-submit"
      >
        Sign In to WorkFlow
      </AppButton>

      {/* Divider */}
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>OR</span>
        <span className={styles.dividerLine} />
      </div>

      {/* Google sign in */}
      <AppButton
        type="button"
        variant="google"
        size="lg"
        fullWidth
        leftIcon={<FcGoogle size={20} />}
        id="login-google"
        aria-label="Continue with Google"
        onClick={onGoogleSignIn}
      >
        Continue with Google
      </AppButton>

      {/* Sign up link */}
      <p className={styles.signupText}>
        Don't have an account?{' '}
        <Link to="/signup" className={styles.signupLink} id="login-signup-link">
          Sign Up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
