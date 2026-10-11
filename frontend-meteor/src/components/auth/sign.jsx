import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UploadCloud,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import API_URL from "../../config/api";
import { Context } from "../../context/ChatContext";

const Sign = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(Context);
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pic, setPic] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setError("");
    setUploadingPic(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Chat_MERN");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/doa4ffp1m/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setPic(data.secure_url);
      } else {
        throw new Error("Cloudinary upload failed");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Image upload failed. You can still register with the default avatar.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/user`, {
        name: name.trim(),
        email: email.trim(),
        pwd: password,
        pic: pic || undefined,
      });

      localStorage.setItem("info", JSON.stringify(data));
      if (setUser) setUser(data);
      navigate("/chat");
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        err.response?.data?.message ||
        "Registration failed. User may already exist.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5 text-left">
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Name Input */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="sign-name"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Full Name
        </label>
        <div className="relative flex items-center">
          <User className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            id="sign-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            autoComplete="name"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Email Input */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="sign-email"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Email Address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            id="sign-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@domain.com"
            autoComplete="email"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Password Grid - Responsive single or double columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="sign-password"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              id="sign-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="sign-confirm"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
          >
            Confirm
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              id="sign-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Picture Upload Area */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Avatar (Optional)
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleImageUpload(e.target.files[0]);
            }
          }}
        />

        {pic ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
            <div className="flex items-center gap-3">
              <img
                src={pic}
                alt="Uploaded avatar"
                className="w-10 h-10 rounded-full object-cover border border-violet-500"
              />
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Photo uploaded</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPic("")}
              className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-colors"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploadingPic}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500/60 bg-zinc-800/40 hover:bg-zinc-800/70 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploadingPic ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span>Uploading image to Cloudinary...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-violet-400" />
                <span>Upload Profile Picture</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || uploadingPic}
        className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-[0.99] font-medium text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating your account...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Create Account</span>
          </>
        )}
      </button>
    </form>
  );
};

export default Sign;
