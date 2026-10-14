(() => {
  if (!window.MG) return;

  const page = MG.page;
  const isCatalogPage = page === "gallery.html";

  if (isCatalogPage) {
    document.documentElement.classList.add("mg-catalog-loading");
  }

  async function loadCatalog() {
    if (!isCatalogPage) return;

    const result = await MG.api("materials");
    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      MG.renderCards(scope, result.materials);
    });

    document.documentElement.classList.remove("mg-catalog-loading");
  }

  loadCatalog().catch((error) => MG.toast(error.message, true));
})();
