interface LanguageData {
  name: string;
  percentage: number;
  color: string;
  bytes: number;
}

const languageColors: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#2b7a0b",
  python: "#3776ab",
  java: "#007396",
  csharp: "#239120",
  ruby: "#cc342d",
  go: "#00add8",
  rust: "#ce422b",
  php: "#777bb4",
  swift: "#fa7343",
  kotlin: "#7f52ff",
  cpp: "#00599c",
  c: "#a9b4b7",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  shell: "#4eaa25",
  json: "#292929",
};

export function LanguageChart({
  languages = [],
}: {
  languages?: LanguageData[];
}) {
  const defaultLanguages: LanguageData[] = [
    { name: "TypeScript", percentage: 45, color: "#2b7a0b", bytes: 150000 },
    { name: "JavaScript", percentage: 25, color: "#f7df1e", bytes: 85000 },
    { name: "Python", percentage: 20, color: "#3776ab", bytes: 65000 },
    { name: "CSS", percentage: 10, color: "#563d7c", bytes: 35000 },
  ];

  const data = languages.length > 0 ? languages : defaultLanguages;
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(99,179,237,0.08)",
      }}
    >
      <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
        Language Distribution
      </h3>

      <div className="space-y-4">
        {sorted.map((lang, idx) => (
          <div
            key={lang.name}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: lang.color }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {lang.name}
                </span>
              </div>
              <span
                className="text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                {lang.percentage}%
              </span>
            </div>

            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(99,179,237,0.1)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ background: lang.color, width: `${lang.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t" style={{ borderColor: "rgba(99,179,237,0.08)" }}>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Total: {sorted.reduce((acc, l) => acc + l.bytes, 0).toLocaleString()} bytes
        </p>
      </div>
    </div>
  );
}
