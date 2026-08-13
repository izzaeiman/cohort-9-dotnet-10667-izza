import { useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdBadge, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';

import { signupSchema, USER_ROLES, type SignupFormData } from '../../utils/signupSchema';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import AppSelect from '../ui/AppSelect';
import styles from './SignupForm.module.css';

interface SignupFormProps {
  onSubmit: SubmitHandler<SignupFormData>;
  isLoading?: boolean;
  serverError?: string;
  successMessage?: string;
  onGoogleSignUp?: () => void;
}

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: '', color: '#ECECEC', percent: '0%' };
  if (pass.length < 8) return { score: 1, label: 'Weak', color: '#FF5A5A', percent: '33%' };
  const hasLetter = /[a-zA-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

  if (pass.length >= 10 && hasLetter && hasNumber && hasSpecial) {
    return { score: 3, label: 'Strong', color: '#4CAF50', percent: '100%' };
  }
  if (pass.length >= 8 && hasLetter && hasNumber) {
    return { score: 2, label: 'Medium', color: '#FF7A1A', percent: '66%' };
  }
  return { score: 1, label: 'Weak', color: '#FF5A5A', percent: '33%' };
};

const SignupForm = ({
  onSubmit,
  isLoading = false,
  serverError,
  successMessage,
  onGoogleSignUp,
}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'Regular User',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const watchPassword = useWatch({ control, name: 'password', defaultValue: '' });
  const strength = getPasswordStrength(watchPassword || '');

  const roleOptions = USER_ROLES.map((r) => ({ value: r, label: r }));

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Signup form"
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

      {/* Full Name */}
      <AppInput
        id="signup-fullname"
        label="Full Name"
        type="text"
        placeholder="Sarah Johnson"
        autoComplete="name"
        leftIcon={<MdPerson />}
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      {/* Email Address */}
      <AppInput
        id="signup-email"
        label="Email Address"
        type="email"
        placeholder="sarah@company.com"
        autoComplete="email"
        leftIcon={<MdEmail />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Role Dropdown */}
      <AppSelect
        id="signup-role"
        label="Account Role"
        options={roleOptions}
        leftIcon={<MdBadge />}
        error={errors.role?.message}
        helperText="Select your default role (UI selection for backend authorization)"
        {...register('role')}
      />

      {/* Password */}
      <AppInput
        id="signup-password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Minimum 6 characters"
        autoComplete="new-password"
        leftIcon={<MdLock />}
        error={errors.password?.message}
        rightSlot={
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
          </button>
        }
        {...register('password')}
      />

      {/* Password Strength Indicator */}
      {watchPassword && (
        <div className={styles.strengthWrapper} aria-live="polite">
          <div className={styles.strengthLabel}>
            <span>Password Strength:</span>
            <span className={styles.strengthText} style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
          <div className={styles.strengthBarTrack}>
            <div
              className={styles.strengthBarFill}
              style={{ width: strength.percent, backgroundColor: strength.color }}
            />
          </div>
        </div>
      )}

      {/* Confirm Password */}
      <AppInput
        id="signup-confirm-password"
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        leftIcon={<MdLock />}
        error={errors.confirmPassword?.message}
        rightSlot={
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowConfirmPassword((p) => !p)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
          </button>
        }
        {...register('confirmPassword')}
      />

      {/* Terms Checkbox */}
      <div className={styles.checkboxWrapper}>
        <label className={styles.checkboxLabel}>
          <input
            id="signup-terms"
            type="checkbox"
            className={styles.checkbox}
            {...register('agreeToTerms')}
          />
          <span className={styles.checkmark} aria-hidden="true" />
          <span>
            I agree to the{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()} className={styles.termsLink}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()} className={styles.termsLink}>
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agreeToTerms?.message && (
          <p className={styles.errorText} role="alert">
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        id="signup-submit"
      >
        Create Account
      </AppButton>

      {/* Divider */}
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>OR</span>
        <span className={styles.dividerLine} />
      </div>

      {/* Google Sign Up */}
      <AppButton
        type="button"
        variant="google"
        size="lg"
        fullWidth
        leftIcon={<FcGoogle size={20} />}
        id="signup-google"
        aria-label="Sign up with Google"
        onClick={onGoogleSignUp}
      >
        Sign Up with Google
      </AppButton>

      {/* Sign In Link */}
      <p className={styles.signinText}>
        Already have an account?{' '}
        <Link to="/login" className={styles.signinLink} id="signup-login-link">
          Sign In
        </Link>
      </p>
    </form>
  );
};

export default SignupForm;
