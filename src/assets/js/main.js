const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.getElementById("mobile-menu");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const opened = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!opened));
    mobileMenu.hidden = opened;
  });
}
