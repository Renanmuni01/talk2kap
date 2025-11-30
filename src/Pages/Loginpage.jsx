// Talk2KapAuth.jsx - Complete Auth System with Password Storage
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
  sendPasswordResetEmail,
  confirmPasswordReset
} from "firebase/auth";

const Talk2KapAuth = () => {
  const [view, setView] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [resetCode, setResetCode] = useState("");

  const ADMIN_USERNAME = "admin";
  const ADMIN_EMAIL = "rhysjonathanabalon@gmail.com";

  // Load saved credentials on component mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";

    if (remembered) {
      setRemember(true);
      setUsername(localStorage.getItem("savedUsername") || "");
      setPassword(localStorage.getItem("savedPassword") || "");
    }

    // Check for password reset code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get("oobCode");

    if (oobCode) {
      setResetCode(oobCode);
      setView("resetPassword");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // Validate username
      if (username.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
        setMessageType("error");
        setMessage("Invalid username. Please use 'admin'.");
        setIsLoading(false);
        return;
      }

      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);

      // Save credentials if remember me is checked
      if (remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedUsername", username);
        localStorage.setItem("savedPassword", password);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
        localStorage.removeItem("savedPassword");
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", ADMIN_EMAIL);

      setMessageType("success");
      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "/main";
      }, 900);

    } catch (error) {
      console.error(error);
      setMessageType("error");

      switch (error.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setMessage("Incorrect password.");
          break;
        case "auth/user-not-found":
          setMessage("Admin account does not exist.");
          break;
        case "auth/too-many-requests":
          setMessage("Too many failed attempts. Please try again later.");
          break;
        default:
          setMessage(error.message);
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

      // Send password reset email
      await sendPasswordResetEmail(auth, ADMIN_EMAIL, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      if (!newPassword || newPassword.length < 6) {
        setMessageType("error");
        setMessage("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessageType("error");
        setMessage("Passwords do not match.");
        setIsLoading(false);
        return;
      }

      // Update password in Firebase
      await confirmPasswordReset(auth, resetCode, newPassword);

      // Clear saved password since it's been reset
      localStorage.removeItem("savedPassword");
      localStorage.removeItem("rememberMe");

      setMessageType("success");
      setMessage("Password reset successful! Redirecting to login...");

      // Clean up URL
      window.history.replaceState({}, document.title, "/login");

      setTimeout(() => {
        setView("login");
        setUsername(ADMIN_USERNAME);
        setPassword("");
        setRemember(false);
        setNewPassword("");
        setConfirmPassword("");
        setResetCode("");
        setMessage("");
        setMessageType("");
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessageType("error");
      
      switch (error.code) {
        case "auth/expired-action-code":
          setMessage("Password reset link has expired. Please request a new one.");
          break;
        case "auth/invalid-action-code":
          setMessage("Invalid or already used reset link. Please request a new one.");
          break;
        case "auth/weak-password":
          setMessage("Password is too weak. Please use a stronger password.");
          break;
        default:
          setMessage("Password reset failed. Please try again or request a new reset link.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Spinner = () => (
    <div
      className="animate-spin rounded-full border-2 border-transparent border-t-white"
      style={{ width: 20, height: 20 }}
      aria-hidden="true"
    />
  );

  const MessageBox = ({ type, text }) => {
    const base = "border px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fadeIn";
    if (type === "success") {
      return (
        <div className={`${base} bg-green-50 text-green-800 border-green-200`}>
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{text}</span>
        </div>
      );
    }
    return (
      <div className={`${base} bg-red-50 text-red-800 border-red-200`}>
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
            <User size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
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
            <Lock size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:text-indigo-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="toggle password visibility"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200 cursor-pointer transition-all"
          />
          <span className="select-none">Remember me</span>
        </label>

        <button
          type="button"
          className="text-sm font-medium text-indigo-600 transition-all duration-200 hover:text-indigo-800 hover:underline"
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
        disabled={isLoading || !username || !password}
        className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transform transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    </div>
  );

  const renderForgotPassword = () => (
    <div className="space-y-6">
      <button
        type="button"
        className="flex items-center gap-2 text-gray-600 mb-1 transition-all duration-200 hover:text-gray-900 hover:gap-3"
        onClick={() => {
          setView("login");
          setMessage("");
          setMessageType("");
          setEmail("");
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Login</span>
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Reset Password</h2>
        <p className="text-sm text-gray-500">
          Enter your admin email address to receive password reset instructions.
        </p>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Admin Email Address</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="email"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
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
        disabled={isLoading || !email}
        className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transform transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    </div>
  );

  const renderResetPassword = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Set New Password</h2>
        <p className="text-sm text-gray-500">
          Please enter your new password below.
        </p>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">New Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type={showNewPassword ? "text" : "password"}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
            placeholder="Enter new password (min. 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:text-indigo-600"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label="toggle new password visibility"
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:text-indigo-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="toggle confirm password visibility"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {message && <MessageBox type={messageType} text={message} />}

      <button
        type="button"
        onClick={handleResetPassword}
        disabled={isLoading || !newPassword || !confirmPassword}
        className="w-full rounded-2xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transform transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <div className="flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <Spinner />
              <span>Resetting...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </div>
      </button>

      <div className="text-xs text-center text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
        <strong>Note:</strong> Password must be at least 6 characters long.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-indigo-700 to-pink-500">
      {/* Background Watermark Logo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '50%',
          opacity: 0.08,
          filter: 'brightness(2) contrast(1.2)'
        }}
        aria-hidden="true"
      />

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
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-white/20 card-appear z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-full mb-4 shadow-xl">
            <div className="relative">
              <MessageCircle size={40} className="text-white sparkle" />
              <div className="absolute -right-2 -top-2">
                <Sparkles size={14} className="text-yellow-200 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">Talk2Kap</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-6">
          {view === "login" && renderLogin()}
          {view === "forgot" && renderForgotPassword()}
          {view === "resetPassword" && renderResetPassword()}
        </div>

        <footer className="mt-6 text-center text-sm text-gray-600">
          <div>© {new Date().getFullYear()} Talk2Kap</div>
          <div className="text-xs text-gray-500 mt-1">All rights reserved • Built with care</div>
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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