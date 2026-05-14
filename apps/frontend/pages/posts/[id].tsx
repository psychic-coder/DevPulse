import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "../../components/Navbar";

type Post = { id: string; title: string; content: string };
type Comment = { id: string; content: string };

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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading post...</p>
          </div>
        </div>
      </>
    );

  if (!post)
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg text-gray-600">Post not found</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
            >
              ← Back to posts
            </Link>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium"
          >
            <span className="mr-1">←</span>
            Back to posts
          </Link>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-12"
          >
            <h1 className="text-4xl font-bold mb-6 text-gray-900">
              {post.title}
            </h1>
            <div className="prose prose-lg text-gray-700 leading-relaxed max-w-none">
              {post.content}
            </div>
          </motion.article>

          <section className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-800 px-3 py-1">
                {comments.length}
              </span>
              Comments
            </h2>

            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                  >
                    <p className="text-gray-700 leading-relaxed">{c.content}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
