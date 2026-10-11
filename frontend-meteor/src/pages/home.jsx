import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/auth/login";
import Sign from "../components/auth/sign";
import { MessageSquare, Flame } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("info"));
      if (userInfo && userInfo.token) {
        navigate("/chat");
      }
    } catch (e) {
      console.error(e);
    }
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 relative overflow-hidden text-white">
      {/* Ambient glowing radial effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center my-auto">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-xl shadow-violet-600/30 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-8 h-8 text-violet-400 fill-violet-400/20" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Meteor
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Realtime messaging, group hangouts & video calls
          </p>
        </div>

        {/* Auth Container Card */}
        <div className="w-full rounded-2xl glass-panel p-5 sm:p-7 shadow-2xl relative">
          {/* Tabs header */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("sign")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === "sign"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {tab === "login" ? <Login /> : <Sign />}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Instant socket connections • End-to-end room calls</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
