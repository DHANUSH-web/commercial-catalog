import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { EstablishmentProvider } from "@/contexts/EstablishmentContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Establishments from "@/pages/establishments";
import EstablishmentDetails from "@/pages/establishment-details";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Establishments} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/establishments/:id" component={EstablishmentDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EstablishmentProvider>
          <TooltipProvider>
            <Helmet>
              <title>EstablishmentDir - Commercial Establishment Directory</title>
              <meta name="description" content="A comprehensive directory of commercial establishments with detailed information and file attachments." />
              <meta property="og:title" content="EstablishmentDir" />
              <meta property="og:description" content="Browse and discover commercial establishments including restaurants, retail stores, services, and entertainment venues." />
              <meta property="og:type" content="website" />
            </Helmet>
            <Toaster />
            <Router />
          </TooltipProvider>
        </EstablishmentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
