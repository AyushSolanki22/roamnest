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
  try {
    const rawEmail = req.body?.email;
    const password = req.body?.password;

    if (
      typeof rawEmail !== "string" ||
      typeof password !== "string" ||
      !rawEmail.trim() ||
      !password
    ) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currPage: "login",
        isLoggedIn: false,
        errorMessages: ["Please enter a valid email and password."],
        oldInput: {
          email: typeof rawEmail === "string" ? rawEmail.trim() : "",
        },
        user: {},
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currPage: "login",
        isLoggedIn: false,
        errorMessages: [
          "Invalid email or password. Please try again.",
        ],
        oldInput: { email },
        user: {},
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currPage: "login",
        isLoggedIn: false,
        errorMessages: [
          "Invalid email or password. Please try again.",
        ],
        oldInput: { email },
        user: {},
      });
    }

    // Regenerate the session after authentication to reduce session fixation risk.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    req.session.isLoggedIn = true;
    req.session.user = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
    };

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    const registeredHomes = await Home.find();

    return res.render("store/index", {
      registeredHomes,
      pageTitle: "Homes",
      currPage: "Home",
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (error) {
    return next(error);
  }
};



exports.postLogout = (req, res, next) => {
  if (!req.session) {
    return res.redirect("/login");
  }

  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("connect.sid");
    return res.redirect("/login");
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

  async (req, res, next) => {
    const {
  firstName,
  lastName,
  email,
  password,
  userType,
} = req.body || {};
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currPage: "signup",
        isLoggedIn: false,
        errorMessages: errors.array().map((error) => error.msg),
        oldInput: { firstName, lastName, email, userType },
        user: {},
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        userType,
      });

      await user.save();

      return res.redirect("/login");
    } catch (error) {
      // Handle duplicate email without exposing internal database details.
      if (error.code === 11000) {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currPage: "signup",
          isLoggedIn: false,
          errorMessages: ["An account with this email already exists."],
          oldInput: { firstName, lastName, email, userType },
          user: {},
        });
      }

      if (error.name === "ValidationError") {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currPage: "signup",
          isLoggedIn: false,
          errorMessages: [error.message],
          oldInput: { firstName, lastName, email, userType },
          user: {},
        });
      }

      return next(error);
    }
  },
];
