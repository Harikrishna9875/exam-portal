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
import Badge from "../components/ui/Badge";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

function AdminAnalytics() {
  const [loading, setLoading] = useState(true);

  const [totalTests, setTotalTests] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);

  const [roundStats, setRoundStats] = useState([]);

  /* ---------------- FETCH ANALYTICS ---------------- */
  const fetchAnalytics = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);

      /* 1️⃣ Exams */
      const examsQ = query(
        collection(db, "exams"),
        where("createdBy", "==", auth.currentUser.uid)
      );
      const examsSnap = await getDocs(examsQ);
      const examIds = examsSnap.docs.map(d => d.id);
      setTotalTests(examIds.length);

      if (examIds.length === 0) {
        setLoading(false);
        return;
      }

      /* 2️⃣ Rounds */
      const roundsQ = query(
        collection(db, "rounds"),
        where("examId", "in", examIds)
      );
      const roundsSnap = await getDocs(roundsQ);

      const rounds = roundsSnap.docs.map(d => ({
        id: d.id,
        roundNumber: d.data().roundNumber,
      }));

      setTotalRounds(rounds.length);

      if (rounds.length === 0) {
        setLoading(false);
        return;
      }

      /* 3️⃣ Attempts */
      const roundIds = rounds.map(r => r.id);

      const attemptsQ = query(
        collection(db, "attempts"),
        where("roundId", "in", roundIds)
      );
      const attemptsSnap = await getDocs(attemptsQ);
      const attempts = attemptsSnap.docs.map(d => d.data());

      setTotalAttempts(attempts.length);
      const qualified = attempts.filter(a => a.qualified).length;
      setQualifiedCount(qualified);

      /* 4️⃣ Attempts per round (for bar chart) */
      const stats = rounds.map(r => {
        const count = attempts.filter(a => a.roundId === r.id).length;
        return {
          name: `Round ${r.roundNumber}`,
          attempts: count,
        };
      });

      setRoundStats(stats);
      setLoading(false);
    } catch (err) {
      console.error("Analytics error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const failedCount = totalAttempts - qualifiedCount;

  const passFailData = [
    { name: "Qualified", value: qualifiedCount },
    { name: "Not Qualified", value: failedCount },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Admin Analytics">
      <Card>
        <h2>Analytics Overview</h2>
        <p style={helper}>
          Visual performance insights for your exams.
        </p>
      </Card>

      {loading && <p>Loading analytics...</p>}

      {!loading && (
        <>
          {/* SUMMARY CARDS */}
          <div style={grid}>
            <Card>
              <h3>Total Tests</h3>
              <Badge text={totalTests} type="info" />
            </Card>

            <Card>
              <h3>Total Rounds</h3>
              <Badge text={totalRounds} type="info" />
            </Card>

            <Card>
              <h3>Total Attempts</h3>
              <Badge text={totalAttempts} type="info" />
            </Card>

            <Card>
              <h3>Qualified</h3>
              <Badge text={qualifiedCount} type="success" />
            </Card>
          </div>

          {/* CHARTS */}
          <div style={grid}>
            {/* PIE CHART */}
            <Card>
              <h3>Pass vs Fail</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {passFailData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* BAR CHART */}
            <Card>
              <h3>Attempts per Round</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={roundStats}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}

/* ---------------- STYLES ---------------- */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
};

export default AdminAnalytics;