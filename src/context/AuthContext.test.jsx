import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext.jsx'
vi.mock('../lib/supabase.js', () => ({ hasSupabase: false, getSupabase: async () => null }))
function Probe() { const auth = useAuth(); return <output>{auth.user ? 'member' : 'guest'}:{String(auth.isScorekeeper)}</output> }
it('does not trust a forged legacy session or scorekeeper flag', () => {
  localStorage.setItem('cbc.session', JSON.stringify({ username:'ijaz',playerId:'p15',role:'scorekeeper',isScorekeeper:true }))
  render(<AuthProvider><Probe /></AuthProvider>)
  expect(screen.getByText('guest:false')).toBeTruthy()
  expect(localStorage.getItem('cbc.session')).toBeNull()
})
