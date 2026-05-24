import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import { TooltipProvider } from './components/ui/tooltip';
import { Toaster as Sonner } from './components/ui/sonner';
import Auth from "./pages/Auth";
import Anima from "./pages/Anima";
import Nurturing from "./pages/Nurturing";
import Behavioral from "./pages/Behavioral";
import Divinity from "./pages/Divinity";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";
import BottomNavBar from "./components/BottomNavBar";
import { AuthProvider } from './hooks/useAuth';
import { SwipeNavigation } from './components/SwipeNavigation';

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showBottomNavBar = location.pathname !== "/auth" && location.pathname !== "/anima" && location.pathname !== "/nurturing";

  return (
    <AuthProvider>
      <SwipeNavigation>
        <Routes>
          <Route path="/" element={<Behavioral />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/feelings" element={<Index />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/anima" element={<Anima />} />
          <Route path="/nurturing" element={<Nurturing />} />
          <Route path="/behavioral" element={<Behavioral />} />
          <Route path="/divinity" element={<Divinity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SwipeNavigation>
      {showBottomNavBar && <BottomNavBar />}
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
