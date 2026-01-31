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

function AdminCreateTest() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [myExams, setMyExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  const [roundNumber, setRoundNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [cutoffPercentile, setCutoffPercentile] = useState(60);
  const [isPaid, setIsPaid] = useState(false);
  const [rounds, setRounds] = useState([]);

  /* ---------------- FETCH DATA ---------------- */
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

  /* ---------------- CREATE TEST ---------------- */
  const handleCreateExam = async () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "exams"), {
      title,
      description,
      isPublic,
      isActive: true,
      createdBy: auth.currentUser.uid,
      createdAt: new Date(),
    });

    setTitle("");
    setDescription("");
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

  return (
    <Layout title="Create Test & Rounds">
      {/* ---------------- CREATE TEST ---------------- */}
      <Card>
        <h3>Create New Test</h3>
        <p style={helper}>
          A test is the main exam (example: “Math Olympiad 2026”).
        </p>

        <input
          style={input}
          placeholder="Test Title (e.g. Math Olympiad 2026)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <textarea
          style={input}
          placeholder="Short description about this test"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
          />{" "}
          Public Test (visible to students)
        </label>

        <br /><br />
        <Button onClick={handleCreateExam}>Create Test</Button>
      </Card>

      {/* ---------------- SELECT TEST ---------------- */}
      {myExams.length > 0 && (
        <Card>
          <h3>Select Test</h3>
          <p style={helper}>
            Choose the test for which you want to create rounds.
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
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* ---------------- ADD ROUND ---------------- */}
      {selectedExamId && (
        <Card>
          <h3>Add Round</h3>

          <div style={infoBox}>
            <b>What is a Round?</b>
            <p style={{ marginTop: 6 }}>
              A round is a stage of the test.  
              Example: Round 1 (Free), Round 2 (Paid), Final Round.
            </p>
          </div>

          <label>Round Number</label>
          <p style={helper}>
            Sequence of the round (1 = first round, 2 = next round).
          </p>
          <input
            style={input}
            type="number"
            value={roundNumber}
            onChange={e => setRoundNumber(+e.target.value)}
          />

          <label>Duration (minutes)</label>
          <p style={helper}>
            Total time students get to complete this round.
          </p>
          <input
            style={input}
            type="number"
            value={durationMinutes}
            onChange={e => setDurationMinutes(+e.target.value)}
          />

          <label>Cutoff Percentile</label>
          <p style={helper}>
            Minimum accuracy required to qualify for the next round.
          </p>
          <input
            style={input}
            type="number"
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
          <p style={helper}>
            If enabled, students must pay to attempt this round.
          </p>

          <br />
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

const infoBox = {
  background: "#f1f5f9",
  padding: 12,
  borderRadius: 6,
  marginBottom: 12,
};

export default AdminCreateTest;