import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "../config";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dp: null,
  });

const saveAccount = (user, token) => {
  localStorage.setItem("user", JSON.stringify(user));
  if (token) localStorage.setItem("token", token);

  const savedAccounts =
    JSON.parse(localStorage.getItem("savedAccounts")) || [];

  const updatedAccounts = savedAccounts.filter(
    (acc) => acc._id !== user._id
  );

  updatedAccounts.push(user);

  localStorage.setItem("savedAccounts", JSON.stringify(updatedAccounts));
};

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        { credential: credentialResponse.credential },
        { withCredentials: true }
      );

      saveAccount(res.data.user, res.data.token);
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "Google login failed");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const validate = () => {
    const err = {};

    if (!isLogin && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      err.username = "Username must be 3-20 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = "Invalid email format";
    }

    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/.test(
        form.password
      )
    ) {
      err.password =
        "Password must contain 8+ chars, uppercase, lowercase, number & special char";
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      err.confirmPassword = "Passwords do not match";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (!isLogin) {
        const data = new FormData();
        data.append("username", form.username);
        data.append("email", form.email);
        data.append("password", form.password);
        if (form.dp) data.append("dp", form.dp);

        await axios.post(`${API_URL}/api/auth/register`, data, {
          withCredentials: true,
        });

        alert("Registered successfully. Please login.");
        setIsLogin(true);
        return;
      }

      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true }
      );

      saveAccount(res.data.user, res.data.token);
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div
      className="min-vh-100 d-flex justify-content-center align-items-center px-3"
      style={{
        background:
          "radial-gradient(circle at top left, #2563eb55, transparent 30%), radial-gradient(circle at bottom right, #d946ef44, transparent 30%), linear-gradient(135deg, #050816, #0f172a, #020617)",
        overflow: "hidden",
      }}
    >
      <div
        className="position-absolute"
        style={{
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(59,130,246,0.25)",
          filter: "blur(30px)",
          top: "12%",
          left: "18%",
        }}
      />

      <div
        className="position-absolute"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(236,72,153,0.2)",
          filter: "blur(35px)",
          bottom: "10%",
          right: "18%",
        }}
      />

      <div
        className="row shadow-lg rounded-5 overflow-hidden position-relative"
        style={{
          maxWidth: 960,
          width: "100%",
          minHeight: 590,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{
            background:
              "linear-gradient(145deg, rgba(37,99,235,0.55), rgba(147,51,234,0.35))",
          }}
        >
          <div>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mb-4"
              style={{
                width: 70,
                height: 70,
                background: "rgba(255,255,255,0.16)",
                boxShadow: "inset 0 0 20px rgba(255,255,255,0.18)",
              }}
            >
              <span style={{ fontSize: 34 }}>🧠</span>
            </div>

            <h1 className="fw-bold display-6 mb-3">Welcome to NeoAI</h1>
            <p className="fs-5 text-white-50">
              Socializing reinvented with AI, reels, stories, smart feed and
              real-time interaction.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <div className="p-3 rounded-4 bg-white bg-opacity-10">
                <h5 className="mb-1">AI Chat</h5>
                <small className="text-white-50">NexAI assistant</small>
              </div>
            </div>

            <div className="col-6">
              <div className="p-3 rounded-4 bg-white bg-opacity-10">
                <h5 className="mb-1">Reels</h5>
                <small className="text-white-50">Smart recommendations</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 p-4 p-md-5 d-flex align-items-center">
          <div
            className="w-100 rounded-5 p-4"
            style={{
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              transform: "perspective(1000px) rotateY(-2deg)",
            }}
          >
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-1 text-dark">
                {isLogin ? "Login" : "Create Account"}
              </h2>
              <p className="text-secondary mb-0">
                {isLogin
                  ? "Continue your NeoAI journey"
                  : "Join NeoAI in seconds"}
              </p>
            </div>

            <div className="d-flex justify-content-center mb-3">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert("Google login failed")}
                width="340"
              />
            </div>

            <div className="d-flex align-items-center my-4">
              <hr className="flex-grow-1" />
              <span className="px-3 text-secondary small fw-semibold">OR</span>
              <hr className="flex-grow-1" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <>
                  <input
                    className="form-control form-control-lg mb-1 rounded-4"
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                  />
                  {errors.username && (
                    <small className="text-danger">{errors.username}</small>
                  )}

                  <input
                    type="file"
                    className="form-control mt-3 mb-1 rounded-4"
                    name="dp"
                    onChange={handleChange}
                    accept="image/*"
                  />
                  <small className="text-muted">Profile image optional</small>
                </>
              )}

              <input
                className="form-control form-control-lg mt-3 mb-1 rounded-4"
                name="email"
                type="email"
                placeholder="Email address"
                onChange={handleChange}
              />
              {errors.email && (
                <small className="text-danger">{errors.email}</small>
              )}

              <input
                className="form-control form-control-lg mt-3 mb-1 rounded-4"
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
              />
              {errors.password && (
                <small className="text-danger">{errors.password}</small>
              )}

              {!isLogin && (
                <>
                  <input
                    className="form-control form-control-lg mt-3 mb-1 rounded-4"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <small className="text-danger">
                      {errors.confirmPassword}
                    </small>
                  )}
                </>
              )}

              <button
                className="btn btn-primary btn-lg w-100 mt-4 rounded-4 fw-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, #2563eb, #7c3aed)",
                  border: "none",
                  boxShadow: "0 12px 25px rgba(37,99,235,0.35)",
                }}
              >
                {isLogin ? "Login" : "Register"}
              </button>
            </form>

            <p
              className="text-center mt-4 text-primary fw-semibold mb-0"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
            >
              {isLogin
                ? "New to NeoAI? Create account"
                : "Already have an account? Login"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}