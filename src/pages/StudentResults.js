import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------- LOGOUT -------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* -------- FETCH RESULTS -------- */
  const fetchResults = async () => {
    try {
      // 1. Get attempts of this student
      const attemptsQuery = query(
        collection(db, "attempts"),
        where("userId", "==", auth.currentUser.uid)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);

      const attempts = attemptsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Fetch exams & rounds (for names)
      const examsSnapshot = await getDocs(collection(db, "exams"));
      const roundsSnapshot = await getDocs(collection(db, "rounds"));

      const examsMap = {};
      examsSnapshot.docs.forEach((doc) => {
        examsMap[doc.id] = doc.data();
      });

      const roundsMap = {};
      roundsSnapshot.docs.forEach((doc) => {
        roundsMap[doc.id] = doc.data();
      });

      // 3. Merge data
      const finalResults = attempts.map((a) => ({
        ...a,
        examTitle: examsMap[a.examId]?.title || "Unknown Exam",
        roundNumber: roundsMap[a.roundId]?.roundNumber || "-",
      }));

      setResults(finalResults);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  /* -------- UI -------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>My Exam Results</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      {loading && <p>Loading results...</p>}

      {!loading && results.length === 0 && (
        <p>No exam attempts found</p>
      )}

      {!loading &&
        results.map((r, index) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p><b>Exam:</b> {r.examTitle}</p>
            <p><b>Round:</b> {r.roundNumber}</p>
            <p><b>Score:</b> {r.score}</p>
            <p><b>Percentile:</b> {r.percentile}%</p>
            <p>
              <b>Status:</b>{" "}
              <span style={{ color: r.qualified ? "green" : "red" }}>
                {r.qualified ? "Qualified" : "Not Qualified"}
              </span>
            </p>
            <p>
              <b>Submission:</b>{" "}
              {r.autoSubmitted ? "Auto (Time Up)" : "Manual"}
            </p>
          </div>
        ))}
    </div>
  );
}

export default StudentResults;
