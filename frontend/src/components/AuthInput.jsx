import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const AuthInput = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  icon: Icon,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full">
      
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-300 mb-2"
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div className="relative group">

        {/* Left Icon */}
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-colors group-focus-within:text-indigo-400"
          />
        )}

        {/* Input */}
        <input
          id={name}
          type={
            isPassword && showPassword
              ? "text"
              : type
          }
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          autoComplete={
            isPassword
              ? "current-password"
              : type === "email"
              ? "email"
              : "name"
          }
          className={`
            w-full
            h-13
            bg-white/[0.04]
            border border-white/[0.08]
            rounded-xl
            text-white
            placeholder:text-slate-600
            outline-none
            transition-all duration-200
            hover:border-white/[0.14]
            focus:border-indigo-500/60
            focus:bg-white/[0.06]
            focus:ring-4
            focus:ring-indigo-500/10
            ${Icon ? "pl-11" : "pl-4"}
            ${isPassword ? "pr-12" : "pr-4"}
          `}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPassword((prev) => !prev)
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}

      </div>
    </div>
  );
};

export default AuthInput;