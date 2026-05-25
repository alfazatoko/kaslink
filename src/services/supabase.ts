import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Balances, HistoryItem, Kasbon, Kontak, UserProfile, Category, CustomColors } from '../types'

const supabaseUrl = 'https://aojionjzljbzvzspugdq.supabase.co'
const supabaseAnonKey = 'sb_publishable_IaBGwUtNugj3PLmu4ZAMOA_2yUacX33'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// DB Row Types (snake_case from PostgreSQL)
// ============================================================
interface ProfileRow {
  id: string
  email: string | null
  phone: string | null
  toko: string | null
  default_category: string | null
  categories: any
  colors: any
  gemini_key: string | null
  gemini_enabled: boolean | null
  created_at: string | null
}

interface RekapHarianRow {
  id: string
  user_id: string
  tanggal: string
  bank: number
  kas: number
  admin: number
  acc: number
  tarik: number
  depo: number
  sales: number
  created_at: string | null
}

interface HistoryRow {
  id: string
  user_id: string
  tgl: string
  kat: string
  kat_id: string | null
  ket: string | null
  amt: number
  fee: number | null
  bal_bank: number | null
  bal_kas: number | null
  created_at: string | null
}

interface KasbonRow {
  id: string
  user_id: string
  nama: string
  nominal: number
  tgl: string | null
  created_at: string | null
}

interface KontakRow {
  id: string
  user_id: string
  nama: string
  wa: string | null
  catatan: string | null
  created_at: string | null
}

// ============================================================
// Mapping: DB Row -> App Type
// ============================================================
const parseJsonField = <T>(value: any, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

const mapProfile = (row: ProfileRow): UserProfile => ({
  email: row.email || '',
  phone: row.phone || '-',
  toko: row.toko || 'KINK',
  defaultCategory: row.default_category || 'cat_bank_out',
  categories: parseJsonField<Category[]>(row.categories, []),
  colors: parseJsonField<CustomColors>(row.colors, {}),
  geminiKey: row.gemini_key || undefined,
  geminiEnabled: row.gemini_enabled || false,
})

const mapBalances = (row: RekapHarianRow): Balances => ({
  bank: Number(row.bank) || 0,
  kas: Number(row.kas) || 0,
  admin: Number(row.admin) || 0,
  acc: Number(row.acc) || 0,
  tarik: Number(row.tarik) || 0,
  depo: Number(row.depo) || 0,
  sales: Number(row.sales) || 0,
})

const mapHistory = (row: HistoryRow): HistoryItem => ({
  id: row.id,
  tgl: row.tgl,
  kat: row.kat,
  katId: row.kat_id || undefined,
  ket: row.ket || '',
  amt: Number(row.amt) || 0,
  fee: row.fee != null ? Number(row.fee) : undefined,
  balBank: row.bal_bank != null ? Number(row.bal_bank) : undefined,
  balKas: row.bal_kas != null ? Number(row.bal_kas) : undefined,
})

const mapKasbon = (row: KasbonRow): Kasbon => ({
  id: row.id,
  nama: row.nama,
  nominal: Number(row.nominal) || 0,
  tgl: row.tgl || '',
})

const mapKontak = (row: KontakRow): Kontak => ({
  id: row.id,
  nama: row.nama,
  wa: row.wa || '-',
  catatan: row.catatan || '-',
  createdAt: row.created_at || '',
})

// ============================================================
// Mapping: App Type -> DB Insert (snake_case)
// ============================================================
const profileToRow = (uid: string, profile: Partial<UserProfile>) => ({
  id: uid,
  email: profile.email,
  phone: profile.phone,
  toko: profile.toko,
  default_category: profile.defaultCategory,
  categories: profile.categories ?? undefined,
  colors: profile.colors ?? undefined,
  gemini_key: profile.geminiKey,
  gemini_enabled: profile.geminiEnabled,
})

const balancesToRow = (uid: string, tanggal: string, balances: Balances) => ({
  user_id: uid,
  tanggal,
  bank: balances.bank,
  kas: balances.kas,
  admin: balances.admin,
  acc: balances.acc,
  tarik: balances.tarik,
  depo: balances.depo,
  sales: balances.sales,
})

const historyToRow = (uid: string, item: Partial<HistoryItem>) => ({
  user_id: uid,
  tgl: item.tgl,
  kat: item.kat,
  kat_id: item.katId,
  ket: item.ket,
  amt: item.amt,
  fee: item.fee,
  bal_bank: item.balBank,
  bal_kas: item.balKas,
})

const kasbonToRow = (uid: string, item: Partial<Kasbon>) => ({
  user_id: uid,
  nama: item.nama,
  nominal: item.nominal,
  tgl: item.tgl,
})

const kontakToRow = (uid: string, item: Partial<Kontak>) => ({
  user_id: uid,
  nama: item.nama,
  wa: item.wa,
  catatan: item.catatan,
})

// ============================================================
// Operations: PROFILES
// ============================================================
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export const upsertProfile = async (uid: string, profile: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .upsert(profileToRow(uid, profile) as any)
  if (error) throw error
}

// ============================================================
// Operations: REKAP HARIAN
// ============================================================
export const getRekapHarian = async (uid: string, tanggal: string): Promise<Balances | null> => {
  const { data, error } = await supabase
    .from('rekap_harian')
    .select('*')
    .eq('user_id', uid)
    .eq('tanggal', tanggal)
    .maybeSingle()
  if (error || !data) return null
  return mapBalances(data as RekapHarianRow)
}

export const upsertRekapHarian = async (uid: string, tanggal: string, balances: Balances) => {
  const { error } = await supabase
    .from('rekap_harian')
    .upsert(balancesToRow(uid, tanggal, balances) as any, {
      onConflict: 'user_id,tanggal'
    })
  if (error) throw error
}

// ============================================================
// Operations: HISTORY
// ============================================================
export const getHistory = async (uid: string, startOfToday?: string, maxResults: number = 500): Promise<HistoryItem[]> => {
  let query = supabase
    .from('history')
    .select('*')
    .eq('user_id', uid)
    .order('tgl', { ascending: false })
    .limit(maxResults)
  
  if (startOfToday) {
    query = query.gte('tgl', startOfToday)
  }
  
  const { data, error } = await query
  if (error) throw error
  return (data as HistoryRow[]).map(mapHistory)
}

export const addHistory = async (uid: string, item: Partial<HistoryItem>) => {
  const { error } = await supabase
    .from('history')
    .insert(historyToRow(uid, item) as any)
  if (error) throw error
}

export const deleteHistory = async (id: string) => {
  const { error } = await supabase
    .from('history')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const deleteHistoryByUser = async (uid: string) => {
  const { error } = await supabase
    .from('history')
    .delete()
    .eq('user_id', uid)
  if (error) throw error
}

export const updateHistory = async (id: string, item: Partial<HistoryItem>) => {
  const { error } = await supabase
    .from('history')
    .update({
      kat: item.kat,
      kat_id: item.katId,
      ket: item.ket,
      amt: item.amt,
      fee: item.fee,
    } as any)
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// Operations: KASBON
// ============================================================
export const getKasbon = async (uid: string): Promise<Kasbon[]> => {
  const { data, error } = await supabase
    .from('kasbon')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as KasbonRow[]).map(mapKasbon)
}

export const addKasbon = async (uid: string, item: Partial<Kasbon>) => {
  const { error } = await supabase
    .from('kasbon')
    .insert(kasbonToRow(uid, item) as any)
  if (error) throw error
}

export const deleteKasbon = async (id: string) => {
  const { error } = await supabase
    .from('kasbon')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const deleteKasbonByUser = async (uid: string) => {
  const { error } = await supabase
    .from('kasbon')
    .delete()
    .eq('user_id', uid)
  if (error) throw error
}

// ============================================================
// Operations: KONTAK
// ============================================================
export const getKontak = async (uid: string): Promise<Kontak[]> => {
  const { data, error } = await supabase
    .from('kontak')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as KontakRow[]).map(mapKontak)
}

export const addKontak = async (uid: string, item: Partial<Kontak>) => {
  const { error } = await supabase
    .from('kontak')
    .insert(kontakToRow(uid, item) as any)
  if (error) throw error
}

export const deleteKontak = async (id: string) => {
  const { error } = await supabase
    .from('kontak')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const deleteKontakByUser = async (uid: string) => {
  const { error } = await supabase
    .from('kontak')
    .delete()
    .eq('user_id', uid)
  if (error) throw error
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
type ChangeHandler = (payload: any) => void

// ============================================================
// SESSION CONTEXT (untuk RLS)
// Panggil setelah Firebase Auth login untuk mengatur user context
// yang digunakan oleh RLS policies.
// ============================================================
export const setUserContext = async (uid: string) => {
  await supabase.rpc('set_user_context', { uid });
};

export const subscribeProfile = (uid: string, onChange: (profile: UserProfile | null) => void) => {
  const channel = supabase
    .channel(`profile-${uid}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${uid}`
      },
      (payload: any) => {
        if (payload.new) {
          onChange(mapProfile(payload.new as ProfileRow))
        } else {
          onChange(null)
        }
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export const subscribeBalances = (uid: string, tanggal: string, onChange: (balances: Balances | null) => void) => {
  const channel = supabase
    .channel(`rekap-${uid}-${tanggal}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'rekap_harian',
        filter: `user_id=eq.${uid}`
      },
      (payload: any) => {
        if (payload.new && (payload.new as RekapHarianRow).tanggal === tanggal) {
          onChange(mapBalances(payload.new as RekapHarianRow))
        }
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export const subscribeHistory = (uid: string, onChange: (items: HistoryItem[]) => void) => {
  const channel = supabase
    .channel(`history-${uid}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'history',
        filter: `user_id=eq.${uid}`
      },
      (payload: any) => {
        onChange([])
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export const subscribeKasbon = (uid: string, onChange: (items: Kasbon[]) => void) => {
  const channel = supabase
    .channel(`kasbon-${uid}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'kasbon',
        filter: `user_id=eq.${uid}`
      },
      () => {
        onChange([])
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export const subscribeKontak = (uid: string, onChange: (items: Kontak[]) => void) => {
  const channel = supabase
    .channel(`kontak-${uid}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'kontak',
        filter: `user_id=eq.${uid}`
      },
      () => {
        onChange([])
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
