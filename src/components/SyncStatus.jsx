import { useApp } from '../context/AppContext.jsx'

export default function SyncStatus() {
  const { syncStatus, pendingCount, retrySync, syncError, discardFailed } = useApp()
  const messages = {
    ready: 'RSVPs and scores are up to date across devices.',
    pending: `${pendingCount} change${pendingCount === 1 ? '' : 's'} saved on this device. Syncing…`,
    failed: pendingCount ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} could not sync. Your changes are kept on this device.` : 'Could not refresh the shared roster. Displayed information may be out of date.',
    offline: pendingCount ? `You’re offline. ${pendingCount} change${pendingCount === 1 ? '' : 's'} saved on this device, waiting to sync.` : 'You’re offline. Showing the last saved information.',
    loading: 'Checking the shared roster and scores…',
    unconfigured: 'Shared member services are not connected.',
  }
  return <div className="sync-banner" data-status={syncStatus}>
    <span role="status" aria-live="polite">{messages[syncStatus]} {syncError||''}</span>
    {syncStatus === 'failed' && <button className="btn btn-ghost btn-sm" onClick={retrySync}>Retry sync</button>}
  {syncStatus==='failed'&&pendingCount>0&&<button className="btn btn-ghost btn-sm" onClick={()=>{if(window.confirm('Discard failed local changes and reload the shared records?'))discardFailed()}}>Discard failed changes</button>}
  </div>
}
