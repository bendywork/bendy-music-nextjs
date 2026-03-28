'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionResponse {
  code: number;
  message: string;
  data?: {
    authenticated: boolean;
    token?: string;
    user?: {
      login: string;
      name?: string;
      avatar_url?: string;
    };
  };
}

const slides = [
  {
    title: 'Unified Music Gateway',
    description: 'Manage providers, docs, and platform settings from one console.',
    typingText: 'Build once, manage every provider consistently.',
    palette: 'from-neutral-950 via-neutral-800 to-neutral-700',
  },
  {
    title: 'Release-ready Workflow',
    description: 'Versioning, planning, QA gates, and security all in one process.',
    typingText: 'Versioned, audited, and release-ready by design.',
    palette: 'from-neutral-900 via-zinc-700 to-neutral-500',
  },
  {
    title: 'Admin Allowlist Access',
    description: 'Only configured GitHub admins can enter the dashboard.',
    typingText: 'GitHub OAuth + admin allowlist authorization.',
    palette: 'from-zinc-800 via-neutral-600 to-zinc-400',
  },
];

const errorTextMap: Record<string, string> = {
  missing_github_oauth_config: 'GitHub OAuth config is missing. Please set environment variables.',
  oauth_state_mismatch: 'OAuth state validation failed. Please try again.',
  oauth_token_exchange_failed: 'Failed to exchange OAuth token. Please retry.',
  github_user_fetch_failed: 'Failed to fetch GitHub user profile. Please retry.',
  unauthorized_admin: 'This GitHub account is not in the admin allowlist.',
  oauth_callback_error: 'GitHub callback returned an error. Please retry.',
  oauth_callback_failed: 'OAuth callback handling failed. Please retry later.',
};

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = localStorage.getItem('theme_preference');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export default function LoginPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [activeSlide, setActiveSlide] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [errorCode, setErrorCode] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const currentSlide = slides[activeSlide];
  const typingContent = currentSlide.typingText.slice(0, typingIndex);

  const loginError = useMemo(() => {
    if (!errorCode) {
      return '';
    }

    const baseText = errorTextMap[errorCode] ?? 'Login failed. Please retry later.';
    return errorLogin ? `${baseText} (account: ${errorLogin})` : baseText;
  }, [errorCode, errorLogin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorCode(params.get('error') ?? '');
    setErrorLogin(params.get('login') ?? '');
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme_preference', theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        setTypingIndex(0);
        return next;
      });
    }, 5500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTypingIndex((prev) => {
        if (prev >= currentSlide.typingText.length) {
          return prev;
        }
        return prev + 1;
      });
    }, 45);

    return () => window.clearInterval(timer);
  }, [currentSlide.typingText]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          setCheckingSession(false);
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        const sessionData = payload.data;

        if (sessionData?.authenticated) {
          if (sessionData.token) {
            localStorage.setItem('github_token', sessionData.token);
          }
          localStorage.setItem('is_authenticated', 'true');
          localStorage.setItem('auth_timestamp', String(Date.now()));
          if (sessionData.user?.login) {
            localStorage.setItem('github_login', sessionData.user.login);
          }
          if (sessionData.user?.avatar_url) {
            localStorage.setItem('github_avatar_url', sessionData.user.avatar_url);
          }
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.warn('Session check failed:', error);
      }

      setCheckingSession(false);
    };

    void verifySession();
  }, [router]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github/login';
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
        Checking session...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-100 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      <button
        type="button"
        onClick={handleThemeToggle}
        className="absolute right-6 top-6 z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </button>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-hidden md:flex-row">
        <section className="relative flex min-h-[45vh] flex-1 items-end p-8 md:min-h-screen md:p-12">
          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.palette} transition-all duration-700`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_35%)]" />

          <div className="relative z-10 max-w-xl space-y-6 text-white">
            <span className="inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs uppercase tracking-[0.2em]">
              ddmusic-nextjs admin
            </span>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{currentSlide.title}</h1>
            <p className="text-sm text-neutral-200 md:text-base">{currentSlide.description}</p>
            <p className="min-h-7 font-mono text-sm text-neutral-100 md:text-base">
              {typingContent}
              <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-white align-middle" />
            </p>
            <div className="flex items-center gap-2 pt-3">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => {
                    setActiveSlide(index);
                    setTypingIndex(0);
                  }}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white p-8 dark:bg-neutral-900 md:w-[420px] md:p-10">
          <div className="w-full space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Admin Sign In</h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                GitHub OAuth is the only login method.
              </p>
            </div>

            {loginError && (
              <div className="rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                {loginError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGitHubLogin}
              className="group flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:border-neutral-700"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 .5C5.66.5.5 5.66.5 12.02c0 5.08 3.29 9.38 7.86 10.9.57.11.78-.25.78-.55 0-.27-.01-.99-.02-1.95-3.2.7-3.88-1.55-3.88-1.55-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.72 0-1.27.46-2.32 1.2-3.14-.12-.3-.52-1.48.12-3.09 0 0 .98-.31 3.2 1.2.94-.26 1.94-.4 2.94-.4s2 .14 2.94.4c2.22-1.52 3.2-1.2 3.2-1.2.64 1.61.24 2.79.12 3.09.74.82 1.2 1.87 1.2 3.14 0 4.45-2.69 5.43-5.26 5.71.41.35.78 1.04.78 2.1 0 1.52-.01 2.75-.01 3.12 0 .3.2.66.79.55 4.57-1.52 7.85-5.82 7.85-10.9C23.5 5.66 18.34.5 12 .5Z" />
              </svg>
              Continue with GitHub
            </button>

            <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <p>We will fetch your basic GitHub profile for identity verification.</p>
              <p>Only configured admin usernames can access the dashboard.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
