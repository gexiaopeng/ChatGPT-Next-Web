import posts from '../../data/posts.json';
export default function mPost(post:any) {
     console.log("post", post);
    //return post;
     return "你好"+JSON.stringify(post);
}


export async function getStaticPaths() {
    const paths = posts.map((post) => ({ params: { slug: post.slug } }));
    console.log("paths");
    return {
        paths: paths,
        fallback: false,
    };
}

export async function getStaticProps({ params }) {
    console.log("params", params);
    const post = posts.find((post) => post.slug === params.slug);
    return {
        props: {
            post,
        },
    };
}
