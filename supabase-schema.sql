-- ============================================================
-- KINK - Supabase Database Schema
-- Migrate from Firestore to Supabase PostgreSQL
-- ============================================================

-- 1. PROFILES (menggantikan {uid}_profile/data)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,  -- Firebase UID
  email TEXT,
  phone TEXT DEFAULT '-',
  toko TEXT DEFAULT 'KINK',
  default_category TEXT DEFAULT 'cat_bank_out',
  categories JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '{}'::jsonb,
  gemini_key TEXT,
  gemini_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REKAP HARIAN (menggantikan {uid}_rekap_harian/{tanggal})
CREATE TABLE IF NOT EXISTS rekap_harian (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,  -- 'YYYY-MM-DD'
  bank NUMERIC DEFAULT 0,
  kas NUMERIC DEFAULT 0,
  admin NUMERIC DEFAULT 0,
  acc NUMERIC DEFAULT 0,
  tarik NUMERIC DEFAULT 0,
  depo NUMERIC DEFAULT 0,
  sales NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tanggal)
);

-- 3. HISTORY (menggantikan {uid}_history)
CREATE TABLE IF NOT EXISTS history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tgl TEXT NOT NULL,         -- ISO timestamp string
  kat TEXT NOT NULL,         -- category name
  kat_id TEXT,               -- category id
  ket TEXT,                  -- keterangan
  amt NUMERIC DEFAULT 0,     -- amount
  fee NUMERIC DEFAULT 0,     -- admin fee
  bal_bank NUMERIC DEFAULT 0,-- saldo bank snapshot
  bal_kas NUMERIC DEFAULT 0, -- saldo kas snapshot
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_user_tgl ON history(user_id, tgl DESC);

-- 4. KASBON (menggantikan {uid}_kasbon)
CREATE TABLE IF NOT EXISTS kasbon (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nominal NUMERIC DEFAULT 0,
  tgl TEXT,                  -- tanggal lokal Indonesia
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kasbon_user ON kasbon(user_id);

-- 5. KONTAK (menggantikan {uid}_kontak)
CREATE TABLE IF NOT EXISTS kontak (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  wa TEXT DEFAULT '-',
  catatan TEXT DEFAULT '-',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kontak_user ON kontak(user_id);

-- ============================================================
-- FUNCTION: Set session user context dari Firebase UID
-- Dipanggil dari client setelah Firebase Auth berhasil login.
-- ============================================================
CREATE OR REPLACE FUNCTION set_user_context(uid TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.user_id', uid, false);
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_context TO anon;

-- ============================================================
-- ROW LEVEL SECURITY
-- Menggunakan session variable 'app.user_id' yang diset dari
-- client setelah login Firebase Auth.
-- Catatan: Untuk production sebaiknya migrasi ke Supabase Auth
-- atau gunakan Firebase JWT verification via edge functions.
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekap_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontak ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang tidak aman
DROP POLICY IF EXISTS "Allow all anon" ON profiles;
DROP POLICY IF EXISTS "Allow all anon" ON rekap_harian;
DROP POLICY IF EXISTS "Allow all anon" ON history;
DROP POLICY IF EXISTS "Allow all anon" ON kasbon;
DROP POLICY IF EXISTS "Allow all anon" ON kontak;

-- Policy untuk setiap tabel
CREATE POLICY "User can manage own profile" ON profiles
  FOR ALL USING (id = current_setting('app.user_id', true))
  WITH CHECK (id = current_setting('app.user_id', true));

CREATE POLICY "User can manage own rekap" ON rekap_harian
  FOR ALL USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "User can manage own history" ON history
  FOR ALL USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "User can manage own kasbon" ON kasbon
  FOR ALL USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "User can manage own kontak" ON kontak
  FOR ALL USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- ============================================================
-- ENABLE REALTIME (untuk fitur live update)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE rekap_harian;
ALTER PUBLICATION supabase_realtime ADD TABLE history;
ALTER PUBLICATION supabase_realtime ADD TABLE kasbon;
ALTER PUBLICATION supabase_realtime ADD TABLE kontak;
