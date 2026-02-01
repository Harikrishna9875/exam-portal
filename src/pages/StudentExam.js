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

  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);

  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef(null);
  const violationCount = useRef(0);

  /* ---------------- FULLSCREEN ---------------- */
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  /* ---------------- FETCH EXAMS ---------------- */
  useEffect(() => {
    const fetchExams = async () => {
      const q = query(
        collection(db, "exams"),
        where("isPublic", "==", true),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchExams();
  }, []);

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (exam) => {
    setSelectedExam(exam);

    const q = query(
      collection(db, "rounds"),
      where("examId", "==", exam.id)
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

  /* ---------------- START EXAM (TIME GATED) ---------------- */
  const startExam = async (round) => {
    const now = new Date();

    const examStartAt = selectedExam.examStartAt.toDate();
    const examEndAt = selectedExam.examEndAt.toDate();

    if (now < examStartAt) {
      alert(`Exam starts at ${examStartAt.toLocaleString()}`);
      return;
    }

    if (now > examEndAt) {
      alert("Exam has already ended");
      return;
    }

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
    violationCount.current = 0;

    enterFullscreen();

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

      const percentile = Math.round((correct / totalQuestions) * 100);
      const qualified = percentile >= selectedRound.cutoffPercentile;

      await addDoc(collection(db, "attempts"), {
        userId: auth.currentUser.uid,
        examId: selectedExam.id,
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

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      alert("Exam submitted successfully");
    },
    [answers, questions, selectedRound, selectedExam, submitted]
  );

  /* ---------------- AUTO SUBMIT ---------------- */
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft, questions.length, submitted, handleSubmit]);

  const currentQuestion = questions[currentIndex];

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Online Examination">
      {!selectedRound && (
        <>
          <h3>Select Exam</h3>

          {exams.map(exam => (
            <div key={exam.id} style={{ padding: 16, border: "1px solid #ddd", marginBottom: 12 }}>
              <b>{exam.title}</b>
              <p>{exam.description}</p>
              <Button onClick={() => fetchRounds(exam)}>View Rounds</Button>
            </div>
          ))}

          {rounds.map(r => (
            <div key={r.id} style={{ marginTop: 10 }}>
              <b>Round {r.roundNumber}</b><br />
              Duration: {r.durationMinutes} min<br />
              {alreadyAttempted ? (
                <Badge text="Already Attempted" type="fail" />
              ) : (
                <Button onClick={() => startExam(r)}>Start Exam</Button>
              )}
            </div>
          ))}
        </>
      )}

      {selectedRound && !submitted && currentQuestion && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              Round {selectedRound.roundNumber} <br />
              Question {currentIndex + 1} / {questions.length}
            </div>
            <Timer seconds={timeLeft} />
          </div>

          <h3>{currentQuestion.questionText}</h3>

          {currentQuestion.options.map((opt, idx) => (
            <label key={idx} style={{ display: "block", marginBottom: 8 }}>
              <input
                type="radio"
                checked={answers[currentQuestion.id] === idx}
                onChange={() =>
                  setAnswers({ ...answers, [currentQuestion.id]: idx })
                }
              />{" "}
              {opt}
            </label>
          ))}

          <div style={{ marginTop: 20 }}>
            <Button
              type="secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
            >
              Previous
            </Button>{" "}
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex(i => i + 1)}>
                Next
              </Button>
            ) : (
              <Button type="danger" onClick={() => handleSubmit(false)}>
                Submit
              </Button>
            )}
          </div>
        </>
      )}

      {submitted && <Badge text="Exam Submitted Successfully" type="success" />}
    </Layout>
  );
}

export default StudentExam;