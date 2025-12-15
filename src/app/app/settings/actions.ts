'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function deleteAccountAction() {
    const supabase = await createSupabaseServer();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
    }

    // 2. Initialize Admin Client
    // Service Role Key is required for deleting users from Auth system
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
        return { error: 'Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.' };
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 3. Delete User
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return { error: 'Hesap silinirken bir hata oluştu: ' + deleteError.message };
    }

    // 4. Return success (Client will handle redirect)
    // Note: We cannot redirect here easily because we might want to clear client cookies too, 
    // but deleting user invalidates session anyway.
    return { success: true };
}
