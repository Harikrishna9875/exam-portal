import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useEffect, useState } from "react";

function ProtectedRoute({ children, allowedRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          setAuthorized(false);
        } else {
          setAuthorized(snap.data().role === allowedRole);
        }
      } catch (err) {
        setAuthorized(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [allowedRole]);

  if (loading) {
    return <p style={{ padding: 40 }}>Checking access…</p>;
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;