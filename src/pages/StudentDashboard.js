import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function StudentDashboard() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default StudentDashboard;
