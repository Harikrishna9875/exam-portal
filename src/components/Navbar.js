import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar({ title }) {
  return (
    <div
      style={{
        background: "#4f46e5",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3>{title}</h3>
      <button
        style={{ background: "white", color: "#4f46e5" }}
        onClick={() => signOut(auth)}
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;
