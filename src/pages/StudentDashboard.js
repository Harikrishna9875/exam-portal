import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function StudentDashboard() {
  const [exams, setExams] = useState([]);

  /* ---------------- FETCH EXAMS ---------------- */
  const fetchExams = async () => {
    const q = query(
      collection(db, "exams"),
      where("isPublic", "==", true)
    );
    const snapshot = await getDocs(q);
    setExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <Layout title="Student Dashboard">
      <h2>Available Exams</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Button onClick={() => window.location.href = "/student/exams"}>
          Attempt Exam
        </Button>

        <Button
          type="secondary"
          onClick={() => window.location.href = "/student/results"}
        >
          View My Results
        </Button>

        <Button
          type="secondary"
          onClick={() => window.location.href = "/student/certificates"}
        >
          My Certificates
        </Button>
      </div>

      {exams.length === 0 && <p>No exams available</p>}

      {exams.map(exam => (
        <Card key={exam.id}>
          <h3>{exam.title}</h3>
          <p>{exam.description}</p>
        </Card>
      ))}
    </Layout>
  );
}

export default StudentDashboard;
