import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al enviar el enlace');
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <span className="text-4xl">📧</span>
          <h2 className="text-lg font-semibold text-white">Revisa tu correo</h2>
          <p className="text-sm text-gray-400">
            Enviamos un enlace de acceso a <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-xs text-gray-500">El enlace expira en 15 minutos.</p>
          <button
            onClick={() => { setSent(false); setEmail(''); }}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Usar otro correo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">⚗️</span>
          <h1 className="text-xl font-bold text-white">STEM Laboratory</h1>
          <p className="text-sm text-gray-400">Tutor de Química con IA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Enviando...' : 'Acceder con enlace mágico'}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <p className="text-xs text-gray-600 text-center">
          Sin contraseña. Te enviamos un enlace de acceso a tu correo.
        </p>
      </div>
    </div>
  );
}
