import { useState } from "react";
import axios from "axios";
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const validate = () => {
    const err = {};

    if (!isLogin) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
        err.username =
          "Username must be 3-20 characters and contain only letters, numbers & _";
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

      // LOGIN
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true }
      );

      // SAVE CURRENT USER
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // SAVE TOKEN
      localStorage.setItem("token", res.data.token);

      // SAVE ACCOUNT FOR SWITCH ACCOUNT FEATURE
      const savedAccounts =
        JSON.parse(localStorage.getItem("savedAccounts")) || [];

      const exists = savedAccounts.some(
        (acc) => acc._id === res.data.user._id
      );

      if (!exists) {
        savedAccounts.push(res.data.user);
        localStorage.setItem(
          "savedAccounts",
          JSON.stringify(savedAccounts)
        );
      }

      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h3 className="text-center mb-3">
          {isLogin ? "Login" : "Register"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <>
              <input
                className="form-control mb-1"
                name="username"
                placeholder="Username"
                onChange={handleChange}
                required
              />
              {errors.username && (
                <small className="text-danger">{errors.username}</small>
              )}

              <input
                type="file"
                className="form-control mt-2 mb-2"
                name="dp"
                onChange={handleChange}
                accept="image/*"
              />
              <small className="text-muted">
                Profile image optional
              </small>
            </>
          )}

          <input
            className="form-control mt-2 mb-1"
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          {errors.email && (
            <small className="text-danger">{errors.email}</small>
          )}

          <input
            className="form-control mt-2 mb-1"
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          {errors.password && (
            <small className="text-danger">{errors.password}</small>
          )}

          {!isLogin && (
            <>
              <input
                className="form-control mt-2 mb-1"
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && (
                <small className="text-danger">
                  {errors.confirmPassword}
                </small>
              )}
            </>
          )}

          <button className="btn btn-primary w-100 mt-3">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p
          className="text-center mt-3 text-primary"
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