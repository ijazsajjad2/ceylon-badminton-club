import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext.jsx'

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), user: { id: 'verified-id', username: 'keeper', playerId: 'p1', role: 'scorekeeper' } }))
vi.mock('./AuthContext.jsx', () => ({ useAuth: () => ({ user: mocks.user, isScorekeeper: true }) }))
vi.mock('../lib/supabase.js', () => {
  const client = {
    functions: { invoke: (name, {body}) => mocks.upsert(name, body) },
    auth: { getUser: async () => ({ data: { user: { id: 'verified-id' } }, error: null }) },
    from: (table) => {
      const query = { select: () => query, eq: () => query, order: () => query, range: () => query, then: (resolve) => resolve({ data: [], error: null }), upsert: (payload) => mocks.upsert(table, payload) }
      return query
    },
    channel: () => { const channel = { on: () => channel, subscribe: () => channel, unsubscribe: vi.fn() }; return channel },
  }
  return { hasSupabase: true, getSupabase: async () => client }
})
function Probe() {
  const app = useApp()
  if (localStorage.getItem('reset-probe')) return <output data-testid="reset-state">{app.matches.length}:{app.pendingCount}</output>
  return <><output data-testid="status">{app.syncStatus}:{app.pendingCount}</output><output data-testid="attendance">{String(!!app.going.p1)}</output><button onClick={() => app.rsvp('p1', true)}>RSVP</button><button onClick={app.retrySync}>Retry</button><button onClick={() => app.rsvp('p2', true)}>Other member</button></>
}
beforeEach(() => {
  cleanup(); localStorage.clear(); mocks.upsert.mockReset().mockResolvedValue({ error: null })
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})
describe('reliable RSVP saves', () => {
  it('discards pre-reset cached scores and score writes while keeping queued attendance', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    localStorage.setItem('reset-probe', 'true')
    localStorage.setItem('cbc.v4.matches', JSON.stringify([{ id: 'old-result' }]))
    localStorage.setItem('cbc.v4.sync-outbox-v1', JSON.stringify([
      { kind: 'match', actor: 'verified-id', status: 'pending', payload: { id: 'old-result' } },
      { kind: 'confirmation', actor: 'verified-id', status: 'pending', payload: { match_id: 'old-result' } },
      { kind: 'attendance', actor: 'verified-id', status: 'pending', payload: {} },
    ]))
    render(<AppProvider><Probe /></AppProvider>)
    expect(screen.getByTestId('reset-state').textContent).toBe('0:1')
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
  it('keeps an offline RSVP and flushes it on reconnect', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    render(<AppProvider><Probe /></AppProvider>)
    fireEvent.click(screen.getByText('RSVP'))
    expect(screen.getByTestId('status').textContent).toBe('offline:1')
    expect(JSON.parse(localStorage.getItem('cbc.v4.sync-outbox-v2'))).toHaveLength(1)
    expect(mocks.upsert).not.toHaveBeenCalled()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    fireEvent(window, new Event('online'))
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready:0'))
    expect(mocks.upsert).toHaveBeenCalledWith('cbc-club-ops', expect.objectContaining({ action: 'book', going: true }))
  })
  it('retains failed saves across reload and retries explicitly', async () => {
    mocks.upsert.mockResolvedValue({ error: { message: 'Network unavailable' } })
    const view = render(<AppProvider><Probe /></AppProvider>)
    fireEvent.click(screen.getByText('RSVP'))
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('failed:1'))
    expect(screen.getByTestId('attendance').textContent).toBe('false')
    view.unmount()
    render(<AppProvider><Probe /></AppProvider>)
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('failed:1'))
    mocks.upsert.mockResolvedValue({ error: null })
    fireEvent.click(screen.getByText('Retry'))
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready:0'))
    expect(JSON.parse(localStorage.getItem('cbc.v4.sync-outbox-v2'))).toEqual([])
  })
  it('does not queue another player’s attendance', () => {
    render(<AppProvider><Probe /></AppProvider>)
    fireEvent.click(screen.getByText('Other member'))
    expect(localStorage.getItem('cbc.v4.sync-outbox-v2')).toBeNull()
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
