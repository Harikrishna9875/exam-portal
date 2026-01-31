import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { signOut } from "firebase/auth";

function StudentCertificate() {
  const [qualifiedAttempts, setQualifiedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------- LOGOUT -------- */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* -------- FETCH QUALIFIED ATTEMPTS -------- */
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

      // fetch exams and rounds for names
      const examsSnap = await getDocs(collection(db, "exams"));
      const roundsSnap = await getDocs(collection(db, "rounds"));

      const examsMap = {};
      examsSnap.docs.forEach((d) => (examsMap[d.id] = d.data()));

      const roundsMap = {};
      roundsSnap.docs.forEach((d) => (roundsMap[d.id] = d.data()));

      const finalData = attempts.map((a) => ({
        ...a,
        examTitle: examsMap[a.examId]?.title || "Exam",
        roundNumber: roundsMap[a.roundId]?.roundNumber || "-",
      }));

      setQualifiedAttempts(finalData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  /* -------- GENERATE PDF -------- */
  const generateCertificate = (attempt) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("CERTIFICATE OF QUALIFICATION", 105, 30, {
      align: "center",
    });

    doc.setFontSize(14);
    doc.text(
      `This is to certify that`,
      105,
      50,
      { align: "center" }
    );

    doc.setFontSize(18);
    doc.text(
      auth.currentUser.email,
      105,
      65,
      { align: "center" }
    );

    doc.setFontSize(14);
    doc.text(
      `has successfully qualified in`,
      105,
      80,
      { align: "center" }
    );

    doc.setFontSize(16);
    doc.text(
      `${attempt.examTitle} - Round ${attempt.roundNumber}`,
      105,
      95,
      { align: "center" }
    );

    doc.setFontSize(14);
    doc.text(
      `with a percentile of ${attempt.percentile}%`,
      105,
      110,
      { align: "center" }
    );

    doc.text(
      `Date: ${new Date(attempt.submittedAt.seconds * 1000).toDateString()}`,
      105,
      130,
      { align: "center" }
    );

    doc.text(
      `Authorized by Exam Portal`,
      105,
      160,
      { align: "center" }
    );

    doc.save(`Certificate_${attempt.examTitle}.pdf`);
  };

  useEffect(() => {
    fetchQualifiedAttempts();
  }, []);

  /* -------- UI -------- */
  return (
    <div style={{ padding: 20 }}>
      <h2>My Certificates</h2>
      <button onClick={handleLogout}>Logout</button>

      <hr />

      {loading && <p>Loading certificates...</p>}

      {!loading && qualifiedAttempts.length === 0 && (
        <p>No certificates available yet</p>
      )}

      {!loading &&
        qualifiedAttempts.map((a) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p><b>Exam:</b> {a.examTitle}</p>
            <p><b>Round:</b> {a.roundNumber}</p>
            <p><b>Percentile:</b> {a.percentile}%</p>
            <button onClick={() => generateCertificate(a)}>
              Download Certificate
            </button>
          </div>
        ))}
    </div>
  );
}

export default StudentCertificate;
