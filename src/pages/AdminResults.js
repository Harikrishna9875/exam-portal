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

function AdminResults() {
  /* ---------------- STATE ---------------- */
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ADMIN EXAMS ---------------- */
  const fetchMyExams = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "exams"),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snap = await getDocs(q);
    setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ATTEMPTS ---------------- */
  const fetchAttempts = async (roundId) => {
    setLoading(true);

    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", roundId)
    );
    const snap = await getDocs(q);

    setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchMyExams();
  }, []);

  /* ---------------- DERIVED STATS ---------------- */
  const totalAttempts = attempts.length;
  const qualifiedCount = attempts.filter(a => a.qualified).length;
  const failedCount = totalAttempts - qualifiedCount;

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Exam Results">
      {/* -------- PAGE INTRO -------- */}
      <Card>
        <h2>Exam Results</h2>
        <p style={helper}>
          View student performance for each round.  
          Select a test → select a round → analyze attempts.
        </p>
      </Card>

      {/* -------- SELECT EXAM -------- */}
      <Card>
        <h3>Select Test</h3>
        <p style={helper}>
          Choose the test you want to analyze.
        </p>

        <select
          style={input}
          value={selectedExamId}
          onChange={(e) => {
            const examId = e.target.value;
            setSelectedExamId(examId);
            setSelectedRoundId("");
            setAttempts([]);
            fetchRounds(examId);
          }}
        >
          <option value="">Select Test</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </Card>

      {/* -------- SELECT ROUND -------- */}
      {rounds.length > 0 && (
        <Card>
          <h3>Select Round</h3>
          <p style={helper}>
            Each round represents a stage of the test.
          </p>

          <select
            style={input}
            value={selectedRoundId}
            onChange={(e) => {
              const roundId = e.target.value;
              setSelectedRoundId(roundId);
              fetchAttempts(roundId);
            }}
          >
            <option value="">Select Round</option>
            {rounds.map(round => (
              <option key={round.id} value={round.id}>
                Round {round.roundNumber}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* -------- SUMMARY -------- */}
      {attempts.length > 0 && (
        <Card>
          <h3>Round Summary</h3>
          <div style={summaryRow}>
            <Badge text={`Total Attempts: ${totalAttempts}`} type="info" />
            <Badge text={`Qualified: ${qualifiedCount}`} type="success" />
            <Badge text={`Failed: ${failedCount}`} type="fail" />
          </div>
        </Card>
      )}

      {/* -------- RESULTS LIST -------- */}
      <Card>
        <h3>Student Attempts</h3>

        {loading && <p>Loading results...</p>}

        {!loading && attempts.length === 0 && (
          <p style={helper}>
            No attempts found for this round.
          </p>
        )}

        {!loading &&
          attempts.map((a, index) => (
            <div key={a.id} style={resultCard}>
              <p><b>Student UID:</b> {a.userId}</p>
              <p><b>Attempted:</b> {a.attempted} / {a.totalQuestions}</p>
              <p><b>Correct:</b> {a.correct}</p>
              <p><b>Accuracy:</b> {a.percentile}%</p>

              <Badge
                text={a.qualified ? "Qualified" : "Not Qualified"}
                type={a.qualified ? "success" : "fail"}
              />

              <p style={helper}>
                Submission: {a.autoSubmitted ? "Auto (Time Up)" : "Manual"}
              </p>
            </div>
          ))}
      </Card>
    </Layout>
  );
}

/* ---------------- STYLES ---------------- */

const input = {
  width: "100%",
  padding: 10,
  marginTop: 6,
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
};

const summaryRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const resultCard = {
  border: "1px solid #e5e7eb",
  padding: 12,
  borderRadius: 6,
  marginBottom: 10,
};

export default AdminResults;