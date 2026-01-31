import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

function AdminDashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  // CREATE EXAM
  const handleCreateExam = async () => {
    if (!title || !description) {
      alert("Title and description required");
      return;
    }

    try {
      await addDoc(collection(db, "exams"), {
        title,
        description,
        isActive: true,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
      });

      setTitle("");
      setDescription("");
      fetchMyExams();
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  };

  // READ EXAMS CREATED BY THIS ADMIN
  const fetchMyExams = async () => {
    setLoading(true);

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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyExams();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>

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

      <button onClick={handleCreateExam}>Create Exam</button>

      <hr />

      <h3>My Exams</h3>

      {loading && <p>Loading...</p>}

      {!loading && exams.length === 0 && <p>No exams created yet</p>}

      {!loading &&
        exams.map((exam) => (
          <div key={exam.id} style={{ marginBottom: "10px" }}>
            <strong>{exam.title}</strong>
            <p>{exam.description}</p>
          </div>
        ))}
    </div>
  );
}

export default AdminDashboard;
