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

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
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

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  /* ---------------- FETCH EXAMS ---------------- */
  const fetchExams = async () => {
    const q = query(collection(db, "exams"), where("isPublic", "==", true));
    const snap = await getDocs(q);
    setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(collection(db, "rounds"), where("examId", "==", examId));
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
    if (await checkAttempt(round.id)) {
      setAlreadyAttempted(true);
      return;
    }

    setAlreadyAttempted(false);
    setSelectedRound(round);
    setAnswers({});
    setSubmitted(false);
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

  /* ---------------- SCORE ---------------- */
  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) score++;
    });
    return score;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (auto = false) => {
    if (submitted) return;

    const score = calculateScore();

    const attemptRef = await addDoc(collection(db, "attempts"), {
      userId: auth.currentUser.uid,
      examId: selectedExamId,
      roundId: selectedRound.id,
      answers,
      score,
      autoSubmitted: auto,
      submittedAt: new Date(),
    });

    const q = query(
      collection(db, "attempts"),
      where("roundId", "==", selectedRound.id)
    );
    const snap = await getDocs(q);
    const attempts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const sorted = [...attempts].sort((a, b) => a.score - b.score);
    const rank = sorted.findIndex(a => a.id === attemptRef.id);
    const percentile = Math.round((rank / sorted.length) * 100);

    const qualified = percentile >= selectedRound.cutoffPercentile;

    await updateDoc(doc(db, "attempts", attemptRef.id), {
      percentile,
      qualified,
    });

    setSubmitted(true);
    clearInterval(timerRef.current);
    alert(auto ? "Time up! Exam auto-submitted" : "Exam submitted");
  };

  useEffect(() => {
    fetchExams();
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Attempt Exam">
      {/* EXAM SELECT */}
      <Card>
        <h3>Select Exam</h3>
        <select
          style={{ padding: 8, width: "100%", marginTop: 8 }}
          onChange={e => {
            setSelectedExamId(e.target.value);
            fetchRounds(e.target.value);
            setQuestions([]);
          }}
        >
          <option>Select Exam</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </Card>

      {/* ROUNDS */}
      {rounds.map(r => (
        <Card key={r.id}>
          <h4>Round {r.roundNumber}</h4>

          {alreadyAttempted ? (
            <Badge text="Already Attempted" type="fail" />
          ) : (
            <Button onClick={() => startExam(r)}>Start Round</Button>
          )}
        </Card>
      ))}

      {/* TIMER */}
      {selectedRound && !submitted && (
        <Card>
          <Timer seconds={timeLeft} />
          <Badge text="Do not switch tabs" type="warning" />
        </Card>
      )}

      {/* QUESTIONS */}
      {questions.map((q, i) => (
        <Card key={q.id}>
          <h4>Q{i + 1}. {q.questionText}</h4>
          {q.options.map((opt, idx) => (
            <label
              key={idx}
              style={{
                display: "block",
                padding: "8px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === idx}
                onChange={() =>
                  setAnswers({ ...answers, [q.id]: idx })
                }
                style={{ marginRight: 8 }}
              />
              {opt}
            </label>
          ))}
        </Card>
      ))}

      {/* SUBMIT */}
      {questions.length > 0 && !submitted && (
        <Button type="danger" onClick={() => handleSubmit(false)}>
          Submit Exam
        </Button>
      )}

      {submitted && (
        <Card>
          <Badge text="Exam Submitted Successfully" type="success" />
        </Card>
      )}
    </Layout>
  );
}

export default StudentExam;
