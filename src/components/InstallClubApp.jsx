import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'

export default function InstallClubApp() {
  const [installEvent, setInstallEvent] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)
    const ready = event => { event.preventDefault(); setInstallEvent(event) }
    const done = () => { setInstalled(true); setInstallEvent(null); setNotice('Club app installed.') }
    window.addEventListener('beforeinstallprompt', ready)
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', done) }
  }, [])
  const install = async () => {
    if (!installEvent) { setHelpOpen(true); return }
    setInstallEvent(null)
    try { await installEvent.prompt(); const choice = await installEvent.userChoice; setNotice(choice.outcome === 'accepted' ? 'Installation requested. Follow your browser’s instructions.' : 'You can install the app whenever you’re ready.') }
    catch { setHelpOpen(true) }
  }
  return <section className="club-app-banner" aria-labelledby="club-app-title"><div className="app-monogram" aria-hidden="true">CBC<span>ON THE GO</span></div><div><p className="eyebrow">YOUR CLUB, ONE TAP AWAY</p><h2 id="club-app-title">Make room for your next game.</h2><p>Add CBC to your home screen for quick access to sessions and the member portal.</p><p role="status" className="app-install-status">{notice}</p></div><button className="btn btn-ghost" onClick={install} disabled={installed}>{installed ? 'App installed ✓' : 'Install club app ↗'}</button>{helpOpen && <Modal title="Keep CBC on your home screen" onClose={() => setHelpOpen(false)}><div className="install-guide"><p>No app store download is needed. Open this website in your device’s browser to add it.</p><h3>iPhone or iPad</h3><p>In Safari, open the Share menu and choose Add to Home Screen.</p><h3>Android or desktop</h3><p>Open Chrome or Edge’s browser menu and look for Install app or Add to Home screen. Installation is available only in supported browsers.</p><p>You can also bookmark the website for quick access.</p></div></Modal>}</section>
}
