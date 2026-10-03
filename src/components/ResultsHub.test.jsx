import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ResultsHub from './ResultsHub.jsx'
import Leaderboard from '../pages/Leaderboard.jsx'

const state = vi.hoisted(() => ({ value:null, scorekeeper:false }))
vi.mock('../context/AuthContext.jsx', () => ({useAuth:()=>({isScorekeeper:state.scorekeeper})}))
vi.mock('../context/AppContext.jsx', () => ({useApp:()=>state.value}))
const players = [{id:'a',name:'Amal'}, {id:'b',name:'Bimal'}, {id:'c',name:'Chamal'}, {id:'d',name:'Dilan'}]
const match = {id:'one',sessionId:null,date:'2025-01-01',time:'20:00',court:1,type:'doubles',teamA:['a','b'],teamB:['c','d'],sets:[[21,19]],winner:'A',live:false}
beforeEach(() => {
  cleanup(); state.scorekeeper=false
  state.value={players,playerById:Object.fromEntries(players.map(p=>[p.id,p])),matches:[match,{...match,id:'two',date:'2026-07-08',type:'singles',teamA:['c'],teamB:['a'],sets:[[21,15]]}],syncStatus:'ready',retrySync:vi.fn(),sessions:[{date:'2026-07-08',time:'20:00–22:00'}],currentSession:{date:'2026-07-08',time:'20:00–22:00'}}
})
describe('results hub', () => {
  it('switches between recorded days and cumulative rankings, then drills into a player’s scores', () => {
    render(<ResultsHub/>)
    expect(screen.getByLabelText('Playing day').value).toBe('2026-07-08')
    fireEvent.change(screen.getByLabelText('Playing day'),{target:{value:'2025-01-01'}})
    let row=screen.getByRole('button',{name:'Amal',exact:true}).closest('tr')
    expect(within(row).getByText('20.5')).toBeTruthy()
    fireEvent.click(screen.getByRole('button',{name:'Full leaderboard'}))
    row=screen.getByRole('button',{name:'Amal',exact:true}).closest('tr')
    expect(within(row).getByText('28')).toBeTruthy()
    fireEvent.click(screen.getByRole('button',{name:'Amal',exact:true}))
    expect(screen.getByLabelText('Player').value).toBe('a')
    expect(screen.getByRole('heading',{name:'Amal’s matches'})).toBeTruthy()
    expect(screen.getByText('2 of 2 matches')).toBeTruthy()
    expect(screen.getByText('21–19')).toBeTruthy()
    expect(screen.getByText('21–15')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Playing day'),{target:{value:'2025-01-01'}})
    expect(screen.getByText('1 of 1 matches')).toBeTruthy()
  })
  it('filters formats without renumbering search results and offers a clear empty state', () => {
    render(<ResultsHub/>)
    fireEvent.click(screen.getByRole('button',{name:'Full leaderboard'}))
    fireEvent.change(screen.getByLabelText('Find a player'),{target:{value:'Amal'}})
    expect(screen.getByRole('button',{name:'Amal',exact:true}).closest('tr').firstChild.textContent).toBe('2')
    fireEvent.change(screen.getByLabelText('Find a player'),{target:{value:'Nobody'}})
    expect(screen.getByText('No players match that name.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button',{name:'Daily leaderboard'}))
    fireEvent.change(screen.getByLabelText('Match format'),{target:{value:'doubles'}})
    expect(screen.getByText('No completed matches in this view yet.')).toBeTruthy()
  })
  it('labels stale results and provides retry without pretending there are no historical games', () => {
    state.value.syncStatus='failed'
    render(<ResultsHub/>)
    expect(screen.getByText(/The latest results could not be verified/).textContent).toContain('latest results could not be verified')
    fireEvent.click(screen.getByRole('button',{name:'Retry sync'}))
    expect(state.value.retrySync).toHaveBeenCalledOnce()
  })
})



describe('member leaderboard controls', () => {
  it('keeps recording restricted to the scorekeeper and opens the existing result form', () => {
    const member = render(<Leaderboard/>)
    expect(screen.queryByRole('button',{name:'Record a result +'})).toBeNull()
    member.unmount()
    state.scorekeeper=true
    render(<Leaderboard/>)
    fireEvent.click(screen.getByRole('button',{name:'Record a result +'}))
    expect(screen.getByRole('dialog',{name:'Record a result'})).toBeTruthy()
    expect(screen.getByLabelText('Date').value).toBe('2026-07-08')
  })
})
