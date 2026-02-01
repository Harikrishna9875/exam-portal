import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

/* ---------------- UTILITY: FIX datetime-local ---------------- */
/* Converts datetime-local string to LOCAL Date (IST safe) */
const toLocalDate = (value) => {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

function AdminCreateTest() {
  /* ---------------- EXAM STATE ---------------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [examStartAt, setExamStartAt] = useState("");
  const [examEndAt, setExamEndAt] = useState("");
  const [resultPublishAt, setResultPublishAt] = useState("");

  /* ---------------- ROUND STATE ---------------- */
  const [myExams, setMyExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  const [roundNumber, setRoundNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [cutoffPercentile, setCutoffPercentile] = useState(60);
  const [isPaid, setIsPaid] = useState(false);
  const [rounds, setRounds] = useState([]);

  /* ---------------- FETCH EXAMS ---------------- */
  const fetchMyExams = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "exams"),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    setMyExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchRounds = async (examId) => {
    const q = query(
      collection(db, "rounds"),
      where("examId", "==", examId)
    );
    const snap = await getDocs(q);
    setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- CREATE EXAM ---------------- */
  const handleCreateExam = async () => {
    if (
      !title ||
      !description ||
      !schoolName ||
      !examStartAt ||
      !examEndAt ||
      !resultPublishAt
    ) {
      alert("Please fill all exam details");
      return;
    }

    const slug = `${title}-${schoolName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    await addDoc(collection(db, "exams"), {
      title,
      description,
      schoolName,
      examSlug: slug,

      examStartAt: Timestamp.fromDate(toLocalDate(examStartAt)),
      examEndAt: Timestamp.fromDate(toLocalDate(examEndAt)),
      resultPublishAt: Timestamp.fromDate(toLocalDate(resultPublishAt)),

      isPublic,
      isActive: true,
      createdBy: auth.currentUser.uid,
      createdAt: new Date(),
    });

    // reset form
    setTitle("");
    setDescription("");
    setSchoolName("");
    setExamStartAt("");
    setExamEndAt("");
    setResultPublishAt("");

    fetchMyExams();
  };

  /* ---------------- CREATE ROUND ---------------- */
  const handleCreateRound = async () => {
    if (!selectedExamId) {
      alert("Please select a test first");
      return;
    }

    await addDoc(collection(db, "rounds"), {
      examId: selectedExamId,
      roundNumber,
      durationMinutes,
      cutoffPercentile,
      isPaid,
      isActive: true,
      createdAt: new Date(),
    });

    setRoundNumber(r => r + 1);
    fetchRounds(selectedExamId);
  };

  useEffect(() => {
    fetchMyExams();
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <Layout title="Create Test & Rounds">
      {/* ---------------- CREATE TEST ---------------- */}
      <Card>
        <h3>Create New Test</h3>
        <p style={helper}>
          This defines the official exam conducted by your school or college.
        </p>

        <input
          style={input}
          placeholder="Exam Title (e.g. Maths Olympiad 2026)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          style={input}
          placeholder="School / College Name"
          value={schoolName}
          onChange={e => setSchoolName(e.target.value)}
        />

        <textarea
          style={input}
          placeholder="Short description of the exam"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <label>Exam Start Date & Time</label>
        <p style={helper}>
          Students can start attempting only after this time.
        </p>
        <input
          style={input}
          type="datetime-local"
          value={examStartAt}
          onChange={e => setExamStartAt(e.target.value)}
        />

        <label>Exam End Date & Time</label>
        <p style={helper}>
          Exam automatically closes after this time.
        </p>
        <input
          style={input}
          type="datetime-local"
          value={examEndAt}
          onChange={e => setExamEndAt(e.target.value)}
        />

        <label>Result Publish Date & Time</label>
        <p style={helper}>
          Results remain hidden until this time.
        </p>
        <input
          style={input}
          type="datetime-local"
          value={resultPublishAt}
          onChange={e => setResultPublishAt(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
          />{" "}
          Public Exam (visible to students)
        </label>

        <br /><br />
        <Button onClick={handleCreateExam}>Create Test</Button>
      </Card>

      {/* ---------------- SELECT TEST ---------------- */}
      {myExams.length > 0 && (
        <Card>
          <h3>Select Test</h3>
          <p style={helper}>
            Choose a test to add rounds.
          </p>

          <select
            style={input}
            value={selectedExamId}
            onChange={e => {
              setSelectedExamId(e.target.value);
              fetchRounds(e.target.value);
            }}
          >
            <option value="">Select Test</option>
            {myExams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </Card>
      )}

      {/* ---------------- ADD ROUND ---------------- */}
      {selectedExamId && (
        <Card>
          <h3>Add Round</h3>
          <p style={helper}>
            A round is a stage of the exam (Free / Paid).
          </p>

          <input
            style={input}
            type="number"
            placeholder="Round Number"
            value={roundNumber}
            onChange={e => setRoundNumber(+e.target.value)}
          />

          <input
            style={input}
            type="number"
            placeholder="Duration (minutes)"
            value={durationMinutes}
            onChange={e => setDurationMinutes(+e.target.value)}
          />

          <input
            style={input}
            type="number"
            placeholder="Cutoff Percentile"
            value={cutoffPercentile}
            onChange={e => setCutoffPercentile(+e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={isPaid}
              onChange={e => setIsPaid(e.target.checked)}
            />{" "}
            Paid Round
          </label>

          <br /><br />
          <Button onClick={handleCreateRound}>Add Round</Button>
        </Card>
      )}

      {/* ---------------- ROUNDS LIST ---------------- */}
      {rounds.length > 0 && (
        <Card>
          <h3>Existing Rounds</h3>
          {rounds.map(r => (
            <div key={r.id} style={row}>
              <b>Round {r.roundNumber}</b>
              <span>{r.durationMinutes} min</span>
              <Badge text={r.isPaid ? "Paid" : "Free"} type="info" />
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

const row = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #eee",
};

const helper = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 6,
};

export default AdminCreateTest;