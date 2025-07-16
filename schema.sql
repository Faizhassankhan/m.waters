-- 1. Create the data_profiles table
-- This table stores the core data profiles for each customer, including their name and custom settings.
CREATE TABLE IF NOT EXISTS public.data_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    bottle_price INTEGER DEFAULT 100,
    can_share_report BOOLEAN DEFAULT false,
    linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.data_profiles IS 'Stores customer data profiles and their settings.';

-- 2. Create the deliveries table
-- This table records each water bottle delivery, linked to a data profile.
CREATE TABLE IF NOT EXISTS public.deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.data_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bottles INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.deliveries IS 'Records each water delivery for a data profile.';
CREATE INDEX IF NOT EXISTS idx_deliveries_profile_id ON public.deliveries(profile_id);


-- 3. Create the invoices table
-- This table stores generated invoices, linked to a data profile.
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.data_profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    month TEXT NOT NULL,
    payment_method TEXT,
    recipient_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.invoices IS 'Stores generated invoices for data profiles.';
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON public.invoices(profile_id);


-- 4. Create a view to safely expose registered user data
-- This view provides a read-only list of registered users (customers) for the admin panel.
CREATE OR REPLACE VIEW public.users_public AS
SELECT id, email
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'customer';
COMMENT ON VIEW public.users_public IS 'A secure view to list registered customer emails.';


-- 5. Enable Row-Level Security (RLS) for all tables
-- This is a crucial security step. By default, it denies all access.
-- We will add specific policies next to grant access where needed.
ALTER TABLE public.data_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;


-- 6. Create RLS policies
-- These policies define who can see and do what with the data.

-- Policy: Admins can do anything on all tables.
CREATE POLICY "Allow admin full access on data_profiles" ON public.data_profiles FOR ALL TO authenticated USING ((auth.jwt()->>'user_email') = 'admin@gmail.com');
CREATE POLICY "Allow admin full access on deliveries" ON public.deliveries FOR ALL TO authenticated USING ((auth.jwt()->>'user_email') = 'admin@gmail.com');
CREATE POLICY "Allow admin full access on invoices" ON public.invoices FOR ALL TO authenticated USING ((auth.jwt()->>'user_email') = 'admin@gmail.com');

-- Policy: Logged-in customers can see their OWN linked profile data.
CREATE POLICY "Allow customer to see their own linked profile" ON public.data_profiles FOR SELECT TO authenticated USING (auth.uid() = linked_user_id);

-- Policy: Logged-in customers can see the deliveries associated with their OWN linked profile.
CREATE POLICY "Allow customer to see their own deliveries" ON public.deliveries FOR SELECT TO authenticated USING (
    profile_id IN (
        SELECT id FROM public.data_profiles WHERE auth.uid() = linked_user_id
    )
);

-- Policy: Allow authenticated users to see the public list of registered customers.
-- This is for the admin to populate the "link user" dropdown.
GRANT SELECT ON public.users_public TO authenticated;
