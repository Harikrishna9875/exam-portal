import Navbar from "./Navbar";
import { motion } from "framer-motion";

function Layout({ title, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f6ff" }}>
      <Navbar title={title} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 16px",
        }}
      >
        {/* Page Title */}
        {title && (
          <h2
            style={{
              marginBottom: 20,
              color: "#1f2937",
            }}
          >
            {title}
          </h2>
        )}

        {children}
      </motion.div>
    </div>
  );
}

export default Layout;
