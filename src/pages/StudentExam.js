import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

function StudentExam() {
  /* ---------------- STATE ---------------- */
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /* ---------------- TIMER ---------------- */
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  /* ---------------- FETCH EXAMS ---------------- */
  const fetchPublicExams = async () => {
    const q = query(
      collection(db, "exams"),
      where("isPublic", "==", true)
    );
    const snapshot = await getDocs(q);
    setExams(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    setRounds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH QUESTIONS ---------------- */
  const fetchQuestions = async (roundId) => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    setTimeLeft(round.durationMinutes * 60);

    const q = query(
      collection(db, "questions"),
      where("roundId", "==", roundId)
    );
    const snapshot = await getDocs(q);
    setQuestions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (timeLeft <= 0 || submitted) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft]);

  /* ---------------- SCORE CALCULATION ---------------- */
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });
    return score;
  };

  /* ---------------- SUBMIT EXAM ---------------- */
  const handleSubmit = async (auto = false) => {
    if (submitted) return;

    const score = calculateScore();

    // Save attempt first
    const attemptRef = await addDoc(collection(db, "attempts"), {
      userId: auth.currentUser.uid,
      examId: selectedExamId,
      roundId: selectedRoundId,
      answers,
      score,
      autoSubmitted: auto,
      submittedAt: new Date(),
    });

    // Fetch all attempts of this round
    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", selectedRoundId)
    );
    const snapshot = await getDocs(q);

    const attempts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Sort by score
    const sorted = [...attempts].sort((a, b) => a.score - b.score);

    // Fetch cutoff
    const round = rounds.find((r) => r.id === selectedRoundId);
    const cutoff = round.cutoffPercentile;

    // Update percentiles
    for (let i = 0; i < sorted.length; i++) {
      const percentile =
        (i / sorted.length) * 100;

      const qualified = percentile >= cutoff;

      await updateDoc(doc(db, "attempts", sorted[i].id), {
        percentile: Math.round(percentile),
        qualified,
      });
    }

    setSubmitted(true);
    clearInterval(timerRef.current);
    alert(auto ? "Time up! Exam auto-submitted." : "Exam submitted successfully");
  };

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    fetchPublicExams();
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Attempt Exam</h2>

      <select
        value={selectedExamId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedExamId(id);
          setSelectedRoundId("");
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);
          setTimeLeft(0);
          fetchRounds(id);
        }}
      >
        <option value="">Select Exam</option>
        {exams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title}
          </option>
        ))}
      </select>

      <hr />

      <select
        value={selectedRoundId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedRoundId(id);
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);
          clearInterval(timerRef.current);
          fetchQuestions(id);
        }}
      >
        <option value="">Select Round</option>
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            Round {r.roundNumber}
          </option>
        ))}
      </select>

      <hr />

      {timeLeft > 0 && !submitted && (
        <h3 style={{ color: timeLeft < 60 ? "red" : "black" }}>
          Time Left: {formatTime(timeLeft)}
        </h3>
      )}

      {questions.map((q, i) => (
        <div key={q.id}>
          <p><b>Q{i + 1}:</b> {q.questionText}</p>
          {q.options.map((opt, idx) => (
            <div key={idx}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === idx}
                onChange={() =>
                  setAnswers({ ...answers, [q.id]: idx })
                }
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      {questions.length > 0 && !submitted && (
        <button onClick={() => handleSubmit(false)}>
          Submit Exam
        </button>
      )}

      {submitted && <p>Exam submitted</p>}
    </div>
  );
}

export default StudentExam;
