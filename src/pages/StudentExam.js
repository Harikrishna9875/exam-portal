import { useEffect, useState } from "react";
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

  /* ---------------- FETCH QUESTIONS ---------------- */
  const fetchQuestions = async (roundId) => {
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

  /* ---------------- SUBMIT EXAM ---------------- */
  const handleSubmit = async () => {
    if (!selectedRoundId) return;

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
      });

      setSubmitted(true);
      alert("Exam submitted successfully");
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchPublicExams();
  }, []);

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
        <button onClick={handleSubmit}>Submit Exam</button>
      )}

      {submitted && <p>Exam already submitted</p>}
    </div>
  );
}

export default StudentExam;
