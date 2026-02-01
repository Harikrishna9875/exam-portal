import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminQuestions from "./pages/AdminQuestions";
import AdminResults from "./pages/AdminResults";
import AdminCreateTest from "./pages/AdminCreateTest";
import AdminAnalytics from "./pages/AdminAnalytics";

import StudentExam from "./pages/StudentExam";
import StudentResults from "./pages/StudentResults";
import StudentCertificate from "./pages/StudentCertificate";

import PublicExamPage from "./pages/PublicExamPage"; // ✅ THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* -------- PUBLIC -------- */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔑 PUBLIC EXAM LINK (NO PROTECTION) */}
        <Route path="/exam/:examSlug" element={<PublicExamPage />} />

        {/* -------- ADMIN -------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/create-test"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminCreateTest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminQuestions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/results"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        {/* -------- STUDENT -------- */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentExam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentCertificate />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;