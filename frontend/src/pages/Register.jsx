import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import register from "/images/IMG_5094.jpg";
import { registerUser, clearError } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from "../redux/slices/cartSlice";
import ClearableInput from "../components/Forms/ClearableInput";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, error, loading } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  useEffect(() => {
    if (user) {
      if (cart?.products?.length > 0 && guestId) {
        dispatch(mergeCart({ guestId, userId: user._id })).then(() => {
          navigate(isCheckoutRedirect ? "/checkout" : "/");
        });
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
    }
  }, [user, guestId, cart, navigate, isCheckoutRedirect, dispatch]);

  const clearFieldError = () => {
    if (error) dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser({ firstName, lastName, email, password, confirmPassword }));
  };

  return (
    <div className="flex">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md theme-auth-card p-8 rounded-lg border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">Queen Bee Quilts</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          <p className="text-center mb-6">
            Enter your details below to sign up.
          </p>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClearableInput
              label="First Name"
              type="text"
              value={firstName}
              placeholder="Enter your first name"
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError();
              }}
              onClear={() => setFirstName("")}
              error={error?.field === "firstName" ? error.message : null}
            />

            <ClearableInput
              label="Last Name"
              type="text"
              value={lastName}
              placeholder="Enter your last name"
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError();
              }}
              onClear={() => setLastName("")}
              error={error?.field === "lastName" ? error.message : null}
            />
          </div>

          <div className="mb-4">
            <ClearableInput
              label="Email"
              type="email"
              value={email}
              placeholder="Enter your email address"
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError();
              }}
              onClear={() => setEmail("")}
              error={error?.field === "email" ? error.message : null}
            />
          </div>

          <div className="mb-4">
            <ClearableInput
              label="Password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError();
              }}
              onClear={() => setPassword("")}
              error={error?.field === "password" ? error.message : null}
            />
          </div>

          <div className="mb-4">
            <ClearableInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              placeholder="Confirm your password"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError();
              }}
              onClear={() => setConfirmPassword("")}
              error={error?.field === "confirmPassword" ? error.message : null}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "theme-primary-btn"
            }`}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="theme-link hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
      <div className="hidden md:block w-1/2 bg-gray-800">
        <div className="h-full flex flex-col justify-center items-center">
          <img
            src={register}
            alt="Register an Account"
            className="h-[750px] w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
