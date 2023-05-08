const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const handle=require("express-handlebars")
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
const { request } = require("http");

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
var art;
app.get("/", (req, res) => {
  
  art=[];
  session = req.session;
  console.log("index");
  console.log(session);
  if (session.userid) res.render("index", { ctxt: true, sess: session });
  else res.render("index", { ctxt: false });
});

app.get("/register", (req, res) => {
  
  art=[];
  res.render("register");
});

app.get("/login", (req, res) => {
  art=[];
  res.render("login");
});
var yy = handle.create({});
hbs.registerHelper('lookup2', function(collection, url) {
  
  var collectionLength = art.length;

  for (var i = 0; i < collectionLength; i++) {
      if (art[i].url === url) {
          return art[i];
      }

  }

  return null;
});
app.get("/landing", (req, res) => {
  var session = req.session;
  
  console.log("landing");
 
  if (session.userid) res.render("landing", { ctxt: true, sess: session ,myArray: art});
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

app.get("/favourite/:id",(req,res)=>{
    var id=req.params.id;
    var sz=art.length;
    for( let i=0; i<sz; ++i){
      if(i==id){
        Register.findOne({_id:req.session.userid._id}).then(user =>{ user["savedNews"].push(art[i]); user.save();})
      }
      
    }
    console.log(req.session.userid.savedNews); 
   res.redirect("/landing");
  }
  
)
app.get("/favourite",(req,res)=>{
  var session=req.session;
  console.log(session.userid.savedNews);
  // res.json(session.userid.savedNews);
  res.render("favourite", { myArray: session.userid.savedNews,ctxt: true, sess: session });
      
}
)
app.post("/landing", (req, res) => {
  session = req.session;
  var session = req.session;
  const searchTerm = req.body["search-term"];
  const category = req.body.category;
  const language = req.body.language;
  const country = req.body.country;
  const sortBy = req.body["sort-by"];

  // Here, you can perform any desired operations with the received parameters, such as console logging or saving to a database.


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
      art=articles;
      console.log(typeof(articles[0]));
      if (session.userid) res.render("landing", { myArray: articles,ctxt: true, sess: session });
      else res.redirect(201,"/");
    });
});

app.get("/logout",(req,res)=>{
  art=[];
  console.log(req.session)
  req.session.destroy();
  res.redirect(201,"/");
})
app.listen(port, () => {
  console.log(`server is running at port no ${port}`);
});
