import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ClearableInput from "../components/Forms/ClearableInput";

const API = import.meta.env.VITE_BACKEND_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const { data } = await axios.post(`${API}/api/users/forgot-password`, { email });
      setMessage(data?.message || "If that email is in our system, a reset link has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to send reset email right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-3xl font-bold">Forgot Password</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

        {message && <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <ClearableInput
          label="Email"
          type="email"
          value={email}
          placeholder="Enter your email address"
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          onClear={() => setEmail("")}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg p-2 font-semibold transition ${loading ? "bg-gray-400 text-white" : "theme-primary-btn"}`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="mt-6 text-center text-sm">
          Remembered it?{" "}
          <Link to="/login" className="theme-link hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
