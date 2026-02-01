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

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      alert("Exam submitted successfully");
    },
    [answers, questions, selectedRound, selectedExamId, submitted]
  );

  /* ---------------- AUTO SUBMIT (TIME) ---------------- */
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft, questions.length, submitted, handleSubmit]);

  /* ---------------- PROCTORING (TAB / REFRESH) ---------------- */
  useEffect(() => {
    if (!selectedRound || submitted) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        violationCount.current += 1;

        if (violationCount.current === 1) {
          alert(
            "⚠️ Warning: Do not switch tabs or minimize.\nNext violation will auto-submit."
          );
        } else {
          alert("🚫 Multiple violations detected. Exam auto-submitted.");
          handleSubmit(true);
        }
      }
    };

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Leaving will submit your exam.";
    };

    const onKeyDown = (e) => {
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.metaKey && e.key === "r")
      ) {
        e.preventDefault();
        violationCount.current += 1;

        if (violationCount.current >= 2) {
          alert("🚫 Refresh detected. Exam auto-submitted.");
          handleSubmit(true);
        } else {
          alert("⚠️ Refresh is not allowed during the exam.");
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedRound, submitted, handleSubmit]);

  /* ---------------- UI ---------------- */
  const currentQuestion = questions[currentIndex];

  return (
    <Layout title="Online Examination">
      {!selectedRound && (
        <>
          <h3>Select Exam</h3>
          <select
            style={{ padding: 10, width: "100%" }}
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
                marginTop: 16,
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
              }}
            >
              <b>Round {r.roundNumber}</b><br />
              Duration: {r.durationMinutes} minutes<br />
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

      {selectedRound && !submitted && currentQuestion && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 10,
            }}
          >
            <div>
              <b>Round {selectedRound.roundNumber}</b><br />
              Question {currentIndex + 1} of {questions.length}
            </div>
            <Timer seconds={timeLeft} />
          </div>

          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
            }}
          >
            <h3>{currentQuestion.questionText}</h3>

            {currentQuestion.options.map((opt, idx) => (
              <label
                key={idx}
                style={{
                  display: "block",
                  padding: 12,
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