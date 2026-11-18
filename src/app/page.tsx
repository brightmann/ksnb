import { PageNation } from "@/components/PageNation";
import { PostCards } from "@/components/PostCards";
import { postsPerPage } from "@/constants/postsPerPage";
import { getAllPosts } from "@/libs";

const HomePage = async () => {
  const allPosts = await getAllPosts();
  const posts = allPosts.slice(0, postsPerPage);
  const numPages = Math.ceil(allPosts.length / postsPerPage);

  return (
    <div className="bg-gray-200">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <PostCards posts={posts} />
        <PageNation pageIndex={1} numPages={numPages} />
      </div>
    </div>
  );
};

export default HomePage;
