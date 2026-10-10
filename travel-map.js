(() => {
  const controls = document.querySelector(".travel-views");
  const image = document.querySelector("#travel-map-image");
  const caption = document.querySelector("#travel-map-caption");
  if (!controls || !image || !caption) return;

  const views = {
    world: {
      label: "World · 23 places",
      alt: "Pixel world map with black pixel stamps marking 23 visited places.",
    },
    europe: {
      label: "Europe · 12 places",
      alt: "Pixel map of Europe with black squares marking 12 visited places.",
    },
    "east-asia": {
      label: "East Asia · 10 places",
      alt: "Pixel map of East Asia with black squares marking 10 visited places.",
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
