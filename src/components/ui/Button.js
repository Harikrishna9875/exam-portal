function Button({ children, onClick, disabled = false, type = "primary" }) {
  const styles = {
    primary: {
      background: "#4f46e5",
      color: "white",
    },
    danger: {
      background: "#dc2626",
      color: "white",
    },
    secondary: {
      background: "#e5e7eb",
      color: "#111827",
    },
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        ...styles[type],
      }}
    >
      {children}
    </button>
  );
}

export default Button;
