import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsRef = collection(db, "exams");
        const snapshot = await getDocs(examsRef);

        const examsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExams(examsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exams:", error);
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div>
      <h2>Student Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      <h3>Available Exams</h3>

      {loading && <p>Loading exams...</p>}

      {!loading && exams.length === 0 && <p>No exams available</p>}

      {!loading &&
        exams.map((exam) => (
          <div key={exam.id} style={{ marginBottom: "10px" }}>
            <strong>{exam.title}</strong>
            <p>{exam.description}</p>
          </div>
        ))}
    </div>
  );
}

export default StudentDashboard;
