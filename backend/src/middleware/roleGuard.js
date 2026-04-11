// Usage: roleGuard('admin') or roleGuard('ward_staff', 'ward_doctor')
// Admin users are always authorized for any guarded route.
export const roleGuard =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (req.user.role === 'admin') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
