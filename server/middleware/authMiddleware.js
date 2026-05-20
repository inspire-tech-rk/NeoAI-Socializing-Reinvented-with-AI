import jwt from "jsonwebtoken";
import User from "../models/Auth.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json("Unauthorized");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json("User not found");
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json("Invalid token");
  }
};
