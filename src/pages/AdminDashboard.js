import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [roundsCount, setRoundsCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = async () => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    // Exams created by admin
    const examsQ = query(
      collection(db, "exams"),
      where("createdBy", "==", uid)
    );
    const examsSnap = await getDocs(examsQ);
    const examsData = examsSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));
    setExams(examsData);

    // Global stats (simple + acceptable)
    const roundsSnap = await getDocs(collection(db, "rounds"));
    setRoundsCount(roundsSnap.size);

    const attemptsSnap = await getDocs(collection(db, "attempts"));
    setAttemptsCount(attemptsSnap.size);

    const qualified = attemptsSnap.docs.filter(
      d => d.data().qualified === true
    ).length;
    setQualifiedCount(qualified);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Admin Dashboard">
      {/* ================= HERO ACTION ================= */}
      <div style={hero}>
        <div>
          <h2 style={{ marginBottom: 6 }}>
            Welcome back 👋
          </h2>
          <p style={{ color: "#6b7280" }}>
            Create exams, manage questions, and analyze results.
          </p>
        </div>

        <Button
          onClick={() => window.location.href = "/admin/create-test"}
        >
          ➕ Create New Test
        </Button>
      </div>

      {/* ================= STATS ================= */}
      <div style={statsGrid}>
        <Stat title="Tests Created" value={exams.length} />
        <Stat title="Total Rounds" value={roundsCount} />
        <Stat title="Total Attempts" value={attemptsCount} />
        <Stat title="Qualified Students" value={qualifiedCount} />
      </div>

      {/* ================= MY TESTS ================= */}
      <Card>
        <h3 style={{ marginBottom: 6 }}>📚 My Tests</h3>
        <p style={helper}>
          Share exam links with students and manage everything from here.
        </p>

        {exams.length === 0 && (
          <p style={helper}>
            No tests created yet. Click “Create New Test” to begin.
          </p>
        )}

        {exams.map(exam => {
          const examLink = `${window.location.origin}/exam/${exam.examSlug}`;

          return (
            <div key={exam.id} style={examRow}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{exam.title}</h4>
                <p style={helper}>{exam.description}</p>

                <p style={{ fontSize: 12, marginTop: 6 }}>
                  Public Exam Link
                </p>

                <input
                  value={examLink}
                  readOnly
                  style={linkInput}
                />

                <button
                  style={copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(examLink);
                    alert("Exam link copied");
                  }}
                >
                  Copy Link
                </button>
              </div>

              <Badge
                text={exam.isPublic ? "Public" : "Private"}
                type={exam.isPublic ? "success" : "warning"}
              />
            </div>
          );
        })}
      </Card>

      {/* ================= QUICK ACTIONS ================= */}
      <div style={actionsGrid}>
        <ActionCard
          title="📊 Analytics"
          desc="Pass rate, trends & insights"
          link="/admin/analytics"
        />
        <ActionCard
          title="📝 Questions"
          desc="Add or manage MCQs"
          link="/admin/questions"
        />
        <ActionCard
          title="📋 Results"
          desc="View student attempts"
          link="/admin/results"
        />
      </div>
    </Layout>
  );
}

/* ================= COMPONENTS ================= */

const Stat = ({ title, value }) => (
  <Card>
    <p style={{ color: "#6b7280", marginBottom: 4 }}>{title}</p>
    <h2>{value}</h2>
  </Card>
);

const ActionCard = ({ title, desc, link }) => (
  <Card>
    <h3>{title}</h3>
    <p style={{ color: "#6b7280" }}>{desc}</p>
    <Button onClick={() => window.location.href = link}>
      Open
    </Button>
  </Card>
);

/* ================= STYLES ================= */

const hero = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 32,
};

const actionsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginTop: 24,
};

const examRow = {
  display: "flex",
  gap: 16,
  padding: "16px 0",
  borderBottom: "1px solid #e5e7eb",
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
};

const linkInput = {
  width: "100%",
  padding: 8,
  fontSize: 12,
  marginBottom: 6,
};

const copyBtn = {
  fontSize: 12,
  padding: "4px 10px",
  cursor: "pointer",
};

export default AdminDashboard;