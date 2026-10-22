const Home = require("../models/home");
const User = require("../models/user");

exports.getHomes = (req, res, next) => {
  //this all to handle async function problem
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes",
      currPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user || {},
    });
  });
};

exports.getIndex = (req, res, next) => {
  console.log("Session: ", req.session);

  Home.find().then((registeredHomes) => { 
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "RoamNest Home",
      currPage: "index",
      isLoggedIn: req.session.isLoggedIn, 
      user: req.session.user || {},
    });
  });
};

exports.getFavourites = async (req, res, next) => {
  const userId= req.session.user.id;
  console.log(userId)
  const user=await User.findById(userId).populate("favourites")
  console.log("User: ", user);

  console.log("user-favourites:" , user.favourites)
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currPage: "favourites",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user || {},
  });
};

exports.postAddToFavourite =async (req, res, next) => {
  const homeId = req.body.id;

  const userId= req.session.user.id;
  const user= await User.findById(userId);

  if(!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save(); 
  }
  
  res.redirect("/favourites");
        
};

exports.postDeleteFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;

  const userId= req.session.user.id;
  const user= await User.findById(userId);

  if(user.favourites.includes(homeId)) {
    user.favourites=user.favourites.filter(fav=> fav!=homeId)
    await user.save()
  }
  
  res.redirect("/favourites");
   
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId).then((home) => {
    if (!home) {
      res.redirect("/homes");
      console.log("Home not found");
    } else {
      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Detail",
        currPage: "Home",
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user || {},
      });
    }
  });
};
