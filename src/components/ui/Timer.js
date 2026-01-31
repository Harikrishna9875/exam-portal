import { motion } from "framer-motion";

function Timer({ seconds }) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const danger = seconds <= 60;

  return (
    <motion.div
      animate={danger ? { scale: [1, 1.1, 1] } : {}}
      transition={danger ? { repeat: Infinity, duration: 1 } : {}}
      style={{
        fontSize: 18,
        fontWeight: "bold",
        color: danger ? "#ef4444" : "#111827",
      }}
    >
      ⏱ Time Left: {minutes}:{secs < 10 ? "0" : ""}{secs}
    </motion.div>
  );
}

export default Timer;
