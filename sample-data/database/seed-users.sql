-- ==============================================================================
-- SAMPLE USERS SEED DATA
-- ==============================================================================
-- Note: In production, users will be managed by Outseta
-- These test users are for local development only
-- ==============================================================================

-- Sample test users
INSERT INTO public.users (id, email, name, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'test.radiologist@example.com',
    'Dr. Test Radiologist',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'demo.user@example.com',
    'Dr. Demo User',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'admin@example.com',
    'Dr. Admin User',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
  id,
  email,
  name,
  created_at
FROM public.users
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
