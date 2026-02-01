import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function PublicExamPage() {
  const { examSlug } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  /* ---------------- FETCH EXAM ---------------- */
  useEffect(() => {
    const fetchExam = async () => {
      const q = query(
        collection(db, "exams"),
        where("examSlug", "==", examSlug),
        where("isPublic", "==", true)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setExam(null);
      } else {
        setExam({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setLoading(false);
    };

    fetchExam();
  }, [examSlug]);

  /* ---------------- LIVE CLOCK ---------------- */
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  if (loading) return <Layout title="Loading...">Loading…</Layout>;
  if (!exam) return <Layout title="Invalid Exam">Exam not found</Layout>;

  const start = exam.examStartAt.toDate();
  const end = exam.examEndAt.toDate();
  const resultTime = exam.resultPublishAt.toDate();

  const isBefore = now < start;
  const isDuring = now >= start && now <= end;
  const isAfter = now > end;
  const isResultLive = now >= resultTime;

  return (
    <Layout title={exam.title}>
      <Card>
        <h2>{exam.title}</h2>
        <p><b>School:</b> {exam.schoolName}</p>

        <Badge
          text={isBefore ? "Upcoming" : isDuring ? "Live" : "Completed"}
          type={isDuring ? "success" : "info"}
        />

        <hr />

        {isBefore && (
          <>
            <p>🕒 Exam starts at:</p>
            <b>{start.toLocaleString()}</b>
            <p style={{ marginTop: 12 }}>
              Please login before exam time.
            </p>
          </>
        )}

        {isDuring && (
          <>
            <p>🟢 Exam is live now</p>
            <Button
              onClick={() => {
                if (!auth.currentUser) {
                  navigate("/");
                } else {
                  navigate("/student/exams");
                }
              }}
            >
              Start Exam
            </Button>
          </>
        )}

        {isAfter && !isResultLive && (
          <p>❌ Exam has ended. Results not published yet.</p>
        )}

        {isResultLive && (
          <>
            <p>📢 Results are published</p>
            <Button
              onClick={() => {
                if (!auth.currentUser) {
                  navigate("/");
                } else {
                  navigate("/student/results");
                }
              }}
            >
              View Results
            </Button>
          </>
        )}
      </Card>
    </Layout>
  );
}

export default PublicExamPage;