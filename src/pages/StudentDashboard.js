import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";

import Layout from "../components/Layout";
import Button from "../components/ui/Button";

function StudentDashboard() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      const q = query(
        collection(db, "exams"),
        where("isPublic", "==", true)
      );
      const snap = await getDocs(q);
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchExams();
  }, []);

  return (
    <Layout title="Student Dashboard">
      <div style={{ display: "flex", minHeight: "70vh" }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: 240,
            background: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            padding: 20,
          }}
        >
          <h3>Student Panel</h3>
          <p
            style={{ cursor: "pointer", margin: "12px 0" }}
            onClick={() => window.location.href = "/student/dashboard"}
          >
            Dashboard
          </p>
          <p
            style={{ cursor: "pointer", margin: "12px 0" }}
            onClick={() => window.location.href = "/student/results"}
          >
            Results
          </p>
          <p
            style={{ cursor: "pointer", margin: "12px 0" }}
            onClick={() => window.location.href = "/student/certificates"}
          >
            Certificates
          </p>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: 24 }}>
          <h2>Active Exams</h2>

          {exams.length === 0 && (
            <p>No exams are currently available.</p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              marginTop: 20,
            }}
          >
            {exams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <h4 style={{ marginBottom: 6 }}>{exam.title}</h4>
                <p style={{ fontSize: 14, color: "#555" }}>
                  {exam.description}
                </p>

                <Button
                  onClick={() =>
                    window.location.href = `/student/exams?examId=${exam.id}`
                  }
                >
                  Start Exam
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default StudentDashboard;
