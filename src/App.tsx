import { Route, Routes } from 'react-router-dom'
import BugReportWidget from './components/BugReportWidget'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import PokemonDetail from './pages/PokemonDetail'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Admin from './pages/Admin'
import AdminAddCard from './pages/AdminAddCard'
import AdminBulkAddCards from './pages/AdminBulkAddCards'
import RequireAdmin from './auth/RequireAdmin'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="/admin/cards/new" element={<AdminAddCard />} />
        <Route path="/admin/cards/bulk" element={<AdminBulkAddCards />} />
      </Routes>
      <BugReportWidget />
    </>
  )
}

export default App
