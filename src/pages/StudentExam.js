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

  /* 🔴 ANTI-CHEAT STATE */
  const [tabViolations, setTabViolations] = useState(0);
  const MAX_TAB_VIOLATIONS = 2;

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
    setTabViolations(0);
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
  const handleSubmit = async (auto = false, reason = "") => {
    if (submitted) return;

    const score = calculateScore();

    const attemptRef = await addDoc(collection(db, "attempts"), {
      userId: auth.currentUser.uid,
      examId: selectedExamId,
      roundId: selectedRound.id,
      answers,
      score,
      autoSubmitted: auto,
      antiCheatReason: reason,
      submittedAt: new Date(),
    });

    // Percentile
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
    alert(auto ? "Exam auto-submitted" : "Exam submitted");
  };

  /* ---------------- AUTO SUBMIT (TIME) ---------------- */
  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submitted) {
      handleSubmit(true, "time_up");
    }
  }, [timeLeft]);

  /* 🔴 TAB SWITCH DETECTION */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!selectedRound || submitted) return;

      if (document.hidden) {
        setTabViolations(v => {
          const newCount = v + 1;

          if (newCount > MAX_TAB_VIOLATIONS) {
            handleSubmit(true, "tab_switch_limit");
          } else {
            alert(
              `Warning ${newCount}/${MAX_TAB_VIOLATIONS}: Tab switching detected`
            );
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [selectedRound, submitted]);

  /* 🔴 DISABLE RIGHT CLICK + COPY */
  useEffect(() => {
    const block = e => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
    };
  }, []);

  useEffect(() => {
    fetchExams();
  }, []);

  const formatTime = s =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Attempt Exam</h2>

      <select
        onChange={e => {
          setSelectedExamId(e.target.value);
          fetchRounds(e.target.value);
          setQuestions([]);
        }}
      >
        <option>Select Exam</option>
        {exams.map(e => (
          <option key={e.id} value={e.id}>{e.title}</option>
        ))}
      </select>

      <hr />

      {rounds.map(r => (
        <div key={r.id} style={{ border: "1px solid #ccc", padding: 10 }}>
          <p>Round {r.roundNumber}</p>
          <button onClick={() => startExam(r)}>Attempt</button>
        </div>
      ))}

      {alreadyAttempted && (
        <p style={{ color: "red" }}>
          You already attempted this round
        </p>
      )}

      {selectedRound && !submitted && (
        <h3>Time Left: {formatTime(timeLeft)}</h3>
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
