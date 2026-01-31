import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

/* ---------------- COMPONENT ---------------- */
function StudentCertificate() {
  const [qualifiedAttempts, setQualifiedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchQualifiedAttempts = async () => {
      try {
        const q = query(
          collection(db, "attempts"),
          where("userId", "==", auth.currentUser.uid),
          where("qualified", "==", true)
        );

        const attemptsSnapshot = await getDocs(q);
        const attempts = attemptsSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const examsSnap = await getDocs(collection(db, "exams"));
        const roundsSnap = await getDocs(collection(db, "rounds"));

        const examsMap = {};
        examsSnap.docs.forEach((d) => {
          examsMap[d.id] = d.data().title;
        });

        const roundsMap = {};
        roundsSnap.docs.forEach((d) => {
          roundsMap[d.id] = d.data().roundNumber;
        });

        const finalData = attempts.map((a) => ({
          ...a,
          examTitle: examsMap[a.examId] || "Exam",
          roundNumber: roundsMap[a.roundId] || "-",
        }));

        setQualifiedAttempts(finalData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchQualifiedAttempts();
  }, []);

  /* ---------------- PDF ---------------- */
  const generateCertificate = (attempt) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("CERTIFICATE OF QUALIFICATION", 105, 30, { align: "center" });

    doc.setFontSize(14);
    doc.text("This is to certify that", 105, 55, { align: "center" });

    doc.setFontSize(18);
    doc.text(auth.currentUser.email, 105, 70, { align: "center" });

    doc.setFontSize(14);
    doc.text("has successfully qualified in", 105, 90, { align: "center" });

    doc.setFontSize(16);
    doc.text(
      `${attempt.examTitle} (Round ${attempt.roundNumber})`,
      105,
      105,
      { align: "center" }
    );

    doc.setFontSize(14);
    doc.text(
      `Accuracy: ${attempt.percentile}%`,
      105,
      120,
      { align: "center" }
    );

    doc.text(
      `Date: ${new Date(
        attempt.submittedAt.seconds * 1000
      ).toDateString()}`,
      105,
      140,
      { align: "center" }
    );

    doc.text("Authorized by Exam Portal", 105, 165, { align: "center" });

    doc.save(`Certificate_${attempt.examTitle}.pdf`);
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ minHeight: "100vh", background: "#f4f6ff" }}>
      {/* Header */}
      <div
        style={{
          background: "#4f46e5",
          color: "#fff",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>🏆 My Certificates</h2>
        <button
          onClick={handleLogout}
          style={{
            background: "#fff",
            color: "#4f46e5",
            border: "none",
            padding: "8px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {loading && <p>Loading your achievements...</p>}

        {!loading && qualifiedAttempts.length === 0 && (
          <p>No certificates yet. Keep trying 💪</p>
        )}

        {!loading &&
          qualifiedAttempts.map((a, index) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 20,
                marginBottom: 16,
                boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{a.examTitle}</h3>

              <p><b>Round:</b> {a.roundNumber}</p>
              <p><b>Accuracy:</b> {a.percentile}%</p>

              <button
                onClick={() => generateCertificate(a)}
                style={{
                  marginTop: 10,
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Download Certificate 🎉
              </button>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

export default StudentCertificate;
