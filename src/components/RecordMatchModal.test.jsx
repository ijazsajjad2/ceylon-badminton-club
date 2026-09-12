import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecordMatchModal from './RecordMatchModal.jsx'
const mock = vi.hoisted(() => ({ record: vi.fn(async () => ({ ok: true, pending: true })) }))
vi.mock('../context/AppContext.jsx', () => ({ useApp: () => ({ players: [{id:'p1',name:'One'},{id:'p2',name:'Two'},{id:'p3',name:'Three'},{id:'p4',name:'Four'}], recordMatch: mock.record, pushToast: vi.fn(), sessions: [{id:'s',date:'2026-09-09',time:'20:00–22:00'}], currentSession: {id:'s',date:'2026-09-09',time:'20:00–22:00'} }) }))
it('records a one-set game and supports undo without losing the selected teams', async () => {
  const close = vi.fn()
  render(<RecordMatchModal onClose={close} />)
  for (const [label,id] of [['Team A · player 1','p1'],['Team A · player 2','p2'],['Team B · player 1','p3'],['Team B · player 2','p4']]) fireEvent.change(screen.getByLabelText(label), { target: { value: id } })
  fireEvent.change(screen.getByLabelText('Set 1 Team A score'), { target: { value: '21' } })
  fireEvent.change(screen.getByLabelText('Set 1 Team B score'), { target: { value: '18' } })
  fireEvent.click(screen.getByLabelText('Add Team B set 1'))
  expect(screen.getByLabelText('Set 1 Team B score').value).toBe('19')
  fireEvent.click(screen.getByText('Undo score change'))
  expect(screen.getByLabelText('Set 1 Team B score').value).toBe('18')
  fireEvent.click(screen.getByText('Save result'))
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
  expect(mock.record).toHaveBeenCalledWith(expect.objectContaining({ sets:[[21,18]],winner:'A',teamA:['p1','p2'],teamB:['p3','p4'] }))
})
