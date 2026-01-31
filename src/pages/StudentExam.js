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
  const [selectedRound, setSelectedRound] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const [paymentDone, setPaymentDone] = useState(false);

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

  /* ---------------- CHECK PAYMENT ---------------- */
  const checkPayment = async (roundId) => {
    const q = query(
      collection(db, "payments"),
      where("roundId", "==", roundId),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "success")
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  /* ---------------- MOCK PAYMENT ---------------- */
  const handleMockPayment = async () => {
    await addDoc(collection(db, "payments"), {
      userId: auth.currentUser.uid,
      examId: selectedExamId,
      roundId: selectedRoundId,
      amount: 100,
      status: "success",
      paidAt: new Date(),
    });

    setPaymentDone(true);
    alert("Payment successful (mock)");
  };

  /* ---------------- FETCH QUESTIONS ---------------- */
  const fetchQuestions = async (round) => {
    setSelectedRound(round);
    setTimeLeft(round.durationMinutes * 60);

    const q = query(
      collection(db, "questions"),
      where("roundId", "==", round.id)
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

      {/* -------- SELECT EXAM -------- */}
      <select
        value={selectedExamId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedExamId(id);
          setSelectedRoundId("");
          setSelectedRound(null);
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);
          setPaymentDone(false);
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

      {/* -------- SELECT ROUND -------- */}
      <select
        value={selectedRoundId}
        onChange={async (e) => {
          const id = e.target.value;
          setSelectedRoundId(id);
          setQuestions([]);
          setAnswers({});
          setSubmitted(false);

          const round = rounds.find((r) => r.id === id);
          if (!round) return;

          if (round.isPaid) {
            const paid = await checkPayment(id);
            setPaymentDone(paid);
          } else {
            setPaymentDone(true);
          }

          fetchQuestions(round);
        }}
      >
        <option value="">Select Round</option>
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            Round {r.roundNumber} ({r.isPaid ? "Paid" : "Free"})
          </option>
        ))}
      </select>

      <hr />

      {/* -------- PAYMENT BLOCK -------- */}
      {selectedRound?.isPaid && !paymentDone && (
        <div style={{ border: "1px solid red", padding: 10 }}>
          <p>This is a paid round.</p>
          <button onClick={handleMockPayment}>
            Pay ₹100 (Mock)
          </button>
        </div>
      )}

      {/* -------- TIMER -------- */}
      {paymentDone && timeLeft > 0 && !submitted && (
        <h3>Time Left: {formatTime(timeLeft)}</h3>
      )}

      {/* -------- QUESTIONS -------- */}
      {paymentDone &&
        questions.map((q, i) => (
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

      {!paymentDone && selectedRound && (
        <p>Complete payment to start exam.</p>
      )}
    </div>
  );
}

export default StudentExam;
