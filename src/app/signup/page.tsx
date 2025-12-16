'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.replace('/app');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl ring-1 ring-white/10">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
          <p className="text-sm text-slate-400">
            Aramıza katılmak için bilgilerini gir.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Ad Soyad
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="Adın Soyadın"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="kullaniciadi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="sen@ornek.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="En az 6 karakter"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-500" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-yellow-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-600 hover:shadow-orange-900/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Zaten hesabın var mı?{' '}
          <Link
            href="/login"
            className="font-semibold text-secondary hover:text-white transition"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
