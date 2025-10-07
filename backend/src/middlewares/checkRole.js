// Middleware to check if the user's role is allowed
module.exports = function checkRole(allowedRoles = []) {
  return function (req, res, next) {
    try {
      const userRole = req.user?.user_role;

      if (!userRole) {
        return res.status(401).json({
          statusCode: 401,
          message: "Access denied: no user role found",
          success: false,
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          statusCode: 403,
          message: `Access denied: insufficient role. Required roles: ${allowedRoles.join(", ")}`,
          success: false,
        });
      }

      // Role is allowed
      next();
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error in role check",
        success: false,
        error: err.message,
      });
    }
  };
};
