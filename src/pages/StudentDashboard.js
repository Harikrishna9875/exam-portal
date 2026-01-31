import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  // FETCH ONLY PUBLIC EXAMS
  const fetchPublicExams = async () => {
    setLoading(true);
    try {
      const examsRef = collection(db, "exams");
      const q = query(examsRef, where("isPublic", "==", true));

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExams(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicExams();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Student Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      <h3>Available Exams</h3>

      {loading && <p>Loading exams...</p>}

      {!loading && exams.length === 0 && (
        <p>No public exams available</p>
      )}

      {!loading &&
        exams.map((exam) => (
          <div
            key={exam.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <strong>{exam.title}</strong>
            <p>{exam.description}</p>
          </div>
        ))}
    </div>
  );
}

export default StudentDashboard;
