import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { motion } from "framer-motion";

function Navbar({ title }) {
  return (
    <div
      style={{
        background: "#4f46e5",
        color: "white",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => signOut(auth)}
        style={{
          background: "white",
          color: "#4f46e5",
          border: "none",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Logout
      </motion.button>
    </div>
  );
}

export default Navbar;
