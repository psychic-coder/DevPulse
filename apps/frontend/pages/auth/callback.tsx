import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Router needs to be ready and token must be in query
    if (!router.isReady) return;

    const accessToken = router.query.accessToken as string | undefined;
    const refreshToken = router.query.refreshToken as string | undefined;

    if (!accessToken) {
      console.error("No token found in URL");
      router.push("/");
      return;
    }

    try {
      // Parse JWT to get user info
      const payload = JSON.parse(atob(accessToken.split(".")[1]));

      // Store tokens in localStorage
      localStorage.setItem("authToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("authRefreshToken", refreshToken);
      }
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          id: payload.sub,
          githubUsername: payload.githubUsername,
        })
      );

      console.log("Tokens stored, redirecting to dashboard");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to parse token:", error);
      router.push("/");
    }
  }, [router.isReady, router.query.accessToken, router.query.refreshToken, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-void)" }}
    >
      <div className="text-center">
        <div className="text-4xl mb-4">🔐</div>
        <p style={{ color: "var(--text-primary)" }}>Completing sign in...</p>
        <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>
          Redirecting to dashboard
        </p>
      </div>
    </div>
  );
}
