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

    const exists = savedAccounts.some((acc) => acc._id === user._id);

    if (!exists) {
      savedAccounts.push(user);
      localStorage.setItem("savedAccounts", JSON.stringify(savedAccounts));
    }
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

    if (!isLogin) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
        err.username = "Username must be 3-20 characters";
      }
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
      className="min-vh-100 d-flex justify-content-center align-items-center"
      style={{
        background:
          "linear-gradient(135deg, #0f1115, #141824, #000000)",
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 p-4"
        style={{ width: 430 }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1">NeoAI</h2>
          <p className="text-secondary mb-0">
            {isLogin ? "Login to continue" : "Create your account"}
          </p>
        </div>

        <div className="mb-3 d-flex justify-content-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google login failed")}
            width="360"
          />
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="px-2 text-secondary small">OR</span>
          <hr className="flex-grow-1" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <>
              <input
                className="form-control form-control-lg mb-1"
                name="username"
                placeholder="Username"
                onChange={handleChange}
              />
              {errors.username && (
                <small className="text-danger">{errors.username}</small>
              )}

              <input
                type="file"
                className="form-control mt-2 mb-1"
                name="dp"
                onChange={handleChange}
                accept="image/*"
              />
              <small className="text-muted">Profile image optional</small>
            </>
          )}

          <input
            className="form-control form-control-lg mt-2 mb-1"
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
          />
          {errors.email && (
            <small className="text-danger">{errors.email}</small>
          )}

          <input
            className="form-control form-control-lg mt-2 mb-1"
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
                className="form-control form-control-lg mt-2 mb-1"
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

          <button className="btn btn-primary btn-lg w-100 mt-3 rounded-3">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p
          className="text-center mt-4 text-primary fw-semibold"
          style={{ cursor: "pointer" }}
          onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }}
        >
          {isLogin ? "Create account" : "Already have an account?"}
        </p>
      </div>
    </div>
  );
}