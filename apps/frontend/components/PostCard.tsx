export default function PostCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div>
      <article className="card p-6 group cursor-pointer">
        {/* inner glow border on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(139,92,246,0.04) 100%)",
          }}
        />

        {/* corner accent */}
        <div
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(139,92,246,0.12), transparent 70%)",
          }}
        />

        <div className="relative z-10">
          {/* label tag */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1 h-4 rounded-full"
              style={{
                background: "linear-gradient(180deg, #3b82f6, #8b5cf6)",
              }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                color: "var(--text-dim)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              post
            </span>
          </div>

          <h2
            className="text-lg font-bold mb-3 leading-snug transition-colors duration-200"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>

          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {content}
          </p>
        </div>
      </article>
    </div>
  );
}
