import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function AdminQuestions() {
  /* ---------------- STATE ---------------- */
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  
  /* ---------------- FETCH EXAMS ---------------- */
  useEffect(() => {
    const fetchMyExams = async () => {
      const q = query(
        collection(db, "exams"),
        where("createdBy", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchMyExams();
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

  /* ---------------- FETCH QUESTIONS ---------------- */
  const fetchQuestions = async (roundId) => {
    const q = query(
      collection(db, "questions"),
      where("roundId", "==", roundId)
    );
    const snap = await getDocs(q);
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- CREATE QUESTION ---------------- */
  const handleCreateQuestion = async () => {
    if (!selectedRoundId || !questionText.trim()) {
      alert("Please select a round and enter a question");
      return;
    }

    if (options.some(opt => opt.trim() === "")) {
      alert("All options must be filled");
      return;
    }

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
  };

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Manage Questions">
      {/* -------- EXPLANATION -------- */}
      <Card>
        <h3>📘 How Questions Work</h3>
        <p>
          Each question belongs to a <b>round</b>.  
          Students must answer these MCQs during the exam.
        </p>
        <ul>
          <li>✔ One correct option per question</li>
          <li>✔ No negative marking</li>
          <li>✔ Used for auto-evaluation</li>
        </ul>
      </Card>

      {/* -------- SELECT EXAM -------- */}
      <Card>
        <h3>1️⃣ Select Exam</h3>
        <select
          style={input}
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setSelectedRoundId("");
            setQuestions([]);
            fetchRounds(e.target.value);
          }}
        >
          <option value="">Select Exam</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </Card>

      {/* -------- SELECT ROUND -------- */}
      {rounds.length > 0 && (
        <Card>
          <h3>2️⃣ Select Round</h3>
          <select
            style={input}
            value={selectedRoundId}
            onChange={(e) => {
              setSelectedRoundId(e.target.value);
              fetchQuestions(e.target.value);
            }}
          >
            <option value="">Select Round</option>
            {rounds.map(r => (
              <option key={r.id} value={r.id}>
                Round {r.roundNumber}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* -------- ADD QUESTION -------- */}
      {selectedRoundId && (
        <Card>
          <h3>3️⃣ Add MCQ Question</h3>

          <textarea
            style={input}
            placeholder="Enter question text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />

          {options.map((opt, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <input
                style={input}
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const copy = [...options];
                  copy[idx] = e.target.value;
                  setOptions(copy);
                }}
              />
              <label style={{ marginLeft: 10 }}>
                <input
                  type="radio"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                /> Correct
              </label>
            </div>
          ))}

          <Button onClick={handleCreateQuestion}>
            Add Question
          </Button>
        </Card>
      )}

      {/* -------- QUESTIONS LIST -------- */}
      {questions.length > 0 && (
        <Card>
          <h3>📋 Questions in This Round</h3>

          {questions.map((q, i) => (
            <div key={q.id} style={questionBox}>
              <p><b>Q{i + 1}.</b> {q.questionText}</p>
              <ul>
                {q.options.map((opt, idx) => (
                  <li key={idx}>
                    {opt}{" "}
                    {idx === q.correctOptionIndex && (
                      <Badge text="Correct" type="success" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      )}
    </Layout>
  );
}

/* ---------------- STYLES ---------------- */

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
};

const questionBox = {
  borderBottom: "1px solid #eee",
  paddingBottom: 10,
  marginBottom: 10,
};

export default AdminQuestions;