import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useEffect, useState } from "react";

function ProtectedRoute({ children, allowedRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const role = userDoc.data().role;

      if (role === allowedRole) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedRole]);

  if (loading) return <p>Loading...</p>;

  if (!authorized) return <Navigate to="/" />;

  return children;
}

export default ProtectedRoute;
