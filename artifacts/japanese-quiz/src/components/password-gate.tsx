import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SESSION_KEY = 'kamus_auth';
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string | undefined;

/**
 * Wraps the app with a password gate.
 * Only active when the VITE_APP_PASSWORD build-time env var is set.
 * Once unlocked, access is stored in sessionStorage so a page refresh
 * doesn't ask again within the same browser tab session.
 */
export function PasswordGate({ children }: { children: React.ReactNode }) {
  // If no password is configured, skip the gate entirely.
  if (!CORRECT_PASSWORD) {
    return <>{children}</>;
  }

  return <PasswordGateInner>{children}</PasswordGateInner>;
}

function PasswordGateInner({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Focus the input on mount
  useEffect(() => {
    if (!unlocked) {
      document.getElementById('password-input')?.focus();
    }
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / title */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">かむす</h1>
          <p className="text-muted-foreground text-sm">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={shake ? 'animate-shake' : ''}
          >
            <Input
              id="password-input"
              type="password"
              placeholder="Password"
              value={value}
              autoComplete="current-password"
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {error && (
              <p className="text-destructive text-xs mt-1 pl-1">
                Incorrect password. Try again.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
