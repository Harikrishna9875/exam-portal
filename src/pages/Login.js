import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("No role assigned to this user.");
        setLoading(false);
        return;
      }

      const role = userDoc.data().role;

      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "student") {
        window.location.href = "/student";
      } else {
        setError("Invalid role assigned to this user.");
      }
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError("Unable to send reset email.");
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
        <h2 style={{ marginBottom: 8 }}>Welcome Back</h2>
        <p style={{ marginBottom: 24, color: "#555" }}>
          Login to continue to the exam portal
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
          placeholder="Password"
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

        {/* Login Button */}
        <button
          onClick={handleLogin}
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
            marginBottom: 12,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Forgot Password */}
        <button
          onClick={handleForgotPassword}
          style={{
            background: "none",
            border: "none",
            color: "#4f46e5",
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          Forgot password?
        </button>

        {/* Signup */}
        <p style={{ textAlign: "center" }}>
          New student?{" "}
          <a href="/signup" style={{ color: "#4f46e5" }}>
            Create an account
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

export default Login;