function Timer({ seconds }) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      style={{
        fontSize: 18,
        fontWeight: "bold",
        color: "#dc2626",
      }}
    >
      Time Left: {minutes}:{secs < 10 ? "0" : ""}{secs}
    </div>
  );
}

export default Timer;
