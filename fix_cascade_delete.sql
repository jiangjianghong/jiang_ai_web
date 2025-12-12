
-- Fix Foreign Key Constraints to allow Cascade Delete
-- 修复外键约束以允许级联删除

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. user_profiles
    FOR r IN
        SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_profiles'::regclass AND confrelid = 'auth.users'::regclass AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.user_profiles DROP CONSTRAINT ' || r.conname;
        EXECUTE 'ALTER TABLE public.user_profiles ADD CONSTRAINT ' || r.conname || ' FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END LOOP;

    -- 2. user_settings
    FOR r IN
        SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_settings'::regclass AND confrelid = 'auth.users'::regclass AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.user_settings DROP CONSTRAINT ' || r.conname;
        EXECUTE 'ALTER TABLE public.user_settings ADD CONSTRAINT ' || r.conname || ' FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END LOOP;

    -- 3. user_websites
    FOR r IN
        SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_websites'::regclass AND confrelid = 'auth.users'::regclass AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.user_websites DROP CONSTRAINT ' || r.conname;
        EXECUTE 'ALTER TABLE public.user_websites ADD CONSTRAINT ' || r.conname || ' FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END LOOP;

    -- 4. user_stats
    FOR r IN
        SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_stats'::regclass AND confrelid = 'auth.users'::regclass AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.user_stats DROP CONSTRAINT ' || r.conname;
        EXECUTE 'ALTER TABLE public.user_stats ADD CONSTRAINT ' || r.conname || ' FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END LOOP;
    
END $$;
