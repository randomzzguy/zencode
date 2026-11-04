// SVG paths avoid platform-dependent Unicode/emoji presentation (notably iOS).
const paths = {
  '↗': ['up-right', 'M5 19 19 5M5 5h14v14'],
  '↘': ['down-right', 'M5 5 19 19M5 19h14V5'],
  '→': ['right', 'M4 12h16M14 6l6 6-6 6'],
  '←': ['left', 'M20 12H4m6-6-6 6 6 6'],
  '↑': ['up', 'M12 20V4m-6 6 6-6 6 6'],
  '↓': ['down', 'M12 4v16m-6-6 6 6 6-6']
};

export function renderArrowIcons(html) {
  // Change only text nodes, preserving attributes, accessible labels, scripts,
  // styles, and the existing wrappers used for sizing and hover animations.
  return html.replace(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]*>)|([^<]+)/gi, (match, tag, text) => {
    if (tag) return tag;
    return text.replace(/[↗↘→←↑↓]/g, character => {
      const [direction, path] = paths[character];
      return `<svg class="icon-arrow" data-direction="${direction}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
    });
  });
}
