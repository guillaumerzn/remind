import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  uuid: string
  nom: string
  prenom: string
  created_at: string
}

export type Appointment = {
  id: number
  titre: string
  contenu: string
  date: string
  user: string // uuid de l'utilisateur
  created_at: string
} 