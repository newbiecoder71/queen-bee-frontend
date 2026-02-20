import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const getNameParts = (fullName = "") => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const ContactPage = () => {
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const formRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : null;
  const userNameParts = getNameParts(user?.name || "");
  const userEmail = String(user?.email || "").trim();

  // ✅ Controlled form state (so we can POST it)
  const [form, setForm] = useState({
    firstName: userNameParts.firstName,
    lastName: userNameParts.lastName,
    email: userEmail,
    topic: "",
    message: "",
    honey: "", // honeypot (hidden)
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      firstName: userNameParts.firstName,
      lastName: userNameParts.lastName,
      email: userEmail,
    }));
  }, [user, userEmail, userNameParts.firstName, userNameParts.lastName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      // Backend stores it for admin viewing
      await axios.post(`${API}/api/contact`, {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim(),
        message: `Topic: ${form.topic}\n\n${form.message}`.trim(),
        honey: form.honey, // bots fill this, humans don't
      });

      setStatus("sent");

      // reset inputs
      setForm({
        firstName: userNameParts.firstName,
        lastName: userNameParts.lastName,
        email: userEmail,
        topic: "",
        message: "",
        honey: "",
      });

      formRef.current?.reset();
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus("error");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 tracking-tighter">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold">Contact Us</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Have a question about fabrics, kits, shipping, or an order? Send us a
          message and we’ll get back to you.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: Contact info card */}
        <div className="bg-gray-50 rounded-2xl p-8 border">
          <h2 className="text-xl font-semibold mb-4">How to reach us</h2>

          <div className="space-y-4 text-gray-700">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Email</p>
              <p className="font-medium">support@queenbeequilts.com</p>
              <p className="text-sm text-gray-500">
                We typically reply within 1–2 business days.
              </p>
            </div>

            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Phone</p>
              <p className="font-medium">(417) 893-9068</p>
              <p className="text-sm text-gray-500">
                Tues–Fri, 10am–5pm & Sat, 10am-2pm (Central)
              </p>
            </div>

            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Order Help</p>
              <ul className="text-sm text-gray-600 list-disc pl-5 mt-1 space-y-1">
                <li>Include your order number if you have one</li>
                <li>Tell us the item name (or a screenshot)</li>
                <li>Let us know what you need (refund, exchange, question)</li>
              </ul>
            </div>
          </div>

          {/* FAQ-style quick links */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Quick answers</h3>
            <div className="space-y-3">
              <details className="bg-white rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">
                  What are your shipping times?
                </summary>
                <p className="text-gray-600 mt-2 text-sm">
                  Most orders ship in 1–3 business days. You’ll receive tracking as
                  soon as it ships.
                </p>
              </details>

              <details className="bg-white rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">
                  Can I change or cancel my order?
                </summary>
                <p className="text-gray-600 mt-2 text-sm">
                  If your order hasn’t shipped yet, contact us ASAP and we’ll do our
                  best to help.
                </p>
              </details>

              <details className="bg-white rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">
                  Do you offer quilting services?
                </summary>
                <p className="text-gray-600 mt-2 text-sm">
                  Yes! If you’re logged in, check{" "}
                  <span className="font-medium">My Quilts</span> for updates and
                  requests.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Right: Contact form */}
        <div className="bg-white rounded-2xl p-8 border">
          <h2 className="text-xl font-semibold mb-4">Send a message</h2>

          {status === "sent" && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
              {firstName ? (
                <>
                  Thanks <span className="font-semibold">{firstName}</span>, your
                  message was sent! We’ll get back to you soon.
                </>
              ) : (
                <>Thanks! Your message was sent. We’ll get back to you soon.</>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              Something went wrong. Please try again.
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field (hidden) */}
            <input
              type="text"
              name="honey"
              value={form.honey}
              onChange={handleChange}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="block text-sm text-gray-700 mb-1">
                <input
                  required
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="First Name"
                />
              </div>
              <div className="block text-sm text-gray-700 mb-1">
                <input
                  required
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="block text-sm text-gray-700 mb-1">
              <input
                type="email"
                required
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter your email address"
              />
            </div>

            <div className="block text-sm text-gray-700 mb-1">
              <select
                required
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className="w-full p-3 pr-10 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="" disabled>
                  Select a topic
                </option>
                <option value="Order status">Order status</option>
                <option value="Product question">Product question</option>
                <option value="Returns / exchanges">Returns / exchanges</option>
                <option value="Quilting services">Quilting services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="block text-sm text-gray-700 mb-1">
              <textarea
                required
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Tell us how we can help..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            <p className="text-xs text-gray-500">
              By submitting, you agree that we may contact you about your request.
            </p>

            <p className="text-xs text-gray-500">
              Please don’t include passwords, payment info, or sensitive personal information.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
