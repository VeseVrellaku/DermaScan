import { useState } from 'react'

function App() {
  const [showSupport, setShowSupport] = useState(false);

  const handleClick = () => {
    setShowSupport(true)
  }
  
  return (
    <>
      <div className='app'>
        <header className='header'>
          <div className='logo'>DermaScan</div>
        </header>

        <main>
          <section>
            <h1>Consult with the AI Doctor</h1>
            <p>Speech to Speech</p>
          </section>
          <button className='ai-button' onClick={}>
            Talk to the AI Doctor
          </button>
        </main>
      </div>
    </>
  )
}

export default App
