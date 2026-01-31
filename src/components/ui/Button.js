import { motion } from "framer-motion";

function Button({
  children,
  onClick,
  disabled = false,
  type = "primary",
}) {
  const styles = {
    primary: {
      background: "#4f46e5",
      color: "white",
    },
    danger: {
      background: "#ef4444",
      color: "white",
    },
    secondary: {
      background: "#e5e7eb",
      color: "#111827",
    },
    success: {
      background: "#22c55e",
      color: "white",
    },
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "bold",
        fontSize: 14,
        opacity: disabled ? 0.6 : 1,
        ...styles[type],
      }}
    >
      {children}
    </motion.button>
  );
}

export default Button;
