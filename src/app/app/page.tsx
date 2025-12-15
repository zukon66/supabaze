import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';
import AppPageClient from './AppPageClient';

export default async function AppPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await ensureProfile(supabase, user);

  return <AppPageClient initialUser={{ id: user.id, email: user.email }} />;
}

async function ensureProfile(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, user: User) {
  const payload = { id: user.id, email: user.email };

  const { error: profileError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (profileError && profileError.code === '42P01') {
    await supabase.from('users').upsert(payload, { onConflict: 'id' });
  }
}
