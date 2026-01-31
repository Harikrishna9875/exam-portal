import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

function AdminResults() {
  /* ---------------- STATE ---------------- */
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [loading, setLoading] = useState(false);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* ---------------- FETCH ADMIN EXAMS ---------------- */
  const fetchMyExams = async () => {
    const q = query(
      collection(db, "exams"),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    setExams(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snapshot = await getDocs(q);
    setRounds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ATTEMPTS ---------------- */
  const fetchAttempts = async (roundId) => {
    setLoading(true);

    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", roundId)
    );
    const snapshot = await getDocs(q);

    setAttempts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchMyExams();
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Admin – Exam Results</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      {/* -------- SELECT EXAM -------- */}
      <h3>Select Exam</h3>
      <select
        value={selectedExamId}
        onChange={(e) => {
          const examId = e.target.value;
          setSelectedExamId(examId);
          setSelectedRoundId("");
          setAttempts([]);
          fetchRounds(examId);
        }}
      >
        <option value="">Select Exam</option>
        {exams.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {exam.title}
          </option>
        ))}
      </select>

      <hr />

      {/* -------- SELECT ROUND -------- */}
      {rounds.length > 0 && <h3>Select Round</h3>}
      <select
        value={selectedRoundId}
        onChange={(e) => {
          const roundId = e.target.value;
          setSelectedRoundId(roundId);
          fetchAttempts(roundId);
        }}
      >
        <option value="">Select Round</option>
        {rounds.map((round) => (
          <option key={round.id} value={round.id}>
            Round {round.roundNumber}
          </option>
        ))}
      </select>

      <hr />

      {/* -------- RESULTS -------- */}
      <h3>Student Attempts</h3>

      {loading && <p>Loading results...</p>}

      {!loading && attempts.length === 0 && (
        <p>No attempts found for this round</p>
      )}

      {!loading &&
        attempts.map((a, index) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <p><b>Student UID:</b> {a.userId}</p>
            <p><b>Score:</b> {a.score}</p>
            <p><b>Percentile:</b> {a.percentile}%</p>
            <p>
              <b>Status:</b>{" "}
              <span style={{ color: a.qualified ? "green" : "red" }}>
                {a.qualified ? "Qualified" : "Not Qualified"}
              </span>
            </p>
            <p>
              <b>Submission:</b>{" "}
              {a.autoSubmitted ? "Auto (Time Up)" : "Manual"}
            </p>
          </div>
        ))}
    </div>
  );
}

export default AdminResults;
