'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                setError(updateError.message);
            } else {
                // Success - redirect to app
                alert('Şifreniz başarıyla güncellendi! Panele yönlendiriliyorsunuz.');
                router.replace('/app');
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-dark px-4 py-12">
            <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-2xl border border-white/5">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-white">Yeni Şifre Belirle</h1>
                    <p className="mt-2 text-sm text-slate-400">Lütfen hesabınız için yeni bir şifre girin.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                            Yeni Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-white placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 sm:text-sm transition"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-rose-950/30 p-3 text-sm text-rose-400 border border-rose-900/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 hover:shadow-blue-900/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </form>
            </div>
        </div>
    );
}
