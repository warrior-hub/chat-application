import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  MessageCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const getPasswordStrength = () => {
    const password = form.password;

    if (!password) {
      return {
        label: "",
        width: "0%",
      };
    }

    if (password.length < 6) {
      return {
        label: "Weak password",
        width: "30%",
      };
    }

    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    ) {
      return {
        label: "Strong password",
        width: "100%",
      };
    }

    return {
      label: "Good password",
      width: "65%",
    };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await register(
        form.name,
        form.email,
        form.password
      );

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 py-10">

      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />

      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">

        {/* ================================================= */}
        {/* LEFT SIDE */}
        {/* ================================================= */}

        <div className="hidden lg:flex relative p-12 xl:p-16 flex-col justify-between overflow-hidden">

          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 border border-white/10 rounded-full" />

          <div className="absolute top-20 -right-10 w-40 h-40 border border-white/10 rounded-full" />

          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />

          {/* Brand */}
          <div className="relative">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">

                <MessageCircle
                  size={25}
                  className="text-white"
                  fill="white"
                />

              </div>

              <div>

                <h1 className="text-white text-xl font-bold">
                  ChatFlow
                </h1>

                <p className="text-slate-400 text-xs">
                  Real-time communication
                </p>

              </div>

            </div>

          </div>

          {/* Hero */}
          <div className="relative my-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-medium mb-6">

              <Sparkles size={14} />

              Create your ChatFlow account

            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">

              Your conversations.
              
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your people.
              </span>

            </h2>

            <p className="mt-6 text-slate-400 leading-7 max-w-md">

              Create your account and start connecting with
              friends through fast, secure and real-time messaging.

            </p>

            {/* Features */}
            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">

                  <Zap
                    size={18}
                    className="text-yellow-400"
                  />

                </div>

                <div>

                  <p className="text-white text-sm font-medium">
                    Instant conversations
                  </p>

                  <p className="text-slate-500 text-xs">
                    Send and receive messages in real-time
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">

                  <ShieldCheck
                    size={18}
                    className="text-emerald-400"
                  />

                </div>

                <div>

                  <p className="text-white text-sm font-medium">
                    Private & secure
                  </p>

                  <p className="text-slate-500 text-xs">
                    Your account and conversations are protected
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">

                  <MessageCircle
                    size={18}
                    className="text-indigo-400"
                  />

                </div>

                <div>

                  <p className="text-white text-sm font-medium">
                    One place for everything
                  </p>

                  <p className="text-slate-500 text-xs">
                    Chat and stay connected with your people
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Bottom */}
          <div className="relative">

            <div className="flex items-center gap-3">

              <div className="flex -space-x-2">

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-slate-950" />

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-slate-950" />

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-slate-950" />

              </div>

              <p className="text-xs text-slate-500">
                Join the ChatFlow community
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* RIGHT SIDE */}
        {/* ================================================= */}

        <div className="bg-slate-900/80 p-6 sm:p-10 xl:p-14 flex items-center">

          <div className="w-full max-w-md mx-auto">

            {/* Mobile Brand */}
            <div className="lg:hidden flex justify-center mb-8">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">

                  <MessageCircle
                    size={23}
                    className="text-white"
                    fill="white"
                  />

                </div>

                <h1 className="text-white text-xl font-bold">
                  ChatFlow
                </h1>

              </div>

            </div>

            {/* Heading */}
            <div className="mb-8">

              <p className="text-indigo-400 text-sm font-semibold mb-2">
                GET STARTED
              </p>

              <h2 className="text-3xl font-bold text-white">
                Create your account
              </h2>

              <p className="mt-2 text-slate-400 text-sm">
                Join ChatFlow and start connecting with your friends.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm flex items-start gap-3">

                <div className="mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  !
                </div>

                <p>{error}</p>

              </div>
            )}

            {/* ================= FORM ================= */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    className="w-full h-13 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/10 hover:border-white/20"
                  />

                </div>

              </div>

              {/* Email */}
              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="w-full h-13 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/10 hover:border-white/20"
                  />

                </div>

              </div>

              {/* Password */}
              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="w-full h-13 bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-12 text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/10 hover:border-white/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                {/* Password Strength */}
                {form.password && (
                  <div className="mt-3">

                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-300"
                        style={{
                          width: passwordStrength.width,
                        }}
                      />

                    </div>

                    <div className="flex justify-between mt-2">

                      <span className="text-[11px] text-slate-500">
                        {passwordStrength.label}
                      </span>

                      <span className="text-[11px] text-slate-600">
                        Min. 6 characters
                      </span>

                    </div>

                  </div>
                )}

              </div>

              {/* Password Requirements */}
              <div className="grid grid-cols-2 gap-2">

                <div
                  className={`flex items-center gap-2 text-xs ${
                    form.password.length >= 6
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <Check size={14} />
                  6+ characters
                </div>

                <div
                  className={`flex items-center gap-2 text-xs ${
                    /[A-Z]/.test(form.password)
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <Check size={14} />
                  Uppercase letter
                </div>

                <div
                  className={`flex items-center gap-2 text-xs ${
                    /[0-9]/.test(form.password)
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <Check size={14} />
                  Number
                </div>

                <div
                  className={`flex items-center gap-2 text-xs ${
                    /[^A-Za-z0-9]/.test(form.password)
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <Check size={14} />
                  Special character
                </div>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full h-13 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                    Creating account...
                  </>
                ) : (
                  <>
                    Create account

                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}

              </button>

            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">

              <div className="h-px bg-white/10 flex-1" />

              <span className="text-xs text-slate-600">
                OR
              </span>

              <div className="h-px bg-white/10 flex-1" />

            </div>

            {/* Login */}
            <div className="text-center">

              <p className="text-sm text-slate-400">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in to ChatFlow

                <ArrowRight size={15} />
              </Link>

            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-600 mt-10">
              By creating an account, you agree to our Terms &
              Privacy Policy.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Register;