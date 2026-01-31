import { motion } from "framer-motion";

function Badge({ text, type }) {
  const colors = {
    success: "#22c55e",
    fail: "#ef4444",
    info: "#2563eb",
    warning: "#f59e0b",
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        background: colors[type],
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
      }}
    >
      {text}
    </motion.span>
  );
}

export default Badge;
