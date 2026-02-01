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

/* ---------------- CSV PARSER ---------------- */
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]));
    return obj;
  });
};

function AdminQuestions() {
  const [exams, setExams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");

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

  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snap = await getDocs(q);
    setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchQuestions = async (roundId) => {
    const q = query(
      collection(db, "questions"),
      where("roundId", "==", roundId)
    );
    const snap = await getDocs(q);
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- MANUAL QUESTION ---------------- */
  const handleCreateQuestion = async () => {
    if (!selectedRoundId) return alert("Select round first");

    await addDoc(collection(db, "questions"), {
      roundId: selectedRoundId,
      questionText,
      options,
      correctOptionIndex: correctIndex,
      difficulty,
      createdAt: new Date(),
    });

    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);

    fetchQuestions(selectedRoundId);
  };

  /* ---------------- CSV UPLOAD ---------------- */
  const handleCSVUpload = async (file) => {
    if (!file || !selectedRoundId) {
      alert("Select round before uploading CSV");
      return;
    }

    const text = await file.text();
    const rows = parseCSV(text);

    for (const r of rows) {
      const correctMap = { A: 0, B: 1, C: 2, D: 3 };

      await addDoc(collection(db, "questions"), {
        roundId: selectedRoundId,
        questionText: r.question,
        options: [
          r.optionA,
          r.optionB,
          r.optionC,
          r.optionD,
        ],
        correctOptionIndex: correctMap[r.correct],
        difficulty: r.difficulty || "easy",
        createdAt: new Date(),
      });
    }

    alert("CSV questions uploaded successfully");
    fetchQuestions(selectedRoundId);
  };

  return (
    <Layout title="Manage Questions">
      {/* SELECT EXAM */}
      <Card>
        <h3>Select Exam</h3>
        <select
          style={input}
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            fetchRounds(e.target.value);
          }}
        >
          <option value="">Select Exam</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </Card>

      {/* SELECT ROUND */}
      {rounds.length > 0 && (
        <Card>
          <h3>Select Round</h3>
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

      {/* CSV UPLOAD */}
      {selectedRoundId && (
        <Card>
          <h3>📥 Upload Questions via CSV</h3>
          <p style={helper}>
            Columns: question, optionA, optionB, optionC, optionD, correct, difficulty
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleCSVUpload(e.target.files[0])}
          />
        </Card>
      )}

      {/* MANUAL QUESTION */}
      {selectedRoundId && (
        <Card>
          <h3>Add Single Question</h3>

          <textarea
            style={input}
            placeholder="Question text"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
          />

          {options.map((opt, i) => (
            <input
              key={i}
              style={input}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => {
                const copy = [...options];
                copy[i] = e.target.value;
                setOptions(copy);
              }}
            />
          ))}

          <select
            style={input}
            value={correctIndex}
            onChange={e => setCorrectIndex(+e.target.value)}
          >
            <option value={0}>Option A</option>
            <option value={1}>Option B</option>
            <option value={2}>Option C</option>
            <option value={3}>Option D</option>
          </select>

          <select
            style={input}
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <Button onClick={handleCreateQuestion}>
            Add Question
          </Button>
        </Card>
      )}

      {/* QUESTIONS LIST */}
      {questions.length > 0 && (
        <Card>
          <h3>Questions</h3>
          {questions.map((q, i) => (
            <div key={q.id} style={questionBox}>
              <b>Q{i + 1}</b> {q.questionText}
              <Badge text={q.difficulty} type="info" />
            </div>
          ))}
        </Card>
      )}
    </Layout>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
};

const questionBox = {
  borderBottom: "1px solid #eee",
  padding: "8px 0",
};

export default AdminQuestions;