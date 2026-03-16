import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import StudentRegister from "./pages/StudentRegister";
import LecturerRegister from "./pages/LecturerRegister";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AttendanceVerification from "./pages/AttendanceVerification";
import CreateSession from "./pages/CreateSession";
import LiveSession from "./pages/LiveSession";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/lecturer" element={<LecturerRegister />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/verify/:sessionId" element={<AttendanceVerification />} />
          <Route path="/lecturer" element={<LecturerDashboard />} />
          <Route path="/lecturer/create-session" element={<CreateSession />} />
          <Route path="/lecturer/session/:sessionId" element={<LiveSession />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
