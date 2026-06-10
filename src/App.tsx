import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Hero } from './components/sections/Hero'
import { Directions } from './components/sections/Directions'
import { Wholesale } from './components/sections/Wholesale'
import { Stations } from './components/sections/Stations'
import { Transport } from './components/sections/Transport'
import { About } from './components/sections/About'
import { Contacts } from './components/sections/Contacts'

function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Header />
      <main>
        <Hero />
        <Directions />
        <Wholesale />
        <Stations />
        <Transport />
        <About />
        <Contacts />
      </main>
      <Footer />
    </div>
  )
}

export default App
