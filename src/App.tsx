import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PortalLayout } from './components/PortalLayout'
import { Home } from './pages/Home'
import { Wholesale } from './pages/Wholesale'
import { Stations } from './pages/Stations'
import { Transport } from './pages/Transport'
import { About } from './pages/About'
import { Contacts } from './pages/Contacts'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
