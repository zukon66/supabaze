'use server';

import { createSupabaseServer } from '@/lib/supabase/server';

export async function createGroupAction(formData: FormData) {
  const supabase = await createSupabaseServer();

  const groupName = String(formData.get('groupName') ?? '').trim();
  if (!groupName) {
    return { error: 'Grup adi bos olamaz.' };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Kullanici bulunamadi. Lutfen yeniden giris yap.' };
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: groupName,
      owner_id: user.id,
      created_by: user.id, // Keeping created_by for backward compatibility/audit if needed, or remove if scheam drops it. 
      // But for now, safe to send both if DB allows, or just owner_id if column is required.
      // Given the migration adds owner_id, I should send owner_id. 
      // Sending created_by is also fine if table still has it.
    })
    .select('id, name, invite_code')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Explicitly add the creator as 'admin' to group_members
  // We dropped the auto-trigger to handle this manually and robustly
  const { error: memberError } = await supabase
    .from('group_members')
    .upsert({
      group_id: data.id,
      user_id: user.id,
      role: 'admin'
    });

  if (memberError) {
    // If member insert fails, strictly we should rollback (delete group), 
    // but for now let's just return error. The user will be owner but not member?
    // Let's try to delete group if member insert fails to keep consistency.
    await supabase.from('groups').delete().eq('id', data.id);
    return { error: 'Grup olusturuldu fakat uyelik eklenirken hata oldu: ' + memberError.message };
  }

  return { data };
}
