import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PageLayout } from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import JoinBeta from "@/pages/JoinBeta";
import Signup from "@/pages/Signup";
import Pricing from "@/pages/Pricing";
import Support from "@/pages/Support";
import Download from "@/pages/Download";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import Legal from "@/pages/Legal";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminWhitelist from "@/pages/admin/AdminWhitelist";
import AdminProfiles from "@/pages/admin/AdminProfiles";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

function Router() {
  return (
    <PageLayout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/join" component={JoinBeta} />
        <Route path="/signup" component={Signup} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/support" component={Support} />
        <Route path="/legal/:page" component={Legal} />

        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/profiles">
          <ProtectedAdminRoute>
            <AdminProfiles />
          </ProtectedAdminRoute>
        </Route>

        <Route path="/admin">
          <ProtectedAdminRoute>
            <AdminWhitelist />
          </ProtectedAdminRoute>
        </Route>

        <Route path="/onboarding">
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>

        <Route path="/download">
          <ProtectedRoute>
            <Download />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </PageLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
