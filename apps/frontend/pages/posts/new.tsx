import { useState } from "react";
import { useRouter } from "next/router";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

export default function NewPostPage() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("http://localhost:3000/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      router.push(`/posts/${created.id}`);
    } catch (err) {
      console.error(err);
      alert("Could not create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">New Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Create new post">
          <input
            className="w-full p-3 rounded-lg bg-white/5 border border-white/5"
            placeholder="Title"
            aria-label="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full p-3 rounded-lg bg-white/5 border border-white/5 min-h-[220px]"
            placeholder="Write your post content..."
            aria-label="Post content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="flex items-center gap-3">
            <button disabled={submitting || !title.trim() || !content.trim()} className="btn-primary">
              {submitting ? "Creating..." : "Create Post"}
            </button>
            <button type="button" onClick={() => router.push('/')} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
