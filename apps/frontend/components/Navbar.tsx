import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8, 12, 18, 0.75)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(99, 179, 237, 0.08)",
      }}
    >
      {/* top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 30%, rgba(139,92,246,0.6) 70%, transparent 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* glowing orb icon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-lg opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))",
                border: "1px solid rgba(99,179,237,0.25)",
              }}
            />
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: "0 0 20px rgba(59,130,246,0.4)",
              }}
            />
            <svg
              className="relative z-10 w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8 2V14M2 5.5L14 10.5M14 5.5L2 10.5"
                stroke="url(#logoGrad)"
                strokeWidth="0.75"
                strokeOpacity="0.5"
              />
              <defs>
                <linearGradient id="logoGrad" x1="2" y1="2" x2="14" y2="14">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, #93c5fd 0%, #c4b5fd 60%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            DevPulse
          </span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User chip */}
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: "#22d3ee" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: "#22d3ee" }}
                  />
                </span>
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#93c5fd",
                    letterSpacing: "0.02em",
                  }}
                >
                  {user.githubUsername}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn-ghost text-sm"
                style={{
                  color: "#f87171",
                  borderColor: "rgba(248,113,113,0.2)",
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </button>
            </>
          ) : (
            <button onClick={login} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Login with GitHub
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
