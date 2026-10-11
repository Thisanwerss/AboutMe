(() => {
  const experience = document.getElementById('experience');
  const tablist = experience?.querySelector('[role="tablist"]');
  if (!tablist) return;

  const tabs = [...tablist.querySelectorAll('[role="tab"]')];

  function activateTab(selectedTab) {
    const returnToStart = experience.getBoundingClientRect().top < -1;
    tabs.forEach((tab) => {
      const selected = tab === selectedTab;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });

    if (returnToStart) {
      requestAnimationFrame(() => {
        experience.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      activateTab(nextTab);
      nextTab.focus({ preventScroll: true });
    });
  });
})();
