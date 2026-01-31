import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
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

  /* ---------------- TIMER STATE ---------------- */
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const timerRef = useRef(null);

  /* ---------------- FETCH PUBLIC EXAMS ---------------- */
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

  /* ---------------- FETCH QUESTIONS + START TIMER ---------------- */
  const fetchQuestions = async (roundId) => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return;

    // set timer from round duration
    const durationInSeconds = round.durationMinutes * 60;
    setTimeLeft(durationInSeconds);

    const q = query(
      collection(db, "questions"),
      where("roundId", "==", roundId)
    );
    const snapshot = await getDocs(q);
    setQuestions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- CHECK ATTEMPT ---------------- */
  const checkAttemptExists = async (roundId) => {
    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", roundId),
      where("userId", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  /* ---------------- START TIMER ---------------- */
  useEffect(() => {
    if (timeLeft <= 0 || submitted) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  /* ---------------- AUTO SUBMIT ---------------- */
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft]);

  /* ---------------- SUBMIT EXAM ---------------- */
  const handleSubmit = async (auto = false) => {
    if (!selectedRoundId || submitted) return;

    const alreadyAttempted = await checkAttemptExists(selectedRoundId);
    if (alreadyAttempted) {
      alert("You already attempted this round");
      return;
    }

    try {
      await addDoc(collection(db, "attempts"), {
        userId: auth.currentUser.uid,
        examId: selectedExamId,
        roundId: selectedRoundId,
        answers,
        submittedAt: new Date(),
        autoSubmitted: auto,
      });

      setSubmitted(true);
      clearInterval(timerRef.current);
      alert(auto ? "Time up! Exam auto-submitted." : "Exam submitted successfully");
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchPublicExams();
  }, []);

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Attempt Exam</h2>

      {/* -------- SELECT EXAM -------- */}
      <h3>Select Exam</h3>
      <select
        value={selectedExamId}
        onChange={(e) => {
          const examId = e.target.value;
          setSelectedExamId(examId);
          setSelectedRoundId("");
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);
          setTimeLeft(0);
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
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);
          clearInterval(timerRef.current);
          fetchQuestions(roundId);
        }}
      >
        <option value="">Select Round</option>
        {rounds.map((round) => (
          <option key={round.id} value={round.id}>
            Round {round.roundNumber} ({round.isPaid ? "Paid" : "Free"})
          </option>
        ))}
      </select>

      <hr />

      {/* -------- TIMER -------- */}
      {timeLeft > 0 && !submitted && (
        <h3 style={{ color: timeLeft < 60 ? "red" : "black" }}>
          Time Left: {formatTime(timeLeft)}
        </h3>
      )}

      {/* -------- QUESTIONS -------- */}
      {questions.length > 0 && <h3>Questions</h3>}

      {questions.map((q, index) => (
        <div key={q.id} style={{ marginBottom: 15 }}>
          <p>
            <b>Q{index + 1}:</b> {q.questionText}
          </p>

          {q.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === i}
                onChange={() =>
                  setAnswers({ ...answers, [q.id]: i })
                }
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      {questions.length > 0 && !submitted && (
        <button onClick={() => handleSubmit(false)}>Submit Exam</button>
      )}

      {submitted && <p>Exam submitted</p>}
    </div>
  );
}

export default StudentExam;
