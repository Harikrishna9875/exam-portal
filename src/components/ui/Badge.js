function Badge({ text, type }) {
  const colors = {
    success: "green",
    fail: "red",
    info: "#2563eb",
    warning: "#d97706",
  };

  return (
    <span
      style={{
        color: colors[type],
        fontWeight: "bold",
      }}
    >
      {text}
    </span>
  );
}

export default Badge;
