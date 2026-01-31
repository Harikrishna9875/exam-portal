function Card({ children }) {
  return (
    <div
      style={{
        background: "white",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

export default Card;
