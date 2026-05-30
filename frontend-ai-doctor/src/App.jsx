import { useState } from 'react'
import './App.css'
import LiveKitModal from './components/LiveKitModal';

function App() {
  const [showSupport, setShowSupport] = useState(false);

  const handleSupportClick = () => {
    setShowSupport(true)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Derma Scan</div>
      </header>

      <main>
        <section className="hero">
          <h1>Content</h1>
        </section>

        <button className="support-button" onClick={handleSupportClick}>
          Consult with AI Doctor
        </button>
      </main>

      {showSupport && <LiveKitModal setShowSupport={setShowSupport}/>}
    </div>
  )
}

export default App