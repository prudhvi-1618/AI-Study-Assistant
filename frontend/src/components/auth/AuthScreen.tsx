'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff } from '@/components/common/Icons';
import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'login' | 'register';

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

type AuthScreenProps = {
  mode: AuthMode;
};

const initialForm: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
};

const features = [
  'Generate flashcards from any PDF',
  'Practice with AI-generated MCQs',
  'Chat with your documents',
];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1V17A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.4V7H2.1a11 11 0 0 0 0 10l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.3c1.6 0 3.1.6 4.2 1.7l3.2-3.2A10.8 10.8 0 0 0 12 1 11 11 0 0 0 2.1 7l3.7 2.8c.9-2.6 3.3-4.5 6.2-4.5Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function validate(mode: AuthMode, form: FormState) {
  const nextErrors: Errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (mode === 'register' && !form.name.trim()) {
    nextErrors.name = 'Full name is required.';
  }

  if (!form.email.trim()) {
    nextErrors.email = 'Email is required.';
  } else if (!emailPattern.test(form.email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    nextErrors.password = 'Password is required.';
  } else if (form.password.length < (mode === 'register' ? 8 : 6)) {
    nextErrors.password = mode === 'register' ? 'Use at least 8 characters.' : 'Use at least 6 characters.';
  }

  if (mode === 'register') {
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!form.terms) {
      nextErrors.terms = 'Accept the terms to continue.';
    }
  }

  return nextErrors;
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const { login, register } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = mode === 'login';
  const copy = useMemo(
    () => ({
      heading: isLogin ? 'Welcome back' : 'Create your account',
      subheading: isLogin ? 'Sign in to your account' : 'Start studying smarter today',
      submit: isLogin ? 'Sign in' : 'Create account',
      footerLead: isLogin ? 'New here?' : 'Already have an account?',
      footerAction: isLogin ? 'Create an account' : 'Sign in',
      footerHref: isLogin ? '/register' : '/login',
    }),
    [isLogin]
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const updateField = <T extends keyof FormState>(field: T, value: FormState[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(mode, form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        setToast({ message: 'Welcome back! 🎉', type: 'success' });
      } else {
        await register(form.name, form.email, form.password);
        setToast({ message: 'Account created! 🎉', type: 'success' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'An error occurred during authentication.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-ink">
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed right-5 top-5 z-50 rounded-2xl border px-5 py-3 text-sm font-semibold shadow ${
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-brand/20 bg-white text-ink'
          }`}
          role="status"
        >
          {toast.message}
        </motion.div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden w-1/2 flex-col justify-between bg-ink px-12 py-12 text-white md:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-extrabold">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white">AI</span>
              StudyAI
            </Link>

            <div className="mt-24 max-w-xl">
              <h1 className="whitespace-pre-line text-5xl font-extrabold leading-tight tracking-normal">
                {'Your exam prep,\npowered by AI.'}
              </h1>

              <ul className="mt-10 space-y-5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-base font-medium text-white/85">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-ink">
                      <Check className="h-4 w-4" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="max-w-sm rounded-2xl bg-brand-light p-5 text-ink shadow-sm">
            <p className="text-sm font-semibold text-brand-dark">Today&apos;s study set</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-extrabold">+48</p>
                <p className="text-sm text-gray-700">flashcards generated</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-brand">
                94%
              </div>
            </div>
          </div>
        </aside>

        <section className="flex w-full items-center justify-center px-5 py-10 md:w-1/2 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-normal text-ink">{copy.heading}</h2>
              <p className="mt-2 text-base text-gray-500">{copy.subheading}</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {!isLogin ? (
                <Field
                  label="Full name"
                  name="name"
                  value={form.name}
                  placeholder="Alex Morgan"
                  error={errors.name}
                  onChange={(value) => updateField('name', value)}
                />
              ) : null}

              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                placeholder="you@example.com"
                error={errors.email}
                onChange={(value) => updateField('email', value)}
              />

              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                placeholder="Enter your password"
                visible={showPassword}
                error={errors.password}
                onToggle={() => setShowPassword((current) => !current)}
                onChange={(value) => updateField('password', value)}
              />

              {!isLogin ? (
                <PasswordField
                  label="Confirm password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  placeholder="Confirm your password"
                  visible={showConfirmPassword}
                  error={errors.confirmPassword}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                  onChange={(value) => updateField('confirmPassword', value)}
                />
              ) : null}

              {isLogin ? (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-brand">
                    Forgot password?
                  </Link>
                </div>
              ) : (
                <label className="block">
                  <span className="flex items-start gap-3 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.terms}
                      onChange={(event) => updateField('terms', event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-200 text-brand focus:ring-2 focus:ring-brand/40"
                    />
                    <span>
                      I agree to the <a className="font-medium text-brand" href="#">Terms</a> and{' '}
                      <a className="font-medium text-brand" href="#">Privacy Policy</a>
                    </span>
                  </span>
                  {errors.terms ? <span className="mt-1 block text-sm text-red-500">{errors.terms}</span> : null}
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-base font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
                {copy.submit}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              {copy.footerLead}{' '}
              <Link href={copy.footerHref} className="font-semibold text-brand">
                {copy.footerAction}
              </Link>
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  error?: string;
  type?: string;
  onChange: (value: string) => void;
};

function Field({ label, name, value, placeholder, error, type = 'text', onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base text-ink outline-none transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-brand/40"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error ? (
        <span id={`${name}-error`} className="mt-1 block text-sm text-red-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type PasswordFieldProps = Omit<FieldProps, 'type'> & {
  visible: boolean;
  onToggle: () => void;
};

function PasswordField({ label, name, value, placeholder, error, visible, onChange, onToggle }: PasswordFieldProps) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <span className="relative block">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-12 text-base text-ink outline-none transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-brand/40"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <Icon className="h-5 w-5" />
        </button>
      </span>
      {error ? (
        <span id={`${name}-error`} className="mt-1 block text-sm text-red-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}
