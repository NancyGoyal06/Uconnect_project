const mongoose = require("mongoose");
const{v4: uuidv4 } = require("uuid");
const Post = require("./models/post.js");

main().then(()=>{
    console.log("connection successful");
}).catch((err) => {
    console.log(err);;
})
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Quora");
}

let allposts = [
    {
        id: uuidv4(),
        username : "navyagoyal",
        content : "I Love Sketching"
    },
    {
        id: uuidv4(),
        username : "nancygoyal",
        content : "Hard Work is important to achieve Success"
    },
    {
        id: uuidv4(),
        username : "sagarshigvan",
        content : "I got selected for my first internship!"
    },
];

Post.insertMany(allposts); 