import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import {beforeEach,it,expect,vi} from 'vitest'
import ClubOperations from './ClubOperations.jsx'
const mocks=vi.hoisted(()=>({invoke:vi.fn()}))
vi.mock('../context/AuthContext.jsx',()=>({useAuth:()=>({user:{id:'u1',playerId:'p1'},isScorekeeper:false})}))
vi.mock('../context/AppContext.jsx',()=>({useApp:()=>({playerById:{}})}))
vi.mock('../lib/supabase.js',()=>({getSupabase:async()=>({functions:{invoke:mocks.invoke},from:table=>({select:async()=>({data:table==='club_sessions'?[{date:'2099-01-01',starts_at:'2099-01-01T17:00Z',ends_at:'2099-01-01T19:00Z',capacity:4,cancellation_hours:2,venue:'Club'}]:table==='attendance'?Array.from({length:4},(_,i)=>({player_id:`p${i+2}`,session_date:'2099-01-01',booking_status:'confirmed'})):[],error:null})})})}))
beforeEach(()=>{cleanup();mocks.invoke.mockReset().mockResolvedValue({data:{data:{status:'waitlisted'}},error:null})})
it('shows a full session as a waiting-list booking and sends only the member action',async()=>{
 render(<ClubOperations/>);
 fireEvent.click(await screen.findByRole('button',{name:'Join waiting list'}))
 await waitFor(()=>expect(mocks.invoke).toHaveBeenCalledWith('cbc-club-ops',{body:{action:'book',date:'2099-01-01',going:true}}))
 expect(screen.queryByText('Session settings')).not.toBeInTheDocument()
})
it('uses English without a language switch',async()=>{
 render(<ClubOperations/>);await screen.findByRole('button',{name:'Join waiting list'})
 expect(screen.getByText('Your club, organised.').closest('section')).toHaveAttribute('dir','ltr')
 expect(screen.queryByRole('button',{name:'العربية'})).not.toBeInTheDocument()
})
