'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setAdminUser } from '@/lib/admin-user';
import { FirstAccessPanel } from '@/components/FirstAccessPanel';
import { AdminBrand } from '@/components/chaminha/AdminBrand';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@interunesp.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [showFirstAccess, setShowFirstAccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { token, user } = await login(email, password);
      localStorage.setItem('chama_token', token);
      setAdminUser(user);
      router.push('/dashboard');
    } catch {
      setError('Credenciais inválidas');
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <AdminBrand as="h1" />
        <p style={{ color: 'var(--muted)' }}>Painel da comissão organizadora</p>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn" style={{ width: '100%' }}>
          Entrar
        </button>
        {!showFirstAccess && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={() => setShowFirstAccess(true)}
          >
            Primeiro acesso
          </button>
        )}
      </form>
      {showFirstAccess && (
        <FirstAccessPanel onClose={() => setShowFirstAccess(false)} />
      )}
    </div>
  );
}
