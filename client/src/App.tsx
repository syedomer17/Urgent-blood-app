import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Router } from './pages/Router';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="bg-gray-50 min-h-screen">
          <Router />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </BrowserRouter>

  );
};


export default App;
