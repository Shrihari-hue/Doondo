import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import JobSearchPage from "./pages/JobSearchPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import JobSeekerDashboardPage from "./pages/JobSeekerDashboardPage";
import EmployerDashboardPage from "./pages/EmployerDashboardPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ProfilePage from "./pages/ProfilePage";

const App = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/jobs" element={<JobSearchPage />} />
      <Route path="/jobs/:id" element={<JobDetailsPage />} />
      <Route
        path="/dashboard/seeker"
        element={
          <ProtectedRoute role="seeker">
            <JobSeekerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employer"
        element={
          <ProtectedRoute role="employer">
            <EmployerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute role="employer">
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
