const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    id: {
        type: String,
        required :true,
    },
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;