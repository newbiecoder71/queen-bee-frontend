import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import login from "/images/IMG_1593.jpg";
import { loginUser, clearError } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart, fetchCart } from "../redux/slices/cartSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, error, loading } = useSelector((state) => state.auth);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  const target = isCheckoutRedirect ? "/checkout" : redirect;

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) dispatch(clearError()); // clear error when typing
              }}
              className="w-full p-2 border rounded"
              placeholder="Enter your email address"
            />
            {error?.field === "email" && (
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) dispatch(clearError()); // clear error when typing
              }}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
            {error?.field === "password" && (
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            )}
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
