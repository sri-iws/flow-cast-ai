import { useState } from 'react';
import { loginUser, registerUser } from '../api';

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'ceo', label: 'CEO' },
];

const defaultSignup = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  role: 'manager',
};

const defaultLogin = {
  username: '',
  password: '',
  role: 'manager',
};

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [signupForm, setSignupForm] = useState(defaultSignup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await loginUser(loginForm.username, loginForm.password, loginForm.role);
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await registerUser(signupForm);
      const signedInUser = await loginUser(signupForm.username, signupForm.password, signupForm.role);
      onAuthenticated({ ...signedInUser, fullName: user.fullName, email: user.email, role: user.role });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-branding">
          <div className="brand-lockup auth-brand">
            <div className="brand-mark"><span /><span /><span /></div>
            <div>
              <strong>flow cast</strong>
              <small>inventory intelligence</small>
            </div>
          </div>
          <h1>Access your inventory workspace</h1>
          <p>Sign in with your role or create a new manager, analyst, or CEO account.</p>
          <div className="role-pills" aria-label="Available roles">
            {roleOptions.map(option => {
              const isActive = mode === 'login' ? option.value === loginForm.role : option.value === signupForm.role;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`role-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (mode === 'login') {
                      setLoginForm(current => ({ ...current, role: option.value }));
                    } else {
                      setSignupForm(current => ({ ...current, role: option.value }));
                    }
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Sign in
            </button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              Sign up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                <span>Username</span>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={event => setLoginForm(current => ({ ...current, username: event.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={event => setLoginForm(current => ({ ...current, password: event.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </label>
              <button type="submit" className="button primary auth-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label>
                <span>Full name</span>
                <input
                  type="text"
                  value={signupForm.fullName}
                  onChange={event => setSignupForm(current => ({ ...current, fullName: event.target.value }))}
                  placeholder="Jane Smith"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={event => setSignupForm(current => ({ ...current, email: event.target.value }))}
                  placeholder="name@company.com"
                  required
                />
              </label>
              <div className="auth-row">
                <label>
                  <span>Username</span>
                  <input
                    type="text"
                    value={signupForm.username}
                    onChange={event => setSignupForm(current => ({ ...current, username: event.target.value }))}
                    placeholder="username"
                    required
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select
                    value={signupForm.role}
                    onChange={event => setSignupForm(current => ({ ...current, role: event.target.value }))}
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={event => setSignupForm(current => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" className="button primary auth-submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
