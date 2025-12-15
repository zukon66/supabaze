'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type Group = {
  id: string;
  name: string;
  invite_code: string;
};

type Member = {
  user_id: string;
  role: string;
  profiles: {
    username: string;
    full_name: string;
  } | null;
};

type Project = {
  id: string;
  name: string;
};

export default function GroupPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    const groupPromise = supabase
      .from('groups')
      .select('id, name, invite_code')
      .eq('id', groupId)
      .single();

    const membersPromise = supabase
      .from('group_members')
      .select('user_id, role, profiles(username, full_name)')
      .eq('group_id', groupId);

    const projectsPromise = supabase
      .from('projects')
      .select('id, name, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const [{ data: groupData, error: groupError }, { data: memberData, error: memberError }, { data: projectData, error: projectError }] =
      await Promise.all([groupPromise, membersPromise, projectsPromise]);

    if (groupError || memberError || projectError) {
      setError(groupError?.message || memberError?.message || projectError?.message || 'Grup yuklenemedi.');
      setLoading(false);
      return;
    }

    setGroup(groupData);

    // Fix: Handle profiles being returned as an array or object
    const mappedMembers: Member[] = (memberData || []).map((m: any) => {
      // Supabase might return profiles as an array (one-to-many) or single object
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        user_id: m.user_id,
        role: m.role,
        profiles: profile ? {
          username: profile.username,
          full_name: profile.full_name
        } : null
      };
    });

    setMembers(mappedMembers);

    setProjects(
      (projectData ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      }))
    );
    setLoading(false);
  }, [groupId]);

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
    if (!session || !groupId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [session, groupId, fetchData]);

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupId || !session) return;
    setCreatingProject(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        name: projectName.trim(),
        group_id: groupId,
        created_by: session.user.id,
      })
      .select('id, name')
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreatingProject(false);
      return;
    }

    setProjectName('');
    setProjects((prev) => [{ id: data!.id, name: data!.name }, ...prev]);
    setCreatingProject(false);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-sm text-slate-400">Oturum kontrol ediliyor...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-sm font-medium text-slate-400 hover:text-white transition">
            ← Gruplara dön
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5 animate-pulse">
            <p className="text-sm text-slate-400">Grup yükleniyor...</p>
          </div>
        ) : group ? (
          <>
            <header className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary">Çalışma Grubu</p>
                  <h1 className="mt-1 text-3xl font-bold text-white">{group.name}</h1>
                  <p className="mt-2 text-xs font-mono uppercase tracking-[0.08em] text-slate-500">
                    Davet Kodu: <span className="text-slate-300 select-all">{group.invite_code}</span>
                  </p>
                </div>
                <Link
                  href={`/app/groups/${groupId}/settings`}
                  className="rounded-xl border border-slate-700 bg-dark/50 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white hover:border-slate-500"
                >
                  Ayarlar
                </Link>
              </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Üyeler</h2>
                  <span className="text-xs font-medium text-slate-500 bg-dark/50 px-2 py-1 rounded-md">
                    {members.length} Üye
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {members.length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz üye yok.</p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded-xl border border-slate-700 bg-dark/30 px-4 py-3 transition hover:bg-dark/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {(member.profiles?.full_name?.[0] || member.profiles?.username?.[0] || member.user_id[0]).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-300 truncate w-32 md:w-auto" title={member.user_id}>
                            {member.profiles?.full_name || member.profiles?.username || member.user_id.substring(0, 8) + '...'}
                          </span>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${member.role === 'owner' ? 'bg-secondary/20 text-secondary' : 'bg-slate-700 text-slate-300'
                          }`}>
                          {member.role === 'owner' ? 'Yönetici' : 'Üye'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
                <h2 className="text-lg font-bold text-white">Proje Oluştur</h2>
                <p className="text-sm text-slate-400">Bu grup için yeni bir proje başlat.</p>
                <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Proje Adı</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-dark/50 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
                      placeholder="Web Sitesi Yenileme"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingProject || !projectName.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 hover:shadow-blue-900/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingProject ? 'Oluşturuluyor...' : 'Proje Oluştur'}
                  </button>
                </form>
              </section>
            </div>

            <section className="rounded-2xl bg-surface p-6 shadow-lg border border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Projeler</h2>
                <span className="text-xs font-medium text-slate-500 bg-dark/50 px-2 py-1 rounded-md">
                  {projects.length} Proje
                </span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {projects.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-slate-500">
                    Henüz proje yok. Yukarıdan bir tane oluşturabilirsin.
                  </div>
                ) : (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/groups/${groupId}/projects/${project.id}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-700 bg-dark/30 px-5 py-4 transition hover:border-primary hover:bg-dark/50"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-white group-hover:text-primary transition">{project.name}</h3>
                        <p className="text-xs font-mono text-slate-500 mt-1">ID: {project.id.substring(0, 8)}...</p>
                      </div>
                      <span className="text-slate-600 group-hover:text-primary transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-lg border border-white/5">
            <p className="text-rose-500 font-medium">Grup bulunamadı veya erişim yetkiniz yok.</p>
            <Link href="/app" className="mt-4 inline-block text-sm text-slate-400 hover:text-white underline">
              Panele dön
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
