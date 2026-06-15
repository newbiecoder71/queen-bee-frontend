import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ClearableInput from "../components/Forms/ClearableInput";

const API = import.meta.env.VITE_BACKEND_URL;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const { data } = await axios.post(`${API}/api/users/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setMessage(data?.message || "Password reset successfully. You can now sign in.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reset password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-3xl font-bold">Reset Password</h1>
        <p className="mb-6 text-sm text-gray-600">
          Choose a new password with at least 6 characters, including uppercase, lowercase, and a number.
        </p>

        {message && <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <ClearableInput
          label="New Password"
          type="password"
          value={password}
          placeholder="Enter your new password"
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          onClear={() => setPassword("")}
        />

        <ClearableInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          placeholder="Confirm your new password"
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          onClear={() => setConfirmPassword("")}
        />

        <button
          type="submit"
          disabled={loading || !token}
          className={`w-full rounded-lg p-2 font-semibold transition ${loading ? "bg-gray-400 text-white" : "theme-primary-btn"}`}
        >
          {loading ? "Saving..." : "Reset Password"}
        </button>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="theme-link hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
