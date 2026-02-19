import { Link } from "react-router-dom";

const AccessDeniedPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
      <p className="mt-4 text-gray-600">
        You are signed in, but your account does not have permission to view this page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black"
        >
          Go Home
        </Link>
        <Link
          to="/admin"
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
