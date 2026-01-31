import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- SIGNUP ---------------- */
  const handleSignup = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Create Firestore user doc
      await setDoc(doc(db, "users", user.uid), {
        role: "student",
        email,
        createdAt: new Date(),
      });

      // Redirect
      window.location.href = "/student";
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Unable to create account. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "#ffffff",
          padding: 32,
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Create Student Account</h2>
        <p style={{ marginBottom: 24, color: "#555" }}>
          Sign up to start attempting exams
        </p>

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {/* Error */}
        {error && (
          <p style={{ color: "#dc2626", marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 16,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {/* Login Link */}
        <p style={{ textAlign: "center" }}>
          Already have an account?{" "}
          <a href="/" style={{ color: "#4f46e5" }}>
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}

/* ---------------- INPUT STYLE ---------------- */
const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: 16,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

export default Signup;