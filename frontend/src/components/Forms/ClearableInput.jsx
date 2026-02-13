import { HiXMark } from "react-icons/hi2";

const ClearableInput = ({
  label,
  type = "text",
  value,
  onChange,
  onClear,
  placeholder,
  error,
  autoComplete,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full p-2 pr-10 border rounded ${
            error ? "border-red-500" : ""
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            aria-label={`Clear ${label}`}
          >
            <HiXMark className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default ClearableInput;
