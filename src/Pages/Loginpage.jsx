// Talk2KapAuth.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  User,
  Mail,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

const Talk2KapAuth = () => {
  const [view, setView] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const ADMIN_USERNAME = "admin";
  const ADMIN_EMAIL = "rhysjonathanabalon@gmail.com";

  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (remembered) {
      setRemember(true);
      const savedUsername = localStorage.getItem("savedUsername") || "";
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // Trim and validate username
      if (username.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
        setMessageType("error");
        setMessage("Invalid username. Please use 'admin'.");
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (!password || password.length < 6) {
        setMessageType("error");
        setMessage("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
      }

      console.log("Attempting login with:", ADMIN_EMAIL);
      
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      
      console.log("Login successful:", userCredential.user.email);

      // Save remember me preference
      if (remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedUsername", username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
      }

      setMessageType("success");
      setMessage("Login successful! Redirecting...");
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", ADMIN_EMAIL);

      setTimeout(() => {
        window.location.href = "/main";
      }, 900);
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      setMessageType("error");

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setMessage("Incorrect username or password. Please try again.");
          break;
        case "auth/too-many-requests":
          setMessage("Too many failed login attempts. Please try again later or reset your password.");
          break;
        case "auth/network-request-failed":
          setMessage("Network error. Please check your internet connection.");
          break;
        case "auth/invalid-email":
          setMessage("Configuration error. Please contact administrator.");
          break;
        case "auth/user-disabled":
          setMessage("This account has been disabled.");
          break;
        default:
          setMessage(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // Validate email
      const emailTrimmed = email.trim().toLowerCase();
      const adminEmailLower = ADMIN_EMAIL.toLowerCase();

      if (emailTrimmed !== adminEmailLower) {
        setMessageType("error");
        setMessage(`Please enter the admin email: ${ADMIN_EMAIL}`);
        setIsLoading(false);
        return;
      }

      console.log("Sending password reset email to:", ADMIN_EMAIL);

      // Send password reset email with action code settings
      await sendPasswordResetEmail(auth, ADMIN_EMAIL, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });

      console.log("Password reset email sent successfully");

      setMessageType("success");
      setMessage(`Password reset email sent to ${ADMIN_EMAIL}. Please check your inbox and spam folder.`);
      
      // Auto-redirect back to login after 5 seconds
      setTimeout(() => {
        setView("login");
        setEmail("");
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (error) {
      console.error("Password reset error:", error.code, error.message);
      setMessageType("error");

      switch (error.code) {
        case "auth/user-not-found":
          setMessage("No account found with this email address.");
          break;
        case "auth/invalid-email":
          setMessage("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setMessage("Too many requests. Please wait a few minutes and try again.");
          break;
        case "auth/network-request-failed":
          setMessage("Network error. Please check your internet connection.");
          break;
        default:
          setMessage(error.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Spinner = () => (
    <div
      className="animate-spin rounded-full border-2 border-transparent border-t-white"
      style={{ borderTopColor: "white", width: 20, height: 20 }}
      aria-hidden="true"
    />
  );

  const MessageBox = ({ type, text }) => {
    const base = "border px-4 py-3 rounded-xl text-sm bg-opacity-80 backdrop-blur-sm flex items-start gap-2";
    if (type === "success") {
      return (
        <div className={`${base} bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200`}>
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{text}</span>
        </div>
      );
    }
    return (
      <div className={`${base} bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200`}>
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <span>{text}</span>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Username</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 border-2 rounded-2xl bg-white/60 backdrop-blur-sm border-transparent focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full pl-10 pr-12 py-3 border-2 rounded-2xl bg-white/60 backdrop-blur-sm border-transparent focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 hover:text-indigo-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="toggle password visibility"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
          />
          Remember me
        </label>

        <button
          type="button"
          className="text-sm font-medium text-indigo-600 transition-all duration-200 hover:text-indigo-800"
          onClick={() => {
            setView("forgot");
            setMessage("");
            setMessageType("");
          }}
        >
          Forgot Password?
        </button>
      </div>

      {message && <MessageBox type={messageType} text={message} />}

      <button
        type="button"
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transform-gpu transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <Spinner />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </div>
      </button>

      <div className="mt-4 text-xs text-center text-gray-600 bg-blue-50 rounded-lg p-3">
        <strong>Note:</strong> Username: admin | Email: {ADMIN_EMAIL}
      </div>
    </div>
  );

  const renderForgotPassword = () => (
    <div className="space-y-6">
      <button
        type="button"
        className="flex items-center gap-2 text-gray-600 mb-1 transition-all duration-200 hover:text-gray-900"
        onClick={() => {
          setView("login");
          setMessage("");
          setMessageType("");
          setEmail("");
        }}
      >
        <ArrowLeft size={18} />
        Back to Login
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
      <p className="text-center text-sm text-gray-500">
        Enter your admin email address to receive password reset instructions.
      </p>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Admin Email Address</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail size={18} className="text-gray-400" />
          </div>
          <input
            type="email"
            className="w-full pl-10 pr-4 py-3 border-2 rounded-2xl bg-white/60 backdrop-blur-sm border-transparent focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200"
            placeholder={ADMIN_EMAIL}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
      </div>

      {message && <MessageBox type={messageType} text={message} />}

      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={isLoading}
        className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transform-gpu transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <Spinner />
              <span>Sending...</span>
            </>
          ) : (
            <span>Send Reset Email</span>
          )}
        </div>
      </button>

      <div className="mt-4 text-xs text-center text-gray-600 bg-yellow-50 rounded-lg p-3">
        Only {ADMIN_EMAIL} can receive password reset instructions.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-indigo-700 to-pink-500">
      {/* Background blobs */}
      <div
        className="absolute -left-28 -top-24 w-72 h-72 rounded-full blob bg-purple-400"
        style={{ animation: "floatA 6s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="absolute right-[-120px] top-10 w-80 h-80 rounded-full blob bg-pink-400"
        style={{ animation: "floatB 8s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="absolute left-20 bottom-[-80px] w-60 h-60 rounded-full blob bg-indigo-500"
        style={{ animation: "floatA 7s ease-in-out infinite" }}
        aria-hidden="true"
      />

      {/* Main card */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white/30 backdrop-blur-md shadow-2xl border border-white/20 card-appear z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-full mb-4 shadow-xl transform-gpu transition-all duration-300">
            <div className="relative">
              <MessageCircle size={40} className="text-white sparkle" />
              <div className="absolute -right-2 -top-2">
                <Sparkles size={14} className="text-yellow-200 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-md">Talk2Kap</h1>
        </div>

        <div className="bg-white/60 rounded-2xl p-6 shadow-inner">
          {view === "login" && renderLogin()}
          {view === "forgot" && renderForgotPassword()}
        </div>

        <footer className="mt-6 text-center text-sm text-white/80">
          <div className="opacity-90">© {new Date().getFullYear()} Talk2Kap</div>
          <div className="text-xs text-white/60 mt-1">All rights reserved • Built with care</div>
        </footer>
      </div>

      <style>{`
        @keyframes floatA {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes floatB {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-28px) scale(1.06); }
          100% { transform: translateY(0) scale(1); }
        }
        .blob {
          filter: blur(40px);
          opacity: 0.7;
          mix-blend-mode: screen;
        }
        .sparkle {
          animation: spinSlow 6s linear infinite;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .card-appear {
          animation: cardIn 500ms ease-out both;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Talk2KapAuth;