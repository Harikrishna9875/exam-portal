import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function AdminDashboard() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default AdminDashboard;
