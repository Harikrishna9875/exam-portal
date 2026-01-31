import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function AdminDashboard() {
  /* ---------------- AUTH ---------------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* ---------------- EXAM STATE ---------------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  /* ---------------- ROUND STATE ---------------- */
  const [selectedExamId, setSelectedExamId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [cutoffPercentile, setCutoffPercentile] = useState(60);
  const [isPaidRound, setIsPaidRound] = useState(false);
  const [rounds, setRounds] = useState([]);

  /* ---------------- CREATE EXAM ---------------- */
  const handleCreateExam = async () => {
    if (!title || !description) {
      alert("Title and description are required");
      return;
    }

    try {
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
      setIsPublic(true);

      fetchMyExams();
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Failed to create exam");
    }
  };

  /* ---------------- FETCH MY EXAMS ---------------- */
  const fetchMyExams = async () => {
    setLoadingExams(true);
    try {
      const examsRef = collection(db, "exams");
      const q = query(
        examsRef,
        where("createdBy", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExams(data);
      setLoadingExams(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoadingExams(false);
    }
  };

  /* ---------------- CREATE ROUND ---------------- */
  const handleCreateRound = async () => {
    if (!selectedExamId) {
      alert("Please select an exam");
      return;
    }

    try {
      await addDoc(collection(db, "rounds"), {
        examId: selectedExamId,
        roundNumber,
        durationMinutes,
        cutoffPercentile,
        isPaid: isPaidRound,
        isActive: true,
        startTime: new Date(),
        endTime: new Date(
          new Date().getTime() + durationMinutes * 60000
        ),
        createdAt: new Date(),
      });

      setRoundNumber(roundNumber + 1);
      fetchRounds(selectedExamId);
    } catch (error) {
      console.error("Error creating round:", error);
      alert("Failed to create round");
    }
  };

  /* ---------------- FETCH ROUNDS ---------------- */
  const fetchRounds = async (examId) => {
    try {
      const roundsRef = collection(db, "rounds");
      const q = query(roundsRef, where("examId", "==", examId));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRounds(data);
    } catch (error) {
      console.error("Error fetching rounds:", error);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchMyExams();
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>

      {/* -------- CREATE EXAM -------- */}
      <hr />
      <h3>Create New Exam</h3>

      <input
        type="text"
        placeholder="Exam title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <br /><br />

      <textarea
        placeholder="Exam description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        &nbsp; Make this exam public
      </label>

      <br /><br />
      <button onClick={handleCreateExam}>Create Exam</button>

      {/* -------- MY EXAMS -------- */}
      <hr />
      <h3>My Exams</h3>

      {loadingExams && <p>Loading exams...</p>}
      <a href="/admin/results">
  <button>View Exam Results</button>
</a>


      {!loadingExams && exams.length === 0 && (
        <p>No exams created yet</p>
      )}

      {!loadingExams &&
        exams.map((exam) => (
          <div
            key={exam.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <strong>{exam.title}</strong>
            <p>{exam.description}</p>
            <p>
              Visibility:{" "}
              <b>{exam.isPublic ? "Public" : "Private"}</b>
            </p>
          </div>
        ))}

      {/* -------- ROUND MANAGEMENT -------- */}
      <hr />
      <h3>Manage Rounds</h3>

      <select
        value={selectedExamId}
        onChange={(e) => {
          setSelectedExamId(e.target.value);
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

      <br /><br />

      <input
        type="number"
        placeholder="Round Number"
        value={roundNumber}
        onChange={(e) => setRoundNumber(Number(e.target.value))}
      />
      <br /><br />

      <input
        type="number"
        placeholder="Duration (minutes)"
        value={durationMinutes}
        onChange={(e) =>
          setDurationMinutes(Number(e.target.value))
        }
      />
      <br /><br />

      <input
        type="number"
        placeholder="Cutoff Percentile"
        value={cutoffPercentile}
        onChange={(e) =>
          setCutoffPercentile(Number(e.target.value))
        }
      />
      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={isPaidRound}
          onChange={(e) => setIsPaidRound(e.target.checked)}
        />
        &nbsp; Paid Round
      </label>

      <br /><br />
      <button onClick={handleCreateRound}>Create Round</button>

      {/* -------- ROUNDS LIST -------- */}
      <hr />
      <h4>Rounds for Selected Exam</h4>

      {rounds.length === 0 && (
        <p>No rounds created for this exam</p>
      )}

      {rounds.map((round) => (
        <div
          key={round.id}
          style={{
            border: "1px solid #999",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p><b>Round:</b> {round.roundNumber}</p>
          <p><b>Duration:</b> {round.durationMinutes} minutes</p>
          <p><b>Cutoff:</b> {round.cutoffPercentile}%</p>
          <p><b>Type:</b> {round.isPaid ? "Paid" : "Free"}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
