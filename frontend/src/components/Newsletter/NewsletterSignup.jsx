import { useRef, useState } from "react";
import axios from "axios";
import { HiXMark } from "react-icons/hi2";

const API = import.meta.env.VITE_BACKEND_URL;

const NewsletterSignup = () => {
  const [status, setStatus] = useState("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState(""); // honeypot
  const formRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const { data } = await axios.post(`${API}/api/newsletter/subscribe`, {
        email,
        honey,
        source: "site",
      });

      setStatus("sent");
      setMessage(data?.message || "You're signed up for the newsletter!");
      setHoney("");
      setEmail("");
      formRef.current?.reset();
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  };

  return (
    <div className="rounded-2xl border p-6 bg-white">
      <h3 className="text-lg font-semibold">Sign up for our newsletter</h3>
      <p className="text-sm text-gray-600 mt-1">
        Get new fabric drops, class updates, and special offers.
      </p>

      {status === "sent" && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-sm">
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {message}
        </div>
      )}

      <form ref={formRef} onSubmit={submit} className="mt-4 flex items-center gap-0">
        <input
          className="hidden"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="relative flex-1">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="h-10 w-full px-3 pr-9 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          {email && (
            <button
              type="button"
              onClick={() => setEmail("")}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-700"
              aria-label="Clear email"
            >
              <HiXMark className="h-5 w-5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="h-10 bg-black text-white px-6 text-sm rounded-r-md border border-black hover:bg-gray-800 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {status === "sending" ? "Saving..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default NewsletterSignup;
