import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Navbar } from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const { fetchWithAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchWithAuth(`http://localhost:3000/posts/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setTitle(p.title || "");
        setContent(p.content || "");
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`http://localhost:3000/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push(`/posts/${id}`);
    } catch (err) {
      console.error(err);
      alert("Could not update post");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20">Loading...</main>
    </>
  );

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
        <form onSubmit={handleSave} className="space-y-4" aria-label="Edit post">
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
            <button disabled={saving || !title.trim() || !content.trim()} className="btn-primary">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
