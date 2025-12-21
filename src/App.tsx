import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster as Sonner } from './components/ui/sonner';
import Auth from "./pages/Auth";
import Behavioral from "./pages/Behavioral";
import Divinity from "./pages/Divinity";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BottomNavBar from "./components/BottomNavBar";
import { AuthProvider } from './hooks/useAuth';

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showBottomNavBar = location.pathname !== "/auth";

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/behavioral" element={<Behavioral />} />
        <Route path="/divinity" element={<Divinity />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNavBar && <BottomNavBar />}
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
