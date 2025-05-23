// middlewares/checkRole.js
module.exports = function checkRole(allowedRoles = []) {
    return function (req, res, next) {
      const userRole = req.user?.user_role;
  
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied: insufficient role" });
      }
  
      next();
    };
  };
  