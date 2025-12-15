'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type Project = {
  id: string;
  name: string;
  group_id: string;
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('projects')
      .select('id, name, group_id')
      .eq('id', projectId)
      .single();

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setProject(data);
    setLoading(false);
  }, [projectId]);

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
    if (!session || !projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProject();
  }, [session, projectId, fetchProject]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Checking session...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div>
          <Link href="/app" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            ← Panele don
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Loading project...</p>
          </div>
        ) : project ? (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm uppercase tracking-wide text-slate-500">Proje placeholder</p>
            <h1 className="text-3xl font-semibold text-slate-900">{project.name}</h1>
            <p className="mt-2 text-sm text-slate-700">Proje ID: {project.id}</p>
            <Link
              href={`/app/groups/${project.group_id}`}
              className="mt-4 inline-block text-sm font-medium text-slate-800 underline underline-offset-4"
            >
              Gruba git
            </Link>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-rose-600">Proje bulunamadi veya erisimin yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
