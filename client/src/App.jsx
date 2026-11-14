import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import FinalsRouletteSection from './components/FinalsRouletteSection'
import Footer from './components/Footer'
import Vibebot from './components/VibebotSection'
import Waymark from './components/Waymark'
function App() {
  const [banner, setBanner] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("bot_added");
    if (status === "success") {
      setBanner({ type: "success", channel: params.get("channel") });
    } else if (status === "error") {
      setBanner({ type: "error", reason: params.get("reason") });
    }
    // Clear params from URL after reading
    if (status) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  return (
    <>
      {/* <Header/> */}
        {banner?.type === "success" && (
          <div className="bg-green-600 text-white p-4 text-center">
            ✅ Bot added to {banner.channel}'s channel! Try a redemption to test.
          </div>
        )}
        {banner?.type === "error" && (
          <div className="bg-red-600 text-white p-4 text-center">
            ❌ Something went wrong: {banner.reason}
          </div>
        )}
        <div className='flex-1 main'>
          <div className='story'>
            <p>Welcome to Deraingo.dev!</p>
            <p> I mainly plan to use this site as a display / frontend for my bots, and links to my other projects!</p>
          </div>
          <FinalsRouletteSection/>
          {/* <Vibebot/>
          <Waymark/> */}
        </div>
      <Footer/>
    </>
  )
}

export default App
