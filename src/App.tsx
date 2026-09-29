// /var/www/fresh-studio-hub/src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AdminLayout } from "@/pages/admin/components/AdminLayout";

import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import BlogList from "@/pages/admin/blog/BlogList";
import BlogEditor from "@/pages/admin/blog/BlogEditor";
import MediaLibrary from "@/pages/admin/media/MediaLibrary";
import LeadsList from "@/pages/admin/leads/LeadsList";
import LeadDetail from "@/pages/admin/leads/LeadDetail";
import CampaignsList from "@/pages/admin/campaigns/CampaignsList";
import ServicesList from "@/pages/admin/services/ServicesList";
import RacuniList from "@/pages/admin/racuni/RacuniList";
import RacunEditor from "@/pages/admin/racuni/RacunEditor";
import PonudeList from "@/pages/admin/ponude/PonudeList";
import PonudaEditor from "@/pages/admin/ponude/PonudaEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/new" element={<BlogEditor />} />
            <Route path="blog/:id" element={<BlogEditor />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="leads" element={<LeadsList />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="services" element={<ServicesList />} />
            <Route path="racuni" element={<RacuniList />} />
            <Route path="racuni/:id" element={<RacunEditor />} />
            <Route path="ponude" element={<PonudeList />} />
            <Route path="ponude/:id" element={<PonudaEditor />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;