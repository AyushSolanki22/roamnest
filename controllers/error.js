// Render the 404 page for requests that do not match a route.
exports.error = (req, res) => {
  return res.status(404).render("404", {
    pageTitle: "Page Not Found",
    currPage: "404",
    isLoggedIn: Boolean(req.session?.isLoggedIn),
    user: req.session?.user || {},
  });
};