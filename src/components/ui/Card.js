import { motion } from "framer-motion";

function Card({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </motion.div>
  );
}

export default Card;
