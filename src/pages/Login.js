import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("No role assigned to this user");
        return;
      }

      const role = userDoc.data().role;
if (role === "admin") {
  window.location.href = "/admin";
} else if (role === "student") {
  window.location.href = "/student";
} else {
  alert("Invalid role");
}
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
  if (!email) {
    alert("Please enter your email first");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent. Check your inbox.");
  } catch (err) {
    alert(err.message);
  }
};


  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogin}>Login</button>

<br /><br />
<button onClick={handleForgotPassword}>
  Forgot Password?
</button>


      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;
