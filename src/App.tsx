
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext"; 
import { Loader2 } from 'lucide-react'; 


import Index from "./pages/Index";
import ReportIssue from "./pages/ReportIssue";
import Organizations from "./pages/Organizations";
import Volunteer from "./pages/Volunteer";
import Donate from "./pages/Donate";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import HowItWorks from "./pages/HowItWorks";
import SuperAdminPanel from "./pages/SuperAdminPanel"; 

const queryClient = new QueryClient();


const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="ml-4 text-muted-foreground">Loading User...</span>
          </div>
      );
    }

    if (!user) {
      console.log("RequireAuth: No user found, redirecting to login.");
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};


const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <span className="ml-4 text-muted-foreground">Verifying Access...</span>
        </div>
    );
  }

  
  if (userRole !== 'superadmin') {
    console.warn(`RequireAdmin: Access denied. User role is '${userRole}', required 'superadmin'. Redirecting home.`);
    return <Navigate to="/" replace />;
  }

  
  return <>{children}</>;
};



const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Provides user, role, loading state */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/organizations" element={<Organizations />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Login />} />

                {/* Protected Routes (Require Login) */}
                <Route path="/report" element={<RequireAuth><ReportIssue /></RequireAuth>} />
                <Route path="/volunteer" element={<RequireAuth><Volunteer /></RequireAuth>} />
                <Route path="/donate" element={<RequireAuth><Donate /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

                {/* Admin Route (Requires Login + 'superadmin' Role) */}
                 <Route path="/superadmin/verify-ngos" element={
                    <RequireAuth> {/* Ensures user is loaded before admin check */}
                         <RequireAdmin>
                             <SuperAdminPanel />
                         </RequireAdmin>
                     </RequireAuth>
                 } />

                {/* Static/Info Routes */}
                <Route path="/issues/:id" element={<NotFound />} />
                <Route path="/organizations/:id" element={<NotFound />} />
                <Route path="/map" element={<NotFound />} />
                <Route path="/about" element={<NotFound />} />
                <Route path="/contact" element={<NotFound />} />
                <Route path="/privacy-policy" element={<NotFound />} />
                <Route path="/terms-of-service" element={<NotFound />} />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;