-- Drop existing objects to ensure a clean slate
DROP POLICY IF EXISTS "Allow admin full access on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow users to see deliveries for their own profile" ON public.deliveries;
DROP POLICY IF EXISTS "Allow admin full access on deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow users to see their own linked profile" ON public.data_profiles;
DROP POLICY IF EXISTS "Allow admin full access on data_profiles" ON public.data_profiles;

DROP VIEW IF EXISTS public.users_public;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.deliveries;
DROP TABLE IF EXISTS public.data_profiles;


-- Create the data_profiles table to store user information and settings.
CREATE TABLE
  public.data_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL UNIQUE,
    bottle_price NUMERIC DEFAULT 100,
    can_share_report BOOLEAN DEFAULT FALSE,
    linked_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL
  );

-- Create the deliveries table to log each water delivery.
CREATE TABLE
  public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    profile_id UUID NOT NULL REFERENCES public.data_profiles (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bottles INTEGER NOT NULL
  );

-- Create the invoices table to store generated invoice records.
CREATE TABLE
  public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    profile_id UUID NOT NULL REFERENCES public.data_profiles (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC NOT NULL,
    month TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    recipient_number TEXT NOT NULL
  );

-- Create a view to safely expose registered user emails to the admin.
CREATE VIEW
  public.users_public AS
SELECT
  id,
  email
FROM
  auth.users
WHERE
  raw_user_meta_data ->> 'user_type' = 'customer';


-- Enable Row Level Security (RLS) for all tables.
ALTER TABLE public.data_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;


-- Define policies for data_profiles.
CREATE POLICY "Allow admin full access on data_profiles" ON public.data_profiles FOR ALL TO authenticated USING (
  ( (SELECT auth.jwt() ->> 'user_metadata')::jsonb ->> 'user_type' ) = 'admin'
);
CREATE POLICY "Allow users to see their own linked profile" ON public.data_profiles FOR SELECT TO authenticated USING (linked_user_id = auth.uid ());


-- Define policies for deliveries.
CREATE POLICY "Allow admin full access on deliveries" ON public.deliveries FOR ALL TO authenticated USING (
  ( (SELECT auth.jwt() ->> 'user_metadata')::jsonb ->> 'user_type' ) = 'admin'
);
CREATE POLICY "Allow users to see deliveries for their own profile" ON public.deliveries FOR SELECT TO authenticated USING (
  (
    SELECT
      d.linked_user_id
    FROM
      public.data_profiles d
    WHERE
      d.id = profile_id
  ) = auth.uid ()
);


-- Define policies for invoices.
CREATE POLICY "Allow admin full access on invoices" ON public.invoices FOR ALL TO authenticated USING (
  ( (SELECT auth.jwt() ->> 'user_metadata')::jsonb ->> 'user_type' ) = 'admin'
);


-- Grant usage and select permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users_public TO authenticated;

    