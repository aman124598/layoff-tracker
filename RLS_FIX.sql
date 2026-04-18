-- SUPABASE ROW-LEVEL SECURITY (RLS) FIX
-- This file contains SQL to fix the RLS policy blocking data inserts

-- OPTION 1: DISABLE RLS (FASTEST - Development Only)
-- Run this query in Supabase SQL Editor:
ALTER TABLE layoffs DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled:
SELECT * FROM pg_tables WHERE tablename = 'layoffs';

-----------------------------------------------------------

-- OPTION 2: CREATE PROPER RLS POLICY (Production Recommended)
-- If you want to keep RLS enabled, create a policy for anonymous users:

-- Enable RLS
ALTER TABLE layoffs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous users) to SELECT (read)
CREATE POLICY "Allow public read access" ON public.layoffs
    FOR SELECT
    USING (true);

-- Allow anyone (anonymous users) to INSERT (write)
CREATE POLICY "Allow public insert access" ON public.layoffs
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone (anonymous users) to UPDATE
CREATE POLICY "Allow public update access" ON public.layoffs
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-----------------------------------------------------------

-- OPTION 3: USE SERVICE ROLE KEY
-- Alternatively, you can use a Service Role Key instead of Anon Key
-- Go to Supabase Settings → API → Service Role Key
-- Copy the key and update in your .env file:
-- SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
-- Then update the db.js to use this key

-----------------------------------------------------------

-- VERIFY THE FIX
-- After running the SQL above, you can verify:

-- Check if RLS is disabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'layoffs';

-- Should return: layoffs | f (false = RLS disabled)

-- Check existing policies (if using Option 2)
SELECT * FROM pg_policies 
WHERE tablename = 'layoffs';

-----------------------------------------------------------

-- NEXT STEPS:
-- 1. Run one of the options above in your Supabase SQL Editor
-- 2. Restart the backend server: npm start
-- 3. Trigger a sync: curl -X POST http://localhost:5000/api/layoffs/sync
-- 4. Check the app - data should now appear!
