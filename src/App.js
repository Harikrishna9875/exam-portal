import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminQuestions from "./pages/AdminQuestions";
import StudentExam from "./pages/StudentExam";
import StudentResults from "./pages/StudentResults";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin/questions"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminQuestions />
    </ProtectedRoute>
  }
/>
<Route
  path="/student/exam"
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
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
