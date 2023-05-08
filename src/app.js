const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);
require("./db/conn");
const Register = require("./models/registers");
const { json } = require("express");
const { log } = require("console");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
  session = req.session;
  console.log("index");
  console.log(session);
  if (session.userid) res.render("index", { ctxt: true, sess: session });
  else res.render("index", { ctxt: false });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/landing", (req, res) => {
  var session = req.session;
  
  console.log("landing");
  console.log(session);
  if (session.userid) res.render("landing", { ctxt: true, sess: session });
  else res.status(201).redirect("/");
});

app.get("/news", (req, res) => {
    res.render("news");
  });

// create a new user in our database
app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if (password === cpassword) {
      const registerEmployee = new Register({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        age: req.body.age,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword,
      });

      const token = await registerEmployee.generateAuthToken();

      const registered = await registerEmployee.save();

      res.status(201).redirect("/");
    } else {
      res.render("index", {
        message: "Passwords do not match",
      });
    }
  } catch (error) {
    res.status(400).send(error);
    console.log("the error part page "+error);
  }
});

// login check

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await Register.findOne({ email: email });

    const isMatch = await bcrypt.compare(password, useremail.password);

    const token = await useremail.generateAuthToken();

    if (isMatch) {
      var session = req.session;
      session.userid = useremail;
      res.status(201).redirect("/landing");
    } else {
      res.render("login", { message: "invalid Password Details" });
    }
  } catch (error) {
    res.status(400).render("login", { message: "invalid login Details" });
  }
});

// const bcrypt = require("bcryptjs");

// const securePassword = async (password) =>{

//     const passwordHash = await bcrypt.hash(password, 10);
//     console.log(passwordHash);

//     const passwordmatch = await bcrypt.compare("thapa@123", passwordHash);
//     console.log(passwordmatch);

// }

// securePassword("thapa@123");

// const jwt = require("jsonwebtoken");

// const createToken = async() => {
//     const token = await jwt.sign({_id:"5fb86aaf569ea945f8bcd2e1"}, "mynameisvinodbahadurthapayoutuber", {
//         expiresIn:"2 seconds"
//     });
//     console.log(token);

//     const userVer = await jwt.verify(token, "mynameisvinodbahadurthapayoutuber");
//     console.log(userVer);
// }

// createToken();

app.post("/landing", (req, res) => {
  session = req.session;
  var session = req.session;
  const searchTerm = req.body["search-term"];
  const category = req.body.category;
  const language = req.body.language;
  const country = req.body.country;
  const sortBy = req.body["sort-by"];

  // Here, you can perform any desired operations with the received parameters, such as console logging or saving to a database.
  console.log("Search term:", searchTerm);
  console.log("Category:", category);
  console.log("Language:", language);
  console.log("Country:", country);
  console.log("Sort by:", sortBy);

  url =
    "https://gnews.io/api/v4/search?q=" +
    searchTerm +
    "&country=" +
    country +
    "&sortby=" +
    sortBy +
    "&token=b1ebb86551fbb3c79b8a85a617f1227b&lang=" +
    language;
  console.log(url);
  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      articles = data.articles;
      //res.render("news", { articles });
      //res.render('news', { myArray: articles });
      //res.render('landing', { myArray: articles });
      if (session.userid) res.render("landing", { myArray: articles,ctxt: true, sess: session });
      else res.redirect(201,"/");
    });
});

app.listen(port, () => {
  console.log(`server is running at port no ${port}`);
});
