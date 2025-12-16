'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction } from './actions';
import { translateAuthError } from '@/lib/utils';

const initialState = { error: null as string | null };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl ring-1 ring-white/10">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Giriş Yap</h1>
          <p className="text-sm text-slate-400">Teknoloji Kulübü hesabınla devam et.</p>
        </div>
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="ornek@eposta.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Şifre</label>
            <input
              type="password"
              name="password"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              placeholder="********"
              required
            />
          </div>
          {state.error ? (
            <p className="text-sm text-rose-500" role="alert">
              {translateAuthError(state.error)}
            </p>
          ) : null}
          <SubmitButton />
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Hesabın yok mu?{' '}
          <Link href="/signup" className="font-semibold text-secondary hover:text-white transition">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-yellow-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-600 hover:shadow-orange-900/40 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
    </button>
  );
}
