import {Component} from 'react'
import {getSupabase} from '../lib/supabase.js'
export default class ErrorBoundary extends Component {
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(){getSupabase().then(sb=>sb?.functions.invoke('cbc-club-ops',{body:{action:'report-error',component:'App'}})).catch(()=>{})}
 render(){return this.state.failed?<main className="club-section" role="alert"><h1>Something went wrong</h1><p>Your saved club records are safe. Reload to try again.</p><button className="btn" onClick={()=>window.location.reload()}>Reload</button></main>:this.props.children}
}
