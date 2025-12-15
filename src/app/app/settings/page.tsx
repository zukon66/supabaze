'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { deleteAccountAction } from './actions';

export default function UserSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setEmail(user.email);
            } else {
                router.replace('/login');
            }
        };
        getUser();
    }, [router]);

    const handleResetPassword = async () => {
        if (!email) return;

        setLoading(true);
        setMessage(null);

        // This URL must match the Update Password page route
        // In local dev: http://localhost:3000/auth/update-password
        // In prod: window.location.origin + '/auth/update-password'
        const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({
                    type: 'success',
                    text: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
                });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Beklenmeyen bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir.'
        );

        if (!confirmed) return;

        // Extra confirmation
        const doubleCheck = window.prompt('Onaylamak için lütfen "SİL" yazın:');
        if (doubleCheck !== 'SİL') {
            alert('İşlem iptal edildi.');
            return;
        }

        setDeleting(true);
        setMessage(null);

        try {
            const result = await deleteAccountAction();

            if (result.error) {
                setMessage({ type: 'error', text: result.error });
                setDeleting(false);
            } else {
                await supabase.auth.signOut();
                alert('Hesabınız başarıyla silindi.');
                window.location.href = '/login';
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Bir hata oluştu.' });
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
                <div className="mb-6 flex items-center gap-2">
                    <Link href="/app" className="text-sm font-medium text-slate-400 hover:text-white transition">← Panele dön</Link>
                </div>

                <h1 className="mb-8 text-2xl font-bold text-white">Hesap Ayarları</h1>

                <div className="space-y-8">
                    <div className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
                        <h2 className="mb-4 text-lg font-bold text-white">Güvenlik</h2>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-slate-700 bg-dark/30 p-4">
                                <p className="text-sm text-slate-400 mb-2">E-posta Adresiniz</p>
                                <p className="text-md font-medium text-white">{email || 'Yükleniyor...'}</p>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-dark/30 p-4">
                                <h3 className="text-sm font-semibold text-white mb-2">Şifre Değiştir</h3>
                                <p className="text-xs text-slate-400 mb-4">
                                    Şifrenizi değiştirmek için aşağıdaki butona tıklayın. Size bir sıfırlama bağlantısı göndereceğiz.
                                </p>

                                <button
                                    onClick={handleResetPassword}
                                    disabled={loading || !email}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama E-postası Gönder'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-surface overflow-hidden shadow-lg border border-rose-900/30">
                        <div className="bg-rose-950/20 px-6 py-4 border-b border-rose-900/30">
                            <h2 className="font-bold text-rose-500">Tehlikeli Bölge</h2>
                        </div>
                        <div className="p-6 bg-rose-950/10">
                            <h3 className="font-semibold text-white mb-2">Hesabı Sil</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Hesabınızı sildiğinizde, oluşturduğunuz gruplar, projeler ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                            </p>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-bold text-rose-500 shadow-sm ring-1 ring-rose-900/50 transition hover:bg-rose-600 hover:text-white hover:ring-rose-600 disabled:opacity-50"
                            >
                                {deleting ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}
                            </button>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mt-6 rounded-lg p-3 text-sm border ${message.type === 'success'
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                            : 'bg-rose-950/30 text-rose-400 border-rose-900/30'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
