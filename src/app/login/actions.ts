'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

type ActionState = {
  error?: string | null;
};

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServer();

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'E-posta ve sifre gerekli.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/app');
}
