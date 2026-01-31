import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

function AdminQuestions() {
  /* ---------------- AUTH ---------------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* ---------------- DATA STATE ---------------- */
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  /* ---------------- QUESTION FORM STATE ---------------- */
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  /* ---------------- FETCH EXAMS (OWN) ---------------- */
  const fetchMyExams = async () => {
    const q = query(
      collection(db, "exams"),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    setExams(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
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

  /* ---------------- CREATE QUESTION ---------------- */
  const handleCreateQuestion = async () => {
    if (!selectedRoundId || !questionText) {
      alert("Round and question text required");
      return;
    }

    if (options.some((opt) => opt.trim() === "")) {
      alert("All options must be filled");
      return;
    }

    try {
      await addDoc(collection(db, "questions"), {
        roundId: selectedRoundId,
        questionText,
        options,
        correctOptionIndex: correctIndex,
        createdAt: new Date(),
      });

      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);

      fetchQuestions(selectedRoundId);
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchMyExams();
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Admin – Manage Questions</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      {/* -------- SELECT EXAM -------- */}
      <h3>Select Exam</h3>
      <select
        value={selectedExamId}
        onChange={(e) => {
          setSelectedExamId(e.target.value);
          setSelectedRoundId("");
          setRounds([]);
          setQuestions([]);
          fetchRounds(e.target.value);
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
      <h3>Select Round</h3>
      <select
        value={selectedRoundId}
        onChange={(e) => {
          setSelectedRoundId(e.target.value);
          fetchQuestions(e.target.value);
        }}
      >
        <option value="">Select Round</option>
        {rounds.map((round) => (
          <option key={round.id} value={round.id}>
            Round {round.roundNumber}
          </option>
        ))}
      </select>

      <hr />

      {/* -------- CREATE QUESTION -------- */}
      <h3>Add MCQ Question</h3>

      <textarea
        placeholder="Question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <br /><br />

      {options.map((opt, idx) => (
        <div key={idx}>
          <input
            type="text"
            placeholder={`Option ${idx + 1}`}
            value={opt}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[idx] = e.target.value;
              setOptions(newOptions);
            }}
          />
          <input
            type="radio"
            name="correct"
            checked={correctIndex === idx}
            onChange={() => setCorrectIndex(idx)}
          />
          Correct
        </div>
      ))}

      <br />
      <button onClick={handleCreateQuestion}>Add Question</button>

      <hr />

      {/* -------- QUESTIONS LIST -------- */}
      <h3>Questions in This Round</h3>

      {questions.length === 0 && <p>No questions added yet</p>}

      {questions.map((q, index) => (
        <div
          key={q.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p>
            <b>Q{index + 1}:</b> {q.questionText}
          </p>
          <ul>
            {q.options.map((opt, i) => (
              <li key={i}>
                {opt} {q.correctOptionIndex === i && "✅"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default AdminQuestions;
