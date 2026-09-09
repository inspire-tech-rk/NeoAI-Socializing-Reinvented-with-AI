import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../config";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dp: null,
  });

  /* =========================================================
     SAVE ACCOUNT
  ========================================================= */

  const saveAccount = (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));

    if (token) {
      localStorage.setItem("token", token);
    }

    const savedAccounts =
      JSON.parse(localStorage.getItem("savedAccounts")) || [];

    const updatedAccounts = savedAccounts.filter(
      (acc) => acc._id !== user._id
    );

    updatedAccounts.push(user);

    localStorage.setItem(
      "savedAccounts",
      JSON.stringify(updatedAccounts)
    );
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        {
          credential: credentialResponse.credential,
        },
        {
          withCredentials: true,
        }
      );

      saveAccount(res.data.user, res.data.token);

      window.location.href = "/";
    } catch (err) {
      console.error("Google login error:", err);

      setErrors({
        general:
          err.response?.data?.message ||
          "Google login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    // Remove field error while typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: "",
      }));
    }
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validate = () => {
    const err = {};

    if (!isLogin) {
      if (!form.username.trim()) {
        err.username = "Username is required";
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
        err.username =
          "Username must be 3–20 characters using letters, numbers or _";
      }
    }

    if (!form.email.trim()) {
      err.email = "Email address is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      err.email = "Please enter a valid email address";
    }

    if (!form.password) {
      err.password = "Password is required";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/.test(
        form.password
      )
    ) {
      err.password =
        "Use 8+ characters with uppercase, lowercase, number & special character";
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      err.confirmPassword = "Passwords do not match";
    }

    setErrors(err);

    return Object.keys(err).length === 0;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});

      /* ---------------- REGISTER ---------------- */

      if (!isLogin) {
        const data = new FormData();

        data.append("username", form.username.trim());
        data.append("email", form.email.trim());
        data.append("password", form.password);

        if (form.dp) {
          data.append("dp", form.dp);
        }

        await axios.post(
          `${API_URL}/api/auth/register`,
          data,
          {
            withCredentials: true,
          }
        );

        setForm({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          dp: null,
        });

        setIsLogin(true);

        setErrors({
          general:
            "Account created successfully. Please login to continue.",
          type: "success",
        });

        return;
      }

      /* ---------------- LOGIN ---------------- */

      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: form.email.trim(),
          password: form.password,
        },
        {
          withCredentials: true,
        }
      );

      saveAccount(res.data.user, res.data.token);

      window.location.href = "/";
    } catch (err) {
      console.error("Authentication error:", err);

      setErrors({
        general:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SWITCH LOGIN / REGISTER
  ========================================================= */

  const switchMode = () => {
    setIsLogin((prev) => !prev);

    setErrors({});

    setShowPassword(false);
    setShowConfirmPassword(false);

    setForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dp: null,
    });
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .neo-auth-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(59, 130, 246, 0.22),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 85%,
              rgba(168, 85, 247, 0.20),
              transparent 30%
            ),
            radial-gradient(
              circle at 70% 20%,
              rgba(14, 165, 233, 0.10),
              transparent 25%
            ),
            linear-gradient(
              135deg,
              #030712 0%,
              #071127 45%,
              #090b1f 100%
            );
        }

        .neo-auth-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(2px);
        }

        .neo-orb-one {
          width: 320px;
          height: 320px;
          top: -120px;
          left: -100px;
          background: rgba(37, 99, 235, 0.15);
        }

        .neo-orb-two {
          width: 360px;
          height: 360px;
          right: -130px;
          bottom: -150px;
          background: rgba(168, 85, 247, 0.15);
        }

        .neo-auth-container {
          width: min(1100px, 100%);
          min-height: 650px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          position: relative;
          z-index: 2;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 30px;
          background: rgba(255,255,255,0.055);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow:
            0 35px 100px rgba(0,0,0,0.48),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* ================= LEFT ================= */

        .neo-auth-left {
          position: relative;
          padding: 58px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          background:
            linear-gradient(
              145deg,
              rgba(37,99,235,0.68),
              rgba(79,70,229,0.48) 45%,
              rgba(126,34,206,0.45)
            );
          border-right: 1px solid rgba(255,255,255,0.10);
        }

        .neo-auth-left::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -100px;
          top: -100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          filter: blur(5px);
        }

        .neo-brand {
          position: relative;
          z-index: 2;
        }

        .neo-logo {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          font-size: 34px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            0 15px 35px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.20);
        }

        .neo-brand-title {
          font-size: clamp(2.4rem, 4vw, 3.5rem);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }

        .neo-brand-description {
          max-width: 500px;
          font-size: 1.05rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.72);
          margin: 0;
        }

        .neo-feature-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .neo-feature {
          padding: 19px;
          border-radius: 18px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.10);
          transition: 0.25s ease;
        }

        .neo-feature:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.15);
        }

        .neo-feature-icon {
          font-size: 22px;
          margin-bottom: 10px;
        }

        .neo-feature-title {
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .neo-feature-text {
          font-size: 0.78rem;
          line-height: 1.4;
          color: rgba(255,255,255,0.62);
        }

        /* ================= RIGHT ================= */

        .neo-auth-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px;
          background: rgba(3,7,18,0.38);
        }

        .neo-form-card {
          width: min(440px, 100%);
          padding: 38px;
          border-radius: 26px;
          background: rgba(255,255,255,0.965);
          box-shadow:
            0 25px 70px rgba(0,0,0,0.30);
        }

        .neo-form-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .neo-form-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          font-size: 24px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );
          box-shadow: 0 10px 25px rgba(79,70,229,0.28);
        }

        .neo-form-title {
          color: #111827;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.6px;
          margin: 0 0 7px;
        }

        .neo-form-subtitle {
          color: #6b7280;
          font-size: 0.93rem;
          margin: 0;
        }

        .neo-google-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          overflow: hidden;
        }

        .neo-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 23px 0;
          color: #9ca3af;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .neo-divider::before,
        .neo-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .neo-field {
          margin-bottom: 16px;
        }

        .neo-label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .neo-input-wrapper {
          position: relative;
        }

        .neo-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          border: 1px solid #dbe1ea;
          border-radius: 14px;
          outline: none;
          background: #f8fafc;
          color: #111827;
          font-size: 0.94rem;
          transition: all 0.2s ease;
        }

        .neo-input::placeholder {
          color: #9ca3af;
        }

        .neo-input:hover {
          border-color: #c7d2e1;
          background: #ffffff;
        }

        .neo-input:focus {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow:
            0 0 0 4px rgba(99,102,241,0.10);
        }

        .neo-input-password {
          padding-right: 52px;
        }

        .neo-password-button {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          font-size: 16px;
          transition: 0.2s ease;
        }

        .neo-password-button:hover {
          background: #f1f5f9;
          color: #111827;
        }

        .neo-error {
          display: block;
          margin-top: 6px;
          color: #dc2626;
          font-size: 0.74rem;
          line-height: 1.4;
        }

        .neo-message {
          padding: 12px 14px;
          border-radius: 12px;
          margin-bottom: 17px;
          font-size: 0.82rem;
          line-height: 1.45;
        }

        .neo-message-error {
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .neo-message-success {
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .neo-file {
          width: 100%;
          padding: 11px 13px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .neo-file:hover {
          border-color: #818cf8;
          background: #f5f3ff;
        }

        .neo-file-note {
          display: block;
          margin-top: 6px;
          color: #94a3b8;
          font-size: 0.72rem;
        }

        .neo-submit {
          width: 100%;
          height: 54px;
          margin-top: 8px;
          border: none;
          border-radius: 15px;
          color: white;
          font-size: 0.98rem;
          font-weight: 750;
          cursor: pointer;
          background: linear-gradient(
            135deg,
            #2563eb,
            #4f46e5,
            #7c3aed
          );
          box-shadow:
            0 12px 28px rgba(79,70,229,0.30);
          transition: all 0.22s ease;
        }

        .neo-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 16px 32px rgba(79,70,229,0.38);
        }

        .neo-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .neo-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .neo-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          margin-right: 9px;
          vertical-align: -3px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: neoSpin 0.75s linear infinite;
        }

        @keyframes neoSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .neo-switch {
          margin: 23px 0 0;
          text-align: center;
          color: #64748b;
          font-size: 0.84rem;
        }

        .neo-switch-button {
          border: none;
          padding: 0;
          margin-left: 5px;
          background: transparent;
          color: #4f46e5;
          font-weight: 750;
          cursor: pointer;
        }

        .neo-switch-button:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .neo-security {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          color: #94a3b8;
          font-size: 0.7rem;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 900px) {
          .neo-auth-container {
            grid-template-columns: 1fr;
            min-height: auto;
            max-width: 570px;
          }

          .neo-auth-left {
            display: none;
          }

          .neo-auth-right {
            min-height: 650px;
            padding: 28px 20px;
          }

          .neo-form-card {
            padding: 32px 26px;
          }
        }

        @media (max-width: 480px) {
          .neo-auth-page {
            padding: 18px 12px;
          }

          .neo-auth-right {
            padding: 18px 8px;
          }

          .neo-form-card {
            padding: 27px 19px;
            border-radius: 21px;
          }

          .neo-form-title {
            font-size: 1.7rem;
          }

          .neo-form-subtitle {
            font-size: 0.85rem;
          }

          .neo-input {
            height: 49px;
          }

          .neo-submit {
            height: 51px;
          }
        }
      `}</style>

      <div className="neo-auth-page">
        {/* Background decoration */}
        <div className="neo-auth-orb neo-orb-one" />
        <div className="neo-auth-orb neo-orb-two" />

        <div className="neo-auth-container">
          {/* =====================================================
              LEFT BRANDING PANEL
          ====================================================== */}

          <section className="neo-auth-left">
            <div className="neo-brand">
              <div className="neo-logo">🧠</div>

              <h1 className="neo-brand-title">
                Welcome to
                <br />
                NeoAI
              </h1>

              <p className="neo-brand-description">
                Socializing reinvented with AI.
                Connect with people, discover content,
                enjoy reels and stories, and experience
                intelligent social interaction.
              </p>
            </div>

            <div className="neo-feature-grid">
              <div className="neo-feature">
                <div className="neo-feature-icon">🤖</div>

                <div className="neo-feature-title">
                  NexAI
                </div>

                <div className="neo-feature-text">
                  Your intelligent AI social assistant.
                </div>
              </div>

              <div className="neo-feature">
                <div className="neo-feature-icon">🎬</div>

                <div className="neo-feature-title">
                  Reels
                </div>

                <div className="neo-feature-text">
                  Discover engaging content personalized for you.
                </div>
              </div>

              <div className="neo-feature">
                <div className="neo-feature-icon">📖</div>

                <div className="neo-feature-title">
                  Stories
                </div>

                <div className="neo-feature-text">
                  Share moments and stay connected.
                </div>
              </div>

              <div className="neo-feature">
                <div className="neo-feature-icon">✨</div>

                <div className="neo-feature-title">
                  Smart Feed
                </div>

                <div className="neo-feature-text">
                  AI-powered content recommendations.
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              RIGHT AUTH PANEL
          ====================================================== */}

          <section className="neo-auth-right">
            <div className="neo-form-card">
              {/* Header */}

              <div className="neo-form-header">
                <div className="neo-form-icon">
                  {isLogin ? "🔐" : "🚀"}
                </div>

                <h2 className="neo-form-title">
                  {isLogin
                    ? "Welcome back"
                    : "Create your account"}
                </h2>

                <p className="neo-form-subtitle">
                  {isLogin
                    ? "Sign in to continue your NeoAI journey"
                    : "Join NeoAI and start socializing smarter"}
                </p>
              </div>

              {/* Message */}

              {errors.general && (
                <div
                  className={`neo-message ${
                    errors.type === "success"
                      ? "neo-message-success"
                      : "neo-message-error"
                  }`}
                >
                  {errors.general}
                </div>
              )}

              {/* Google Login */}

              <div className="neo-google-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    setErrors({
                      general:
                        "Google login failed. Please try again.",
                    })
                  }
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </div>

              {/* Divider */}

              <div className="neo-divider">
                <span>OR CONTINUE WITH EMAIL</span>
              </div>

              {/* Form */}

              <form onSubmit={handleSubmit} noValidate>
                {/* Username */}

                {!isLogin && (
                  <div className="neo-field">
                    <label className="neo-label">
                      Username
                    </label>

                    <input
                      className="neo-input"
                      name="username"
                      value={form.username}
                      placeholder="Choose a username"
                      autoComplete="username"
                      onChange={handleChange}
                    />

                    {errors.username && (
                      <small className="neo-error">
                        {errors.username}
                      </small>
                    )}
                  </div>
                )}

                {/* Profile picture */}

                {!isLogin && (
                  <div className="neo-field">
                    <label className="neo-label">
                      Profile picture
                      <span
                        style={{
                          color: "#94a3b8",
                          fontWeight: 500,
                          marginLeft: 5,
                        }}
                      >
                        (optional)
                      </span>
                    </label>

                    <input
                      type="file"
                      className="neo-file"
                      name="dp"
                      onChange={handleChange}
                      accept="image/*"
                    />

                    <small className="neo-file-note">
                      JPG, PNG or WEBP image
                    </small>
                  </div>
                )}

                {/* Email */}

                <div className="neo-field">
                  <label className="neo-label">
                    Email address
                  </label>

                  <input
                    className="neo-input"
                    name="email"
                    type="email"
                    value={form.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    onChange={handleChange}
                  />

                  {errors.email && (
                    <small className="neo-error">
                      {errors.email}
                    </small>
                  )}
                </div>

                {/* Password */}

                <div className="neo-field">
                  <label className="neo-label">
                    Password
                  </label>

                  <div className="neo-input-wrapper">
                    <input
                      className="neo-input neo-input-password"
                      name="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      value={form.password}
                      placeholder={
                        isLogin
                          ? "Enter your password"
                          : "Create a strong password"
                      }
                      autoComplete={
                        isLogin
                          ? "current-password"
                          : "new-password"
                      }
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      className="neo-password-button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {errors.password && (
                    <small className="neo-error">
                      {errors.password}
                    </small>
                  )}
                </div>

                {/* Confirm Password */}

                {!isLogin && (
                  <div className="neo-field">
                    <label className="neo-label">
                      Confirm password
                    </label>

                    <div className="neo-input-wrapper">
                      <input
                        className="neo-input neo-input-password"
                        name="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={form.confirmPassword}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        onChange={handleChange}
                      />

                      <button
                        type="button"
                        className="neo-password-button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (prev) => !prev
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword
                          ? "🙈"
                          : "👁️"}
                      </button>
                    </div>

                    {errors.confirmPassword && (
                      <small className="neo-error">
                        {errors.confirmPassword}
                      </small>
                    )}
                  </div>
                )}

                {/* Submit */}

                <button
                  type="submit"
                  className="neo-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="neo-spinner" />
                      {isLogin
                        ? "Signing you in..."
                        : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {isLogin
                        ? "Login to NeoAI"
                        : "Create NeoAI Account"}
                    </>
                  )}
                </button>
              </form>

              {/* Switch */}

              <div className="neo-switch">
                {isLogin
                  ? "New to NeoAI?"
                  : "Already have an account?"}

                <button
                  type="button"
                  className="neo-switch-button"
                  onClick={switchMode}
                  disabled={loading}
                >
                  {isLogin
                    ? "Create an account"
                    : "Login here"}
                </button>
              </div>

              {/* Security */}

              <div className="neo-security">
                <span>🔒</span>
                <span>Your account information is securely handled</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
