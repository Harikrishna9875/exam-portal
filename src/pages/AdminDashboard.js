import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
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

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      // Exams created by this admin
      const examsQ = query(
        collection(db, "exams"),
        where("createdBy", "==", auth.currentUser.uid)
      );
      const examsSnap = await getDocs(examsQ);
      const examsData = examsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setExams(examsData);

      // All rounds (count only)
      const roundsSnap = await getDocs(collection(db, "rounds"));
      setRoundsCount(roundsSnap.size);

      // Attempts + qualified
      const attemptsSnap = await getDocs(collection(db, "attempts"));
      setAttemptsCount(attemptsSnap.size);

      const qualified = attemptsSnap.docs.filter(
        d => d.data().qualified === true
      ).length;
      setQualifiedCount(qualified);
    };

    fetchData();
  }, []);

  return (
    <Layout title="Admin Dashboard">
      {/* ---------------- CREATE TEST ---------------- */}
      <Card>
        <h3>➕ Create New Test</h3>
        <p>
          A <b>test</b> is an exam that students can attempt.
          Each test can have one or more rounds.
        </p>

        <ul>
          <li>🧪 Create a test (exam)</li>
          <li>🔁 Add rounds (time, cutoff, paid/free)</li>
          <li>❓ Add MCQ questions</li>
          <li>📊 Monitor student results</li>
        </ul>

        <Button onClick={() => window.location.href = "/admin/create-test"}>
          Create Test
        </Button>
      </Card>

      {/* ---------------- ANALYTICS ---------------- */}
      <div style={grid}>
        <Stat title="Total Tests" value={exams.length} />
        <Stat title="Total Rounds" value={roundsCount} />
        <Stat title="Total Attempts" value={attemptsCount} />
        <Stat title="Qualified Students" value={qualifiedCount} />
      </div>

      {/* ---------------- QUICK ACTIONS ---------------- */}
      <div style={grid}>
        <ActionCard
          title="Manage Questions"
          desc="Add or review MCQs for rounds"
          link="/admin/questions"
        />
        <ActionCard
          title="View Results"
          desc="Analyze student performance"
          link="/admin/results"
        />
      </div>

      {/* ---------------- MY TESTS ---------------- */}
      <Card>
        <h3>📂 My Tests</h3>

        {exams.length === 0 && <p>No tests created yet</p>}

        {exams.map(exam => (
          <div key={exam.id} style={row}>
            <div>
              <b>{exam.title}</b>
              <p style={{ margin: 0 }}>{exam.description}</p>
            </div>
            <Badge
              text={exam.isPublic ? "Public" : "Private"}
              type={exam.isPublic ? "success" : "warning"}
            />
          </div>
        ))}
      </Card>
    </Layout>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

const Stat = ({ title, value }) => (
  <Card>
    <p style={{ marginBottom: 6 }}>{title}</p>
    <h2>{value}</h2>
  </Card>
);

const ActionCard = ({ title, desc, link }) => (
  <Card>
    <h3>{title}</h3>
    <p>{desc}</p>
    <Button onClick={() => window.location.href = link}>
      Open
    </Button>
  </Card>
);

/* ---------------- STYLES ---------------- */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
  padding: "10px 0",
};

export default AdminDashboard;