const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const{v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const ejsMate = require("ejs-mate");

const User = require("./models/user.js");
const Post = require("./models/post.js");

main().then(()=>{
    console.log("connection successful");
}).catch((err) => {
    console.log(err);;
})
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Quora");
}

app.use(session({
    secret: "quoraSecretKey",
    resave: false,
    saveUninitialized: true
}));

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/auth");
    }
    next();
}

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.json());   
app.engine("ejs", ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,"public")));

app.get("/auth", (req, res) => {
    const isLoggedIn = !!req.session.userId;
    res.render("listings/auth.ejs", { isLoggedIn });
});
app.get("/logout", (req, res) => {
       req.session.destroy((err) => {
        if (err) {
            return res.send("Error logging out.");
        }
        res.redirect("/auth");
    });
});

app.get("/signup", (req, res) => {
    res.render("listings/signup.ejs");
});
app.post("/signup", async (req, res) => {
    const { name, email, phone, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, phone, username, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.redirect("/posts/new");
});

app.get("/login", (req, res) => {
    res.render("listings/login.ejs");
});
app.post("/login", async (req, res) => {
    const { emailOrPhone, password } = req.body;
    const user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });
    if (!user) return res.send("User not found");
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id;
        res.redirect("/posts/new");
    } else {
        res.send("Incorrect password");
    }
});

app.get("/dashboard", async (req, res) => {
    const posts = await Post.find({}).sort({ _id: -1 }).limit(10); // latest 10 posts
    res.render("listings/dashboard", { posts });
});

app.get("/posts",  async (req,res) => {
    let posts = await Post.find({});
    res.render("listings/index.ejs", {posts});
});

app.get("/posts/new", requireLogin, (req, res) => {
    res.render("listings/new.ejs");
});

app.post("/posts",async (req,res) => {
    let {username, content} = req.body;
    let newPost = new Post({ id: uuidv4(), username, content });
    await newPost.save();
    req.session.destroy((err) => {
        if (err) {
            return res.send("Post saved, but logout failed.");
        }
        res.redirect("/posts"); 
    });
});

app.get("/posts/:id",async (req,res) => {
    let {id } = req.params;
    let post =  await Post.findOne({ id });
    res.render("listings/show.ejs",{post} );
});

app.patch("/posts/:id",async (req,res) => {
    let {id } = req.params;
    let { content } = req.body;
    await Post.findOneAndUpdate({ id }, { content });
    res.redirect("/posts");
});

app.get("/posts/:id/pass", async (req, res) => {
    const { id } = req.params;
    const post = await Post.findOne({ id });
    if (!post) return res.send("Post not found");
    res.render("listings/pass.ejs", { post, error: "Incorrect password" });
});

app.post("/posts/:id/pass", async (req, res) => {
    const { id } = req.params;
    const password = req.body.password;
    // console.log("Incoming req.body:", req.body);
    // if (!req.body || !req.body.password) {
    //     return res.send("Password is missing in form submission.");
    // }

    const post = await Post.findOne({ id });
    if (!post) return res.send("Post not found");

    const user = await User.findOne({ username: post.username });
    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        res.redirect(`/posts/${id}/edit`);
    } else {
        return res.render("listings/pass.ejs", { post, error: true });
    }
});


app.get("/posts/:id/edit", async (req,res) => {
    let {id } = req.params;
    let post = await Post.findOne({ id });
    res.render("listings/edit.ejs", {post});
});

app.delete("/posts/:id",async (req,res) => {
    let {id } = req.params;
    await Post.findOneAndDelete({ id });
    res.redirect("/posts");
})
app.listen(port, () => {
    console.log(`listening to port : ${port}`);
});