import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UrlList from './pages/UrlList';
import RedirectPage from './pages/RedirectPage';


const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/urls"
          element={
            <ProtectedRoute>
              <UrlList />
            </ProtectedRoute>
          }
        />
        <Route path="/r/:shortId" element={<RedirectPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;