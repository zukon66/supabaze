'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function GroupSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const groupId = typeof params?.groupId === 'string' ? params.groupId : null;

    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkOwnership = async () => {
            if (!groupId) return;
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }

            const { data: group, error } = await supabase
                .from('groups')
                .select('owner_id')
                .eq('id', groupId)
                .single();

            if (group && group.owner_id === session.user.id) {
                setIsOwner(true);
            }

            setLoading(false);
        };

        checkOwnership();
    }, [groupId, router]);

    const handleDeleteGroup = async () => {
        if (!groupId || !isOwner) return;

        const confirmed = window.confirm('Bu grubu silmek istediginizden emin misiniz? Bu islem geri alinamaz.');
        if (!confirmed) return;

        setDeleting(true);
        setError(null);

        try {
            const { error: deleteError, data } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId)
                .select();

            if (deleteError) {
                console.error('Group delete error:', deleteError);
                setError(deleteError.message);
                setDeleting(false);
                return;
            }

            if (!data || data.length === 0) {
                setError('Grup silinemedi. Yetkiniz olmayabilir.');
                setDeleting(false);
                return;
            }

            window.location.href = '/app';
        } catch (err) {
            console.error('Unexpected error deleting group:', err);
            setError('Beklenmeyen bir hata olustu.');
            setDeleting(false);
        }
    };

    if (!groupId) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-dark px-4 py-10 flex items-center justify-center">
                <p className="text-slate-400">Yükleniyor...</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-dark px-4 py-10">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6 flex items-center gap-2">
                        <Link href={`/app/groups/${groupId}`} className="text-sm font-medium text-slate-400 hover:text-white transition">← Gruba dön</Link>
                    </div>
                    <div className="rounded-2xl bg-surface p-8 text-center border border-rose-900/30">
                        <h1 className="text-2xl font-bold text-white mb-2">Yetkisiz Erişim</h1>
                        <p className="text-slate-400">Bu sayfayı görüntülemek için grup yöneticisi olmalısınız.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark px-4 py-10">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-6 flex items-center gap-2">
                    <Link
                        href={`/app/groups/${groupId}`}
                        className="text-sm font-medium text-slate-400 hover:text-white transition"
                    >
                        ← Gruba dön
                    </Link>
                    <span className="text-slate-600">/</span>
                    <span className="text-sm font-semibold text-white">Ayarlar</span>
                </div>

                <h1 className="mb-8 text-2xl font-bold text-white">Grup Ayarları</h1>

                <div className="overflow-hidden rounded-2xl bg-surface shadow-lg border border-rose-900/30 ring-1 ring-white/5">
                    {/* Only render this block if owner (double check, though we return early above) */}
                    <div className="border-b border-rose-900/30 px-6 py-4 bg-rose-950/20">
                        <h2 className="font-bold text-rose-500">Tehlikeli Bölge</h2>
                        <p className="text-sm text-rose-400/70">
                            Bu işlemler geri alınamaz. Lütfen dikkatli olun.
                        </p>
                    </div>
                    <div className="bg-rose-950/10 px-6 py-6 border-t border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-white">Grubu Sil</h3>
                                <p className="text-sm text-slate-400">
                                    Grubu ve içindeki tüm projeleri kalıcı olarak siler.
                                </p>
                            </div>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={deleting}
                                className="whitespace-nowrap rounded-xl bg-surface px-5 py-2.5 text-sm font-bold text-rose-500 shadow-sm ring-1 ring-rose-900/50 transition hover:bg-rose-600 hover:text-white hover:ring-rose-600 disabled:opacity-50"
                            >
                                {deleting ? 'Siliniyor...' : 'Grubu Sil'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-4 text-sm font-medium text-rose-500 bg-rose-950/50 p-3 rounded-lg border border-rose-900/50">
                                Hata: {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
