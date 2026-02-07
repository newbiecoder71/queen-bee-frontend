import { useRef, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const NewsletterSignup = () => {
  const [status, setStatus] = useState("idle");
  const [email, setEmail] = useState("");
  const [honey, setHoney] = useState(""); // honeypot
  const formRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await axios.post(`${API}/api/newsletter/subscribe`, {
        email,
        honey,
        source: "site",
      });

      setStatus("sent");
      setEmail("");
      setHoney("");
      formRef.current?.reset();
    } catch (err) {
      console.error(err);
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
          Thanks! You’re signed up.
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          Something went wrong. Please try again.
        </div>
      )}

      <form ref={formRef} onSubmit={submit} className="mt-4 flex gap-0">
        {/* honeypot hidden */}
        <input
          className="hidden"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />

        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 p-1 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-black text-white px-6 py-3 text-sm rounded-r-md hover:bg-gray-800 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {status === "sending" ? "Saving..." : "Sign Up"}
        </button>

      </form>
    </div>
  );
};

export default NewsletterSignup;
