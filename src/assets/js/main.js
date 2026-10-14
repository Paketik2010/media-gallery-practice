const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.getElementById("mobile-menu");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const opened = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!opened));
    mobileMenu.hidden = opened;
  });
}

const headerLogin = document.querySelector(".header-login");

if (headerLogin) {
  const accountUrl = new URL("../../api/me.php", document.currentScript.src);

  fetch(accountUrl, { credentials: "same-origin" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data || !data.user) return;

      headerLogin.textContent = "Кабинет";
      headerLogin.href = headerLogin.href.replace(/login\.html$/, "profile.html");

      const mobileLogin = document.querySelector('#mobile-menu a[href$="login.html"]');
      if (mobileLogin) {
        mobileLogin.textContent = "Кабинет";
        mobileLogin.href = mobileLogin.href.replace(/login\.html$/, "profile.html");
      }
    }).catch(() => {});
}
