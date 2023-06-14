import posts from '../../../data/posts.json';
export default (req, res) => {
    const {query: {slug}} = req;
    console.log("slug:[" + slug + "]",req.url,req.method);
    const post = posts.find((post) => post.slug === slug);
    console.log("post:",post);
    if (!post) {
        return res.status(404).json({ message: 'Cannot find post' });
    }
   return res.status(200).json(post);
};
