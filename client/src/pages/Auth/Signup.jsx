import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';
import CharityPicker from '../../components/forms/CharityPicker.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = params.get('plan') || 'monthly';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [charity, setCharity] = useState({ charityId: params.get('charity') || null, percent: 10 });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!charity.charityId) return setError(new Error('Choose a charity to support.'));
    setBusy(true); setError(null);
    try {
      await signup({ ...form, charity_id: charity.charityId, charity_percent: charity.percent });
      navigate(`/subscribe?plan=${plan}`, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Create your account</h1>
      <p className="mt-2 text-ink-soft">Choose your charity now. Next you'll pick a plan.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <ErrorNote error={error} />
        <Field label="Full name"><Input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" hint="At least 8 characters."><Input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <CharityPicker value={charity} onChange={setCharity} />
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">Already a member? <Link to="/login" className="font-semibold text-ink underline">Log in</Link></p>
    </div>
  );
}
