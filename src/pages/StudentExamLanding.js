import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function StudentExamLanding() {
  const { examSlug } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH EXAM (STABLE) ---------------- */
  const fetchExam = useCallback(async () => {
    setLoading(true);

    const q = query(
      collection(db, "exams"),
      where("examSlug", "==", examSlug),
      where("isPublic", "==", true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      setExam(null);
      setLoading(false);
      return;
    }

    const examDoc = snap.docs[0];
    const examData = { id: examDoc.id, ...examDoc.data() };
    setExam(examData);

    const rQ = query(
      collection(db, "rounds"),
      where("examId", "==", examDoc.id)
    );
    const rSnap = await getDocs(rQ);
    setRounds(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    setLoading(false);
  }, [examSlug]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <Layout title="Loading">
        <p>Loading exam details…</p>
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout title="Exam Not Found">
        <Card>
          <h3>Exam not available</h3>
          <p>This exam link is invalid or no longer public.</p>
        </Card>
      </Layout>
    );
  }

  const now = new Date();
  const startAt = exam.examStartAt?.toDate();
  const endAt = exam.examEndAt?.toDate();

  const examStatus =
    now < startAt
      ? "upcoming"
      : now > endAt
      ? "ended"
      : "live";

  /* ---------------- UI ---------------- */
  return (
    <Layout title={exam.title}>
      {/* HEADER */}
      <Card>
        <h2>{exam.title}</h2>
        <p>{exam.description}</p>

        <Badge text={exam.schoolName} type="info" />
        <br /><br />

        {examStatus === "upcoming" && (
          <Badge text="Upcoming Exam" type="warning" />
        )}
        {examStatus === "live" && (
          <Badge text="Live Now" type="success" />
        )}
        {examStatus === "ended" && (
          <Badge text="Exam Ended" type="fail" />
        )}
      </Card>

      {/* SCHEDULE */}
      <Card>
        <h3>📅 Exam Schedule</h3>
        <p><b>Starts:</b> {startAt?.toLocaleString()}</p>
        <p><b>Ends:</b> {endAt?.toLocaleString()}</p>
        <p>
          <b>Results:</b>{" "}
          {exam.resultPublishAt?.toDate().toLocaleString()}
        </p>
      </Card>

      {/* ROUNDS */}
      <Card>
        <h3>🧪 Rounds</h3>
        {rounds.map(r => (
          <div key={r.id} style={row}>
            <div>
              <b>Round {r.roundNumber}</b>
              <p>{r.durationMinutes} minutes</p>
            </div>
            <Badge
              text={r.isPaid ? "Paid" : "Free"}
              type={r.isPaid ? "warning" : "success"}
            />
          </div>
        ))}
      </Card>

      {/* CTA */}
      <Card>
        {examStatus === "upcoming" && (
          <Button disabled>Exam not started yet</Button>
        )}

        {examStatus === "live" && (
          <Button onClick={() => navigate("/student/exams")}>
            Enter Exam
          </Button>
        )}

        {examStatus === "ended" && (
          <Button type="secondary" disabled>
            Exam Ended
          </Button>
        )}
      </Card>
    </Layout>
  );
}

const row = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};

export default StudentExamLanding;