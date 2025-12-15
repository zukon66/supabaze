-- BU SCRIPT TEK SEFERLİKTİR. MIGRATION OLARAK KAYDETMEYİN.
-- Bu kodu Supabase SQL Editor'un "New Query" kisminda calistirin.

DO $$
DECLARE
    target_user_email text := 'tuna.aydemir3333@gmail.com';
    target_user_id uuid;
BEGIN
    -- 1. E-posta adresinden kullanici ID'sini bul
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_user_email;
    
    -- 2. Eger kullanici bulunduysa, ona ait gruplari sil
    IF target_user_id IS NOT NULL THEN
        DELETE FROM public.groups 
        WHERE owner_id = target_user_id;
        
        RAISE NOTICE 'Kullanici % (ID: %) icin gruplar silindi.', target_user_email, target_user_id;
    ELSE
        RAISE NOTICE 'Kullanici bulunamadi: %', target_user_email;
    END IF;
END $$;
