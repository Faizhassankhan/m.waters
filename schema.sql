-- Create the data_profiles table to store user information and settings.
CREATE TABLE
  data_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL UNIQUE,
    bottle_price NUMERIC DEFAULT 100,
    can_share_report BOOLEAN DEFAULT FALSE,
    linked_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL
  );

-- Create the deliveries table to log each water delivery.
CREATE TABLE
  deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    profile_id UUID NOT NULL REFERENCES data_profiles (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bottles INTEGER NOT NULL
  );

-- Create the invoices table to store generated invoice records.
CREATE TABLE
  invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    profile_id UUID NOT NULL REFERENCES data_profiles (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC NOT NULL,
    month TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    recipient_number TEXT NOT NULL
  );

-- Create a view to safely expose registered user emails to the admin.
CREATE VIEW
  users_public AS
SELECT
  id,
  email
FROM
  auth.users
WHERE
  raw_user_meta_data ->> 'user_type' = 'customer';

-- Enable Row Level Security (RLS) for all tables.
ALTER TABLE data_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Define policies for data_profiles.
-- Admins can do anything.
CREATE POLICY "Allow admin full access on data_profiles" ON data_profiles FOR ALL TO authenticated USING (
  (
    SELECT
      raw_user_meta_data ->> 'user_type'
    FROM
      auth.users
    WHERE
      id = auth.uid ()
  ) = 'admin'
);

-- Authenticated users can see their own linked profile.
CREATE POLICY "Allow users to see their own linked profile" ON data_profiles FOR
SELECT
  TO authenticated USING (linked_user_id = auth.uid ());

-- Define policies for deliveries.
-- Admins can do anything.
CREATE POLICY "Allow admin full access on deliveries" ON deliveries FOR ALL TO authenticated USING (
  (
    SELECT
      raw_user_meta_data ->> 'user_type'
    FROM
      auth.users
    WHERE
      id = auth.uid ()
  ) = 'admin'
);

-- Users can see deliveries for their linked profile.
CREATE POLICY "Allow users to see deliveries for their own profile" ON deliveries FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        linked_user_id
      FROM
        data_profiles
      WHERE
        id = profile_id
    ) = auth.uid ()
  );

-- Define policies for invoices.
-- Admins can do anything.
CREATE POLICY "Allow admin full access on invoices" ON invoices FOR ALL TO authenticated USING (
  (
    SELECT
      raw_user_meta_data ->> 'user_type'
    FROM
      auth.users
    WHERE
      id = auth.uid ()
  ) = 'admin'
);

-- Grant usage permission on the public schema to the authenticated role.
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select permission on the users_public view to the authenticated role.
GRANT
SELECT
  ON users_public TO authenticated;
