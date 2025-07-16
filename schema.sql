-- This script contains the necessary SQL to set up your Supabase database.
-- Go to the SQL Editor in your Supabase project dashboard and run the queries below.

-- 1. Create data_profiles table
-- This table stores the main profiles for your customers, like their name and bottle price.
CREATE TABLE IF NOT EXISTS public.data_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    bottle_price numeric NULL DEFAULT 100,
    can_share_report boolean NULL DEFAULT false,
    linked_user_id uuid NULL,
    CONSTRAINT data_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT data_profiles_name_key UNIQUE (name),
    CONSTRAINT data_profiles_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.data_profiles ENABLE ROW LEVEL SECURITY;


-- 2. Create deliveries table
-- This table logs every water bottle delivery for each profile.
CREATE TABLE IF NOT EXISTS public.deliveries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL,
    date date NOT NULL,
    bottles integer NOT NULL,
    CONSTRAINT deliveries_pkey PRIMARY KEY (id),
    CONSTRAINT deliveries_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.data_profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;


-- 3. Create invoices table
-- This table stores all generated invoices.
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL,
    amount numeric NOT NULL,
    month text NOT NULL,
    payment_method text NULL,
    recipient_number text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT invoices_pkey PRIMARY KEY (id),
    CONSTRAINT invoices_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.data_profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;


-- 4. Create users_public view
-- This creates a secure view to see basic user information (like email) without exposing sensitive data.
CREATE OR REPLACE VIEW public.users_public AS
SELECT id, email
FROM auth.users;


-- 5. Create Policies to allow access
-- These policies define the security rules for who can access and modify the data.

-- Policies for data_profiles
CREATE POLICY "Allow admin to manage data_profiles" ON public.data_profiles
FOR ALL
TO authenticated
USING (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow linked customers to view their own profile" ON public.data_profiles
FOR SELECT
TO authenticated
USING (
  linked_user_id = auth.uid()
);

-- Policies for deliveries
CREATE POLICY "Allow admin to manage deliveries" ON public.deliveries
FOR ALL
TO authenticated
USING (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow linked customers to view their own deliveries" ON public.deliveries
FOR SELECT
TO authenticated
USING (
  profile_id IN (SELECT id FROM data_profiles WHERE linked_user_id = auth.uid())
);

-- Policies for invoices
CREATE POLICY "Allow admin to manage invoices" ON public.invoices
FOR ALL
TO authenticated
USING (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT user_metadata ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);

-- Policies for users_public view
CREATE POLICY "Allow authenticated users to see the public users list" ON public.users_public
FOR SELECT
TO authenticated
USING (true);
