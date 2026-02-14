import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";

const QuiltingForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [widthInches, setWidthInches] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [pattern, setPattern] = useState("");
  const [threadColor, setThreadColor] = useState("");
  const [backing, setBacking] = useState("");
  const [batting, setBatting] = useState("");
  const [backingPrep, setBackingPrep] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);

  const squareInches =
  widthInches && heightInches ? widthInches * heightInches : 0;

  const basePriceNum = squareInches * 0.0125;
  const BACK_PREP_FEE = 10;

  const totalPriceNum = basePriceNum + (backingPrep ? BACK_PREP_FEE : 0);
  const price = totalPriceNum.toFixed(2);


  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("widthInches", widthInches);
    formData.append("heightInches", heightInches);
    formData.append("pattern", pattern);
    formData.append("threadColor", threadColor);
    formData.append("backing", backing);
    formData.append("batting", batting);
    formData.append("backingPrep", backingPrep);
    formData.append("price", price);
    if (photo) formData.append("photo", photo);

    try {
      const { data: createdOrder } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/quilting-orders`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const userId = user?._id || localStorage.getItem("userId");
      if (userId && createdOrder?._id) {
        await dispatch(
          addToCart({
            itemType: "quilting",
            quiltingOrderId: createdOrder._id,
            quantity: 1,
            userId,
          })
        ).unwrap();
      }

      alert("Quilting order added successfully and added to your cart!");

      if (onSuccess) {
        console.log("✅ onSuccess triggered from QuiltingForm");
        onSuccess(); // ✅ refresh parent page + close modal
        return;
      } else {
        navigate("/my-quilts"); // fallback if used standalone
      }
    } catch (err) {
      console.error("Error submitting quilting order:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleClear = () => {
    setWidthInches("");
    setHeightInches("");
    setPattern("");
    setThreadColor("");
    setBacking("");
    setBatting("");
    setBackingPrep("");
    setPhoto(null);
    setPhotoPreview(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Add New Quilting Order
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Width (inches)</label>
            <input
              type="number"
              value={widthInches}
              onChange={(e) => setWidthInches(Number(e.target.value))}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Height (inches)</label>
            <input
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(Number(e.target.value))}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
        </div>

        {/* Quilt details */}
        <div>
          <label className="block font-medium">Pattern</label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Thread Color</label>
          <input
            type="text"
            value={threadColor}
            onChange={(e) => setThreadColor(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Backing</label>
          <input
            type="text"
            value={backing}
            onChange={(e) => setBacking(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Batting</label>
          <input
            type="text"
            value={batting}
            onChange={(e) => setBatting(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Backing Prep</label>
          <select
            value={backingPrep ? "true" : "false"}
            onChange={(e) => setBackingPrep(e.target.value === "true")}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="false">No</option>
            <option value="true">Yes (+$10)</option>
          </select>
        </div>

        {/* Photo upload + preview */}
        <div>
          <label className="block font-medium">Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {photoPreview && (
            <div className="mt-3">
              <p className="text-sm font-medium">Preview:</p>
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-1 w-48 h-48 object-cover rounded shadow"
              />
            </div>
          )}
        </div>

        {/* Price info */}
        <div className="bg-gray-50 p-3 rounded border">
          <p>
            <span className="font-semibold">Square Inches:</span>{" "}
            {squareInches}
          </p>
          <p>
            <span className="font-semibold">Price:</span>{" "}
            <span className="text-green-600 font-bold">${price}</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Quilting Order
          </button>
          <button
            type="button"
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => {
              if (onCancel) onCancel();
              else navigate("/my-quilts");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuiltingForm;
