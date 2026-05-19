"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

type Post = { id: string; title: string; content: string };

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #3b82f6 50%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-[3px] rounded-full"
          style={{ background: "var(--bg-void)" }}
        />
      </div>
      <p
        className="text-xs font-medium tracking-widest uppercase animate-pulse"
        style={{
          color: "var(--text-dim)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Fetching posts...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <div
        className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid rgba(99,179,237,0.08)",
        }}
      >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "rgba(59,130,246,0.07)",
          border: "1px solid rgba(99,179,237,0.12)",
        }}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ color: "#3b82f6" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
          No posts yet
        </p>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Be the first to share something
        </p>
      </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetchWithAuth("http://localhost:3000/posts")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [fetchWithAuth]);

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen relative"
        style={{ background: "var(--bg-void)" }}
      >
        {/* Background grid */}
        <div className="grid-bg" />

        {/* Hero top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mb-16">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="h-px flex-1 max-w-[40px]"
                style={{
                  background: "linear-gradient(90deg, #3b82f6, transparent)",
                }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{
                  color: "var(--text-dim)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                v2.0 · live
              </span>
            </div>

            <h1
              className="font-bold leading-none mb-4"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                letterSpacing: "-0.04em",
                background:
                  "linear-gradient(135deg, #e8f0fe 0%, #93c5fd 40%, #c4b5fd 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              DevPulse
            </h1>

            <p
              className="text-base max-w-md"
              style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
            >
              A space for developers to share ideas, spark conversations, and
              build in public.
            </p>
            </div>
          </motion.div>

          {/* Posts feed */}
          {loading && <Loader />}

          {!loading && posts.length === 0 && <EmptyState />}

          <AnimatePresence>
            {!loading && posts.length > 0 && (
              <div className="grid gap-4">
                {posts.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <article
                      className="group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid rgba(99,179,237,0.08)",
                      }}
                    >
                    {/* hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(600px at 0% 50%, rgba(59,130,246,0.04), transparent 60%)",
                        boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.08)",
                      }}
                    />

                    {/* top border flash on hover */}
                    <div
                      className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(59,130,246,0.4) 30%, rgba(139,92,246,0.4) 70%, transparent)",
                      }}
                    />

                    <div className="relative z-10 p-6 md:p-7">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          {/* row: index + tag */}
                          <div className="flex items-center gap-2.5 mb-3">
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{
                                color: "var(--text-dim)",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              #{String(i + 1).padStart(2, "0")}
                            </span>
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{ background: "var(--text-dim)" }}
                            />
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                background: "rgba(139,92,246,0.1)",
                                border: "1px solid rgba(139,92,246,0.2)",
                                color: "#c4b5fd",
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "10px",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              post
                            </span>
                          </div>

                          <Link href={`/posts/${p.id}`}>
                            <h2
                              className="text-xl font-bold mb-2.5 leading-snug transition-colors duration-200 group-hover:text-blue-400"
                              style={{
                                color: "var(--text-primary)",
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {p.title}
                            </h2>
                          </Link>

                          <p
                            className="text-sm leading-relaxed line-clamp-2 mb-5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {p.content}
                          </p>

                          <Link
                            href={`/posts/${p.id}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200"
                            style={{ color: "#3b82f6" }}
                          >
                            Read full post
                            <svg
                              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                              />
                            </svg>
                          </Link>
                        </div>

                        {/* right: decorative number */}
                        <div
                          className="hidden md:flex text-5xl font-bold select-none transition-opacity duration-300 opacity-[0.04] group-hover:opacity-[0.07]"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "#3b82f6",
                            lineHeight: 1,
                            letterSpacing: "-0.05em",
                            userSelect: "none",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                    </article>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
