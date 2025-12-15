'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState, useTransition } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { createGroupAction } from './actions';

type Group = {
  id: string;
  name: string;
  invite_code: string;
  role: string;
};

type Props = {
  initialUser: Pick<User, 'id' | 'email'>;
};

export default function AppPageClient({ initialUser }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!session) return;
    setGroupsLoading(true);
    setError(null);

    type GroupRow = {
      role: string;
      groups: {
        id: string;
        name: string;
        invite_code: string;
      } | null;
    };

    const { data, error: queryError } = await supabase
      .from('group_members')
      .select('role, group_id, groups ( id, name, invite_code, created_at )')
      .eq('user_id', session.user.id)
      .order('created_at', { foreignTable: 'groups', ascending: false });

    if (queryError) {
      setError(queryError.message);
      setGroups([]);
      setGroupsLoading(false);
      return;
    }

    const mapped: Group[] =
      (data as unknown as GroupRow[] | null)?.flatMap((item) => {
        if (!item.groups) return [];
        return [
          {
            id: item.groups.id,
            name: item.groups.name,
            invite_code: item.groups.invite_code,
            role: item.role,
          },
        ];
      }) ?? [];

    setGroups(mapped);
    setGroupsLoading(false);
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data.session) {
        router.replace('/login');
        return;
      }

      setSession(data.session);
      setCheckingSession(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      if (!nextSession) {
        router.replace('/login');
      } else {
        setSession(nextSession);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchGroups();
  }, [session, fetchGroups]);

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createGroupAction(formData);

      if (result.error) {
        setError(result.error);
        setCreating(false);
        return;
      }

      if (result.data) {
        setCreateName('');
        setGroups((prev) => [
          { id: result.data.id, name: result.data.name, invite_code: result.data.invite_code, role: 'owner' },
          ...prev,
        ]);
      }

      setCreating(false);
    });
  };

  const handleJoinGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Davet kodu bos olamaz.');
      return;
    }

    setJoining(true);
    setError(null);

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, invite_code')
      .eq('invite_code', trimmed)
      .maybeSingle();

    if (groupError) {
      setError(groupError.message);
      setJoining(false);
      return;
    }

    if (!group) {
      setError('Gecersiz davet kodu.');
      setJoining(false);
      return;
    }

    const { error: insertError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: session.user.id,
      role: 'member',
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Zaten bu grubun uyesisin.');
      } else {
        setError(insertError.message);
      }
      setJoining(false);
      return;
    }

    setJoinCode('');
    await fetchGroups();
    setJoining(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-sm text-slate-400">Oturum kontrol ediliyor...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-sm text-rose-500">Kullanıcı oturumu kapalı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl bg-surface p-6 shadow-xl border border-white/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Yönetim Paneli</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Gruplarım</h1>
            <p className="text-sm text-slate-400">Giriş yapan: {session.user.email ?? initialUser.email}</p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <Link
              href="/app/settings"
              className="rounded-xl border border-slate-700 bg-dark/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Hesap Ayarları
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-rose-400 border border-slate-700/50 transition hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-900/30"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
            <h2 className="text-xl font-bold text-white">Grup Oluştur</h2>
            <p className="text-sm text-slate-400">Yeni bir çalışma grubu başlat.</p>
            <form onSubmit={handleCreateGroup} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Grup Adı</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  name="groupName"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
                  placeholder="Ürün Ekibi"
                />
              </div>
              <button
                type="submit"
                disabled={creating || isPending || !createName.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 hover:shadow-blue-900/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating || isPending ? 'Oluşturuluyor...' : 'Grup Oluştur'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
            <h2 className="text-xl font-bold text-white">Gruba Katıl</h2>
            <p className="text-sm text-slate-400">Davet kodu ile ekibe dahil ol.</p>
            <form onSubmit={handleJoinGroup} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Davet Kodu</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm uppercase tracking-widest text-white shadow-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-600"
                  placeholder="KOD-GİR"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="w-full rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {joining ? 'Katılınıyor...' : 'Gruba Katıl'}
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Grupların</h2>
            {groupsLoading ? <span className="text-xs text-slate-500 animate-pulse">Yükleniyor...</span> : null}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {groups.length === 0 && !groupsLoading ? (
              <div className="col-span-2 py-8 text-center">
                <p className="text-slate-500">Henüz bir gruba üye değilsin.</p>
              </div>
            ) : null}
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/app/groups/${group.id}`}
                className="group flex flex-col rounded-xl border border-slate-700 bg-dark/30 px-5 py-4 transition hover:border-primary hover:bg-dark/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white group-hover:text-primary transition">{group.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${group.role === 'owner' ? 'bg-secondary/20 text-secondary' : 'bg-slate-700 text-slate-300'
                    }`}>
                    {group.role === 'owner' ? 'Yönetici' : 'Üye'}
                  </span>
                </div>
                <p className="mt-3 text-xs font-mono uppercase tracking-[0.08em] text-slate-500 group-hover:text-slate-400">
                  Kod: {group.invite_code}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
