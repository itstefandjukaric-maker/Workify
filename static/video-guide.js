/* Progressive enhancement: chapter links still open a timed MP4 without JavaScript. */
(() => {
  'use strict';
  const video = document.getElementById('worker-guide-video');
  if (!video) return;
  const links = Array.from(document.querySelectorAll('[data-video-time]'));
  links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const time = Number(link.dataset.videoTime);
    if (!Number.isFinite(time)) return;
    event.preventDefault();
    const seek = () => {
      video.currentTime = Math.min(time, Number.isFinite(video.duration) ? video.duration : time);
      video.focus({preventScroll: true});
      video.scrollIntoView({block: 'center'});
      const playback = video.play();
      if (playback) playback.catch(() => { /* Native controls remain available. */ });
    };
    if (video.readyState > 0) seek();
    else { video.addEventListener('loadedmetadata', seek, {once: true}); video.load(); }
  }));
  video.addEventListener('timeupdate', () => {
    links.forEach((link, i) => {
      const start = Number(link.dataset.videoTime);
      const end = i+1 < links.length ? Number(links[i+1].dataset.videoTime) : Infinity;
      if (video.currentTime >= start && video.currentTime < end) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  });
})();
