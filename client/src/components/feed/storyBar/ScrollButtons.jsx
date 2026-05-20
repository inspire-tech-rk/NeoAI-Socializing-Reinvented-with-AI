export default function ScrollButtons({ containerRef }) {
  const scroll = (dir) => {
    containerRef.current.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  return (
    <>
      <button
        className="btn btn-light shadow-sm scroll-btn start-0"
        onClick={() => scroll("left")}
      >
        ‹
      </button>
      <button
        className="btn btn-light shadow-sm scroll-btn end-0"
        onClick={() => scroll("right")}
      >
        ›
      </button>
    </>
  );
}
