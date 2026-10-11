import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import API_URL from "../../config/api";
import { Context } from "../../context/ChatContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(Context);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/user/login`, {
        email: email.trim(),
        pwd: password,
      });

      localStorage.setItem("info", JSON.stringify(data));
      if (setUser) setUser(data);
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
      const msg =
        err.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setEmail("guest@meteor.chat");
    setPassword("123456");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-4 text-left"
    >
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Email Address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-password"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Password
        </label>
        <div className="relative flex items-center">
          <Lock className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full h-11 pl-10 pr-11 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] font-medium text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In to Meteor</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Quick Demo Helper */}
      <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
        <span>Trying it out?</span>
        <button
          type="button"
          onClick={handleGuestLogin}
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
        >
          Fill Demo Account
        </button>
      </div>
    </form>
  );
};

export default Login;
