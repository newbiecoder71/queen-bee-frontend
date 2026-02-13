import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import login from "/images/IMG_1593.jpg";
import { loginUser, clearError } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart, fetchCart } from "../redux/slices/cartSlice";
import ClearableInput from "../components/Forms/ClearableInput";

const SAVED_LOGIN_EMAIL_KEY = "savedLoginEmail";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, error, loading } = useSelector((state) => state.auth);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  const target = isCheckoutRedirect ? "/checkout" : redirect;

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_LOGIN_EMAIL_KEY);
    if (!savedEmail) return;

    setEmail(savedEmail);
    setRememberEmail(true);
  }, []);

  useEffect(() => {
    if (!user) return;
  
    const userId = user._id;
    const storedGuestId = localStorage.getItem("guestId");
  
    // 1️⃣ Load the user cart instantly
    dispatch(fetchCart({ userId }));
  
    // 2️⃣ No guest cart? Done.
    if (!storedGuestId) {
      navigate(target);
      return;
    }
  
    // 3️⃣ FETCH GUEST CART *WITHOUT TOUCHING REDUX*
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/carts`, {
        params: { guestId: storedGuestId },
      })
      .then((res) => {
        const guestCart = res.data;
  
        // 4️⃣ If empty - just load user cart and move on
        if (!guestCart?.products?.length) {
          navigate(target);
          return;
        }
  
        // 5️⃣ Merge guest cart → user cart
        dispatch(mergeCart({ guestId: storedGuestId, userId }))
          .unwrap()
          .then(() => {
            // 6️⃣ Remove guest ID AFTER merge
            localStorage.removeItem("guestId");
  
            // 7️⃣ Reload user cart from Mongo
            dispatch(fetchCart({ userId }));
  
            navigate(target);
          });
      })
      .catch(() => {
        // Guest cart load failed → fallback to user cart
        navigate(target);
      });
  }, [user]);      

  const toggleRememberEmail = () => {
    if (rememberEmail) {
      localStorage.removeItem(SAVED_LOGIN_EMAIL_KEY);
      setRememberEmail(false);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    localStorage.setItem(SAVED_LOGIN_EMAIL_KEY, trimmedEmail);
    setRememberEmail(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rememberEmail && email.trim()) {
      localStorage.setItem(SAVED_LOGIN_EMAIL_KEY, email.trim());
    }
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">Queen Bee Quilts</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Hey there!</h2>
          <p className="text-center mb-6">
            Enter your username and password to login
          </p>

          {/* Email Input */}
          <div className="mb-1">
            <ClearableInput
              label="Email"
              type="email"
              value={email}
              placeholder="Enter your email address"
              autoComplete="username"
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) dispatch(clearError());
              }}
              onClear={() => setEmail("")}
              error={error?.field === "email" ? error.message : null}
            />
            <div className="text-right">
              <button
                type="button"
                onClick={toggleRememberEmail}
                className="text-xs text-blue-600 hover:underline"
              >
                {rememberEmail ? "Forget saved email" : "Remember this email"}
              </button>
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <ClearableInput
              label="Password"
              type="password"
              value={password}
              placeholder="Enter your password"
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) dispatch(clearError());
              }}
              onClear={() => setPassword("")}
              error={error?.field === "password" ? error.message : null}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-500 hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
      <div className="hidden md:block w-1/2 bg-gray-800">
        <div className="h-full flex flex-col justify-center items-center">
          <img
            src={login}
            alt="Login to Account"
            className="h-[750px] w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
