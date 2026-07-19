// Lazy-loads / plays videos only when in viewport to keep the page fast.
export function initLazyVideo(selector = "video[data-src]") {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) {
        if (!video.src) video.src = video.dataset.src;
        video.play?.().catch(() => {});
      } else {
        video.pause?.();
      }
    }
  }, { threshold: 0.25 });

  document.querySelectorAll(selector).forEach((v) => observer.observe(v));
}
