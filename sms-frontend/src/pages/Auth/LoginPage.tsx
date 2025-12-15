import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth";
import { LogIn } from "lucide-react";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(username, password);
      localStorage.setItem("accessToken", res.access);
      localStorage.setItem("refreshToken", res.refresh);

      navigate("/"); // Redirect to dashboard
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            SMSvc Login
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to continue
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-1 text-sm">
            <label className="text-slate-700 dark:text-slate-200">
              Username
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2
                       text-slate-900 outline-none transition focus:border-slate-900
                       dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-1 text-sm">
            <label className="text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2
                       text-slate-900 outline-none focus:border-slate-900
                       dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-rose-100 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-2 text-sm font-medium text-white
                       hover:bg-slate-800 transition disabled:opacity-50
                       dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {loading ? (
              "Signing in…"
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn size={16} /> Login
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
