import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";

import Layout from "../components/Layout";
import Badge from "../components/ui/Badge";

function StudentResults() {
  const [results, setResults] = useState([]);
  const [examMap, setExamMap] = useState({});
  const [roundMap, setRoundMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH META ---------------- */
  const fetchMeta = async () => {
    const examsSnap = await getDocs(collection(db, "exams"));
    const roundsSnap = await getDocs(collection(db, "rounds"));

    const eMap = {};
    examsSnap.docs.forEach(d => {
      eMap[d.id] = d.data().title;
    });

    const rMap = {};
    roundsSnap.docs.forEach(d => {
      rMap[d.id] = d.data().roundNumber;
    });

    setExamMap(eMap);
    setRoundMap(rMap);
  };

  /* ---------------- FETCH RESULTS ---------------- */
  const fetchResults = async () => {
    const q = query(
      collection(db, "attempts"),
      where("userId", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchMeta();
    fetchResults();
  }, []);

  return (
    <Layout title="My Exam Results">
      {loading && <p>Loading your results...</p>}

      {!loading && results.length === 0 && (
        <p>You haven’t attempted any exams yet.</p>
      )}

      {!loading &&
        results.map((r, index) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              background: "#ffffff",
              borderRadius: 10,
              padding: 20,
              marginBottom: 16,
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
              borderLeft: r.qualified
                ? "6px solid #22c55e"
                : "6px solid #dc2626",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                {examMap[r.examId] || "Exam"}
              </h3>
              <small style={{ color: "#555" }}>
                Round {roundMap[r.roundId] || "-"}
              </small>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <b>Total</b>
                <div>{r.totalQuestions}</div>
              </div>
              <div>
                <b>Attempted</b>
                <div>{r.attempted}</div>
              </div>
              <div>
                <b>Correct</b>
                <div>{r.correct}</div>
              </div>
              <div>
                <b>Accuracy</b>
                <div>{r.percentile}%</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: 10,
                background: "#e5e7eb",
                borderRadius: 6,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${r.percentile}%`,
                  background: r.qualified ? "#22c55e" : "#dc2626",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Status */}
            {r.qualified ? (
              <Badge text="Qualified" type="success" />
            ) : (
              <Badge text="Not Qualified" type="fail" />
            )}
          </motion.div>
        ))}
    </Layout>
  );
}

export default StudentResults;