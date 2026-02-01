import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminAnalytics() {
  const [loading, setLoading] = useState(true);

  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedRound, setSelectedRound] = useState("");

  /* ---------------- FETCH EXAMS ---------------- */
  const fetchExams = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "exams"),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);

    setExams(
      snap.docs.map(d => ({
        id: d.id,
        title: d.data().title,
      }))
    );
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    if (!examId) {
      setRounds([]);
      return;
    }

    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snap = await getDocs(q);

    setRounds(
      snap.docs.map(d => ({
        id: d.id,
        roundNumber: d.data().roundNumber,
      }))
    );
  };

  /* ---------------- FETCH ATTEMPTS (STABLE) ---------------- */
  const fetchAttempts = useCallback(async () => {
    setLoading(true);

    let q = collection(db, "attempts");

    if (selectedRound) {
      q = query(q, where("roundId", "==", selectedRound));
    }

    const snap = await getDocs(q);
    setAttempts(snap.docs.map(d => d.data()));

    setLoading(false);
  }, [selectedRound]);

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchRounds(selectedExam);
    setSelectedRound("");
  }, [selectedExam]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  /* ---------------- DERIVED STATS ---------------- */
  const totalAttempts = attempts.length;
  const qualified = attempts.filter(a => a.qualified).length;
  const failed = totalAttempts - qualified;

  const pieData = [
    { name: "Qualified", value: qualified },
    { name: "Failed", value: failed },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Admin Analytics">
      <Card>
        <h2>Analytics</h2>
        <p style={helper}>
          Filter by test and round to analyze student performance.
        </p>
      </Card>

      {/* FILTERS */}
      <Card>
        <h3>Filters</h3>

        <select
          style={input}
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">All Tests</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        {rounds.length > 0 && (
          <select
            style={input}
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
          >
            <option value="">All Rounds</option>
            {rounds.map(r => (
              <option key={r.id} value={r.id}>
                Round {r.roundNumber}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* SUMMARY */}
      <div style={grid}>
        <Stat title="Attempts" value={totalAttempts} />
        <Stat title="Qualified" value={qualified} />
        <Stat title="Failed" value={failed} />
      </div>

      {/* CHART */}
      {!loading && (
        <Card>
          <h3>Pass vs Fail</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Layout>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

const Stat = ({ title, value }) => (
  <Card>
    <p style={{ color: "#6b7280" }}>{title}</p>
    <h2>{value}</h2>
  </Card>
);

/* ---------------- STYLES ---------------- */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
};

export default AdminAnalytics;