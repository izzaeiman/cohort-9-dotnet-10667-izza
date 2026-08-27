import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { MdEmail, MdArrowBack } from 'react-icons/md';

import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/forgotPasswordSchema';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import styles from './ForgotPasswordForm.module.css';

interface ForgotPasswordFormProps {
  onSubmit: SubmitHandler<ForgotPasswordFormData>;
  isLoading?: boolean;
  serverError?: string;
}

const ForgotPasswordForm = ({
  onSubmit,
  isLoading = false,
  serverError,
}: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Forgot password form"
    >
      <p className={styles.description}>
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {/* Server error */}
      {serverError && (
        <div className={styles.serverError} role="alert" aria-live="polite">
          <span className={styles.errorIcon}>⚠️</span>
          {serverError}
        </div>
      )}

      {/* Email input */}
      <AppInput
        id="forgot-email"
        label="Email Address"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        leftIcon={<MdEmail />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Submit button */}
      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        id="forgot-submit"
      >
        Send Reset Link
      </AppButton>

      {/* Back to Login link */}
      <p className={styles.backText}>
        <Link to="/login" className={styles.backLink} id="forgot-back-link">
          <MdArrowBack size={16} /> Back to Sign In
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
