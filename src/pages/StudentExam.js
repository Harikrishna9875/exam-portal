import { useEffect, useRef, useState, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Timer from "../components/ui/Timer";
import Badge from "../components/ui/Badge";

function StudentExam() {
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRound, setSelectedRound] = useState(null);

  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  /* ---------------- FETCH EXAMS ---------------- */
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

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snap = await getDocs(q);
    setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- CHECK ATTEMPT ---------------- */
  const checkAttempt = async (roundId) => {
    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", roundId),
      where("userId", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  /* ---------------- START EXAM ---------------- */
  const startExam = async (round) => {
    const attempted = await checkAttempt(round.id);
    if (attempted) {
      setAlreadyAttempted(true);
      return;
    }

    setAlreadyAttempted(false);
    setSelectedRound(round);
    setSubmitted(false);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(round.durationMinutes * 60);

    const q = query(
      collection(db, "questions"),
      where("roundId", "==", round.id)
    );
    const snap = await getDocs(q);
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (timeLeft <= 0 || submitted) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitted) return;

      const totalQuestions = questions.length;
      let attempted = 0;
      let correct = 0;

      questions.forEach(q => {
        if (answers[q.id] !== undefined) {
          attempted++;
          if (answers[q.id] === q.correctOptionIndex) {
            correct++;
          }
        }
      });

      const percentile = Math.round(
        (correct / totalQuestions) * 100
      );

      const qualified =
        percentile >= selectedRound.cutoffPercentile;

      await addDoc(collection(db, "attempts"), {
        userId: auth.currentUser.uid,
        examId: selectedExamId,
        roundId: selectedRound.id,
        totalQuestions,
        attempted,
        correct,
        percentile,
        qualified,
        autoSubmitted: auto,
        submittedAt: new Date(),
      });

      setSubmitted(true);
      clearInterval(timerRef.current);
      alert("Exam submitted successfully");
    },
    [answers, questions, selectedRound, selectedExamId, submitted]
  );

  /* ---------------- AUTO SUBMIT ---------------- */
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft, questions.length, submitted, handleSubmit]);

  /* ---------------- UI ---------------- */
  const currentQuestion = questions[currentIndex];

  return (
    <Layout title="Online Examination">
      {/* -------- SELECT EXAM -------- */}
      {!selectedRound && (
        <>
          <h3>Select Exam</h3>
          <select
            style={{ padding: 10, width: "100%", marginBottom: 20 }}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              fetchRounds(e.target.value);
            }}
          >
            <option>Select Exam</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          {rounds.map(r => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e5e7eb",
                padding: 16,
                marginBottom: 12,
                borderRadius: 6,
              }}
            >
              <b>Round {r.roundNumber}</b>
              <br />
              Duration: {r.durationMinutes} minutes
              <br />
              {alreadyAttempted ? (
                <Badge text="Already Attempted" type="fail" />
              ) : (
                <Button onClick={() => startExam(r)}>
                  Start Exam
                </Button>
              )}
            </div>
          ))}
        </>
      )}

      {/* -------- EXAM INTERFACE -------- */}
      {selectedRound && !submitted && currentQuestion && (
        <>
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 10,
              marginBottom: 20,
            }}
          >
            <div>
              <b>Round {selectedRound.roundNumber}</b>
              <div>
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>
            <Timer seconds={timeLeft} />
          </div>

          {/* Question */}
          <div
            style={{
              background: "#ffffff",
              padding: 24,
              borderRadius: 8,
              minHeight: 200,
            }}
          >
            <h3>{currentQuestion.questionText}</h3>

            {currentQuestion.options.map((opt, idx) => (
              <label
                key={idx}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  marginBottom: 8,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  cursor: "pointer",
                  background:
                    answers[currentQuestion.id] === idx
                      ? "#eef2ff"
                      : "#fff",
                }}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={answers[currentQuestion.id] === idx}
                  onChange={() =>
                    setAnswers({
                      ...answers,
                      [currentQuestion.id]: idx,
                    })
                  }
                  style={{ marginRight: 10 }}
                />
                {opt}
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <Button
              type="secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
            >
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex(i => i + 1)}>
                Next
              </Button>
            ) : (
              <Button type="danger" onClick={() => handleSubmit(false)}>
                Submit Exam
              </Button>
            )}
          </div>
        </>
      )}

      {submitted && (
        <Badge text="Exam Submitted Successfully" type="success" />
      )}
    </Layout>
  );
}

export default StudentExam;
