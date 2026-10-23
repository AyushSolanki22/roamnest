
const requireHost = (req, res, next) => {
  if (
    !req.session ||
    !req.session.isLoggedIn ||
    !req.session.user
  ) {
    return res.redirect("/login");
  }

  if (req.session.user.userType !== "host") {
    return res.status(403).send(
      "Access denied: a host account is required."
    );
  }

  return next();
};

module.exports = requireHost;
