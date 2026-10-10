(() => {
  const controls = document.querySelector(".travel-views");
  const image = document.querySelector("#travel-map-image");
  const caption = document.querySelector("#travel-map-caption");
  if (!controls || !image || !caption) return;

  const views = {
    world: {
      label: "World · 23 places",
      alt: "Pixel world map with visited places marked in black across China, Japan, Europe, and Pittsburgh.",
    },
    europe: {
      label: "Europe · 12 places",
      alt: "Pixel map of Europe with black squares for Munich, Zurich, Florence, Bologna, Venice, Mallorca, Malta, Karlsruhe, Heidelberg, Nuremberg, Mannheim, and Stuttgart.",
    },
    "east-asia": {
      label: "East Asia · 10 places",
      alt: "Pixel map of East Asia with black squares for Shanghai, Wuxi, Suzhou, Hangzhou, Chengdu, Chongqing, Beijing, Qinhuangdao, Zhenjiang, and Tokyo.",
    },
  };

  controls.hidden = false;
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-map-view]");
    if (!button || !controls.contains(button)) return;
    const key = button.dataset.mapView;
    const view = views[key];
    if (!view) return;
    image.src = `assets/travel-map/${key}.svg`;
    image.alt = view.alt;
    caption.textContent = view.label;
    controls.querySelectorAll("button").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
  });
})();
