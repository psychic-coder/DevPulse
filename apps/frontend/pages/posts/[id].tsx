import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../../components/Navbar";

type Post = { id: string; title: string; content: string };
type Comment = { id: string; content: string };

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative w-12 h-12">
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
        <div
          className="absolute inset-[8px] rounded-full animate-pulse"
          style={{ background: "rgba(59,130,246,0.3)" }}
        />
      </div>
      <p
        className="text-sm font-medium tracking-widest uppercase animate-pulse"
        style={{
          color: "var(--text-dim)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Loading...
      </p>
    </div>
  );
}

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:3000/posts/${id}`).then((r) => r.json()),
      fetch(`http://localhost:3000/posts/${id}/comments`).then((r) => r.json()),
    ])
      .then(([p, c]) => {
        setPost(p);
        setComments(Array.isArray(c) ? c : []);
      })
      .catch(() => {
        setPost(null);
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <>
        <Navbar />
        <Loader />
      </>
    );

  if (!post)
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Post not found
            </p>
            <Link href="/" className="btn-ghost inline-flex mt-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to posts
            </Link>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen relative"
        style={{ background: "var(--bg-void)" }}
      >
        {/* Background grid */}
        <div className="grid-bg" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium group transition-colors duration-200"
              style={{ color: "var(--text-dim)" }}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="group-hover:text-blue-400 transition-colors duration-200">
                Back to posts
              </span>
            </Link>
          </motion.div>

          {/* Post article */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10 rounded-2xl overflow-hidden relative"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid rgba(99,179,237,0.1)",
              boxShadow:
                "0 0 60px rgba(59,130,246,0.06), 0 0 0 1px rgba(99,179,237,0.04)",
            }}
          >
            {/* top stripe */}
            <div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(59,130,246,0.5) 30%, rgba(139,92,246,0.5) 70%, transparent)",
              }}
            />

            <div className="p-8 md:p-10">
              {/* meta row */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    color: "#93c5fd",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  #{id}
                </span>
              </div>

              <h1
                className="font-bold mb-6 leading-tight"
                style={{
                  fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                {post.title}
              </h1>

              <div
                className="leading-relaxed text-base"
                style={{ color: "var(--text-secondary)", lineHeight: "1.85" }}
              >
                {post.content}
              </div>
            </div>
          </motion.article>

          {/* Comments section */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid rgba(99,179,237,0.08)",
            }}
          >
            {/* header */}
            <div
              className="px-8 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(99,179,237,0.08)" }}
            >
              <h2
                className="text-base font-bold tracking-tight flex items-center gap-3"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{ color: "#3b82f6" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
                Discussion
              </h2>
              <span
                className="text-sm font-bold tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#3b82f6",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "6px",
                  padding: "2px 10px",
                }}
              >
                {comments.length}
              </span>
            </div>

            <div className="p-8">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(59,130,246,0.06)",
                      border: "1px solid rgba(99,179,237,0.1)",
                    }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      style={{ color: "var(--text-dim)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    No comments yet — be the first
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {comments.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        className="relative flex gap-4 rounded-xl p-4 group"
                        style={{
                          background: "var(--bg-raised)",
                          border: "1px solid rgba(99,179,237,0.06)",
                        }}
                      >
                        {/* left accent line */}
                        <div
                          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                          style={{
                            background:
                              "linear-gradient(180deg, #3b82f6, #8b5cf6)",
                            left: "0",
                            borderRadius: "0 2px 2px 0",
                          }}
                        />
                        <div className="pl-3">
                          {/* comment index */}
                          <span
                            className="text-xs font-semibold mb-1.5 block"
                            style={{
                              color: "var(--text-dim)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            #{String(i + 1).padStart(2, "0")}
                          </span>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {c.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
}
