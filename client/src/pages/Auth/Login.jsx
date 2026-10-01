import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const user = await login(form);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mt-2 text-ink-soft">Log in to manage your scores, charity and winnings.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <ErrorNote error={error} />
        <Field label="Email"><Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><Input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">New here? <Link to="/signup" className="font-semibold text-ink underline">Create an account</Link></p>
    </div>
  );
}
