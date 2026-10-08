/* Cross the archived/native Next.js build boundary with a document navigation. */
document.addEventListener('click', function (event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  var anchor = event.target.closest && event.target.closest('a[href]');
  if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
  var url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/contact') url.pathname = '/contact/quote';
  if (url.pathname === '/services' || url.pathname.startsWith('/services/') || url.pathname === '/contact/quote') {
    event.preventDefault(); event.stopImmediatePropagation();
    location.assign(url.href);
  }
}, true);
