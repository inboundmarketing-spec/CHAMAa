'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkFirstAccess, setupFirstAccess } from '@/lib/api';
import { setAdminUser } from '@/lib/admin-user';

type Step = 'email' | 'password';

export function FirstAccessPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await checkFirstAccess(email);
      setName(res.name);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível validar o e-mail');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await setupFirstAccess(email, password, name);
      localStorage.setItem('chama_token', token);
      setAdminUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card login-card" style={{ marginTop: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Primeiro acesso</h2>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
        >
          Voltar
        </button>
      </div>
      <p style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem' }}>
        {step === 'email'
          ? 'Informe o e-mail autorizado pela comissão.'
          : 'Crie sua senha para entrar no painel.'}
      </p>

      {step === 'email' ? (
        <form onSubmit={handleCheckEmail}>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <button
            type="submit"
            className="btn"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Verificando…' : 'Continuar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSetup}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.75rem' }}>
            {email}
          </p>
          <label>Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
          />
          <label>Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="login-error">{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setStep('email');
                setError('');
                setPassword('');
                setConfirm('');
              }}
              disabled={loading}
            >
              Voltar
            </button>
            <button
              type="submit"
              className="btn"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Salvando…' : 'Criar senha'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
