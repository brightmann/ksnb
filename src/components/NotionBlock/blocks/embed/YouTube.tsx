type Props = {
  url: string;
};

const getYouTubeVideoId = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0];
    }

    if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) return videoId;

      return parsedUrl.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1];
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export const YouTube = ({ url }: Props) => {
  const YouTubeVideoId = getYouTubeVideoId(url);
  if (!YouTubeVideoId) return null;

  return (
    <div className="m-1.5">
      <iframe
        width={560}
        height={315}
        src={`https://www.youtube.com/embed/${YouTubeVideoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-40 w-72 sm:h-52 sm:w-96"
      ></iframe>
    </div>
  );
};
