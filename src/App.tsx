import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CRMLayout } from "@/components/CRMLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import LeadManager from "./pages/LeadManager";
import Customers from "./pages/Customers";
import Quotations from "./pages/Quotations";
import WhatsAppMessaging from "./pages/WhatsAppMessaging";
import PostSales from "./pages/PostSales";
import CallLogs from "./pages/CallLogs";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import BirthdayList from "./pages/BirthdayList";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import Pricing from "./pages/Pricing";
import Deals from "./pages/Deals";
import Activities from "./pages/Activities";
import Helpdesk from "./pages/Helpdesk";
import Attendance from "./pages/Attendance";
import Holidays from "./pages/Holidays";
import FileManager from "./pages/FileManager";
import OwnerPanel from "./pages/OwnerPanel";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <CRMLayout>{children}</CRMLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><LeadManager /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
            <Route path="/post-sales" element={<ProtectedRoute><PostSales /></ProtectedRoute>} />
            <Route path="/calls" element={<ProtectedRoute><CallLogs /></ProtectedRoute>} />
            <Route path="/helpdesk" element={<ProtectedRoute><Helpdesk /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
            <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/birthdays" element={<ProtectedRoute><BirthdayList /></ProtectedRoute>} />
            <Route path="/messaging/whatsapp" element={<ProtectedRoute><WhatsAppMessaging /></ProtectedRoute>} />
            <Route path="/messaging/bulk" element={<ProtectedRoute><WhatsAppMessaging /></ProtectedRoute>} />
            <Route path="/messaging/templates" element={<ProtectedRoute><WhatsAppMessaging /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/owner-panel" element={<ProtectedRoute><OwnerPanel /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
