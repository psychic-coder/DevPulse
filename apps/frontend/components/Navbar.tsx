import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          DevPulse
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-700">
                  <strong className="text-gray-900">
                    {user.githubUsername}
                  </strong>
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button onClick={login} className="btn-primary text-sm">
              Login with GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
