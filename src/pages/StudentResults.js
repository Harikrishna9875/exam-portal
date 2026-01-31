import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";

import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

function StudentResults() {
  const [results, setResults] = useState([]);
  const [examMap, setExamMap] = useState({});
  const [roundMap, setRoundMap] = useState({});

  const fetchMeta = async () => {
    const examsSnap = await getDocs(collection(db, "exams"));
    const roundsSnap = await getDocs(collection(db, "rounds"));

    const eMap = {};
    examsSnap.docs.forEach(d => (eMap[d.id] = d.data().title));

    const rMap = {};
    roundsSnap.docs.forEach(d => (rMap[d.id] = d.data().roundNumber));

    setExamMap(eMap);
    setRoundMap(rMap);
  };

  const fetchResults = async () => {
    const q = query(
      collection(db, "attempts"),
      where("userId", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchMeta();
    fetchResults();
  }, []);

  return (
    <Layout title="My Exam Results">
      {results.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <h3>{examMap[r.examId]}</h3>

            <p><b>Round:</b> Round {roundMap[r.roundId]}</p>
            <p><b>Total Questions:</b> {r.totalQuestions}</p>
            <p><b>Attempted:</b> {r.attempted}</p>
            <p><b>Correct:</b> {r.correct}</p>
            <p><b>Accuracy:</b> {r.percentile}%</p>

            {r.qualified ? (
              <Badge text="Qualified 🎉" type="success" />
            ) : (
              <Badge text="Not Qualified ❌" type="fail" />
            )}
          </Card>
        </motion.div>
      ))}
    </Layout>
  );
}

export default StudentResults;
