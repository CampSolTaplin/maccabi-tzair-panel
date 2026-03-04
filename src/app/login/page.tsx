'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login error');
        return;
      }

      // Redirect madrich users to take-attendance, admins to dashboard
      const redirectTo = data.user?.role === 'madrich' ? '/take-attendance' : '/';
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B2A6B] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/95 p-3 flex items-center justify-center shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maccabi-logo.png"
              alt="Maccabi Tzair Miami"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#C5E3F6] mb-1">
            School of Madrichim
          </h1>
          <p className="text-sm text-white/40">Control Panel — Maccabi Tzair Miami</p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-7">
          <h2 className="text-lg font-serif font-bold text-[#1B2A6B] mb-5">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-red-50 text-[#C0392B] text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6472] hover:text-[#1B2A6B]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn className="w-4 h-4" /> Log In</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
