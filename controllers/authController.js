const { validationResult, check } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const Home = require("../models/home");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currPage: "login",
    isLoggedIn: req.session.isLoggedIn,
    errorMessages: [],
    oldInput: {
      email: "",
    },
    user: {},
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currPage: "signup",
    isLoggedIn: false,
    errorMessages: [],
    oldInput: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userType: "",
    },
    user: {},
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currPage: "login",
      isLoggedIn: false,
      errorMessages: ["User not found. Please check your email and try again."],
      oldInput: { email },
      user: {},
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password);

  if (!isMatch) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currPage: "login",
      isLoggedIn: false,
      errorMessages: ["Incorrect password. Please try again."],
      oldInput: { email },
      user: {},
    });
  }

  req.session.isLoggedIn = true;

  req.session.user = {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
  };

  await req.session.save();

  Home.find().then((registeredHomes) => {
      res.render("store/index", {
        registeredHomes: registeredHomes,
        pageTitle: "Homes",
        currPage: "Home",
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user || {},
      });
    });
  // res.cookie("req.session.isLoggedIn", true);
  // req.session.req.session.isLoggedIn = true;
};

exports.postLogout = (req, res, next) => {
  // res.clearCookie("req.session.isLoggedIn");
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/login");
  });
};

exports.postSignup = [
  check("firstName")
    .not()
    .isEmpty()
    .withMessage("First name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters long")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name must contain only letters"),

  check("lastName")
    .matches(/^[A-Za-z]*$/)
    .withMessage("Last name must contain only letters"),

  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  check("password")
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character"),

  check("confirmPassword")
    .not()
    .isEmpty()
    .withMessage("Confirm password is required")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .not()
    .isEmpty()
    .withMessage("User type is required")
    .isIn(["guest", "host"])
    .withMessage("Invalid user type"),

  check("terms")
    .not()
    .isEmpty()
    .withMessage("You must accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("You must accept the terms and conditions");
      }
      return true;
    }),

  (req, res, next) => {
    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currPage: "signup",
        isLoggedIn: false,
        errorMessages: errors.array().map((error) => error.msg),
        oldInput: { firstName, lastName, email, password, userType },
        user: {},
      });
    }

    bcrypt.hash(password, 12).then((hashedPassword) => {
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType,
      });
      return user
        .save()
        .then((result) => {
          console.log("User created:", result);
          res.redirect("/login");
        })
        .catch((err) => {
          return res.status(422).render("auth/signup", {
            pageTitle: "Signup",
            currPage: "signup",
            isLoggedIn: false,
            errorMessages: [err.message],
            oldInput: { firstName, lastName, email, password, userType },
            user: {},
          });
        });
    });
  },
];
