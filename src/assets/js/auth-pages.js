(() => {
  if (!window.MG) return;

  function showError(scope, text) {
    let box = scope.querySelector("[data-api-error]");

    if (!box) {
      box = document.createElement("div");
      box.dataset.apiError = "1";
      box.style.cssText =
        "padding:12px 14px;margin-bottom:12px;border-radius:12px;" +
        "background:#ffdad6;color:#93000a;font:500 13px/18px Inter,sans-serif";
      scope.prepend(box);
    }

    box.textContent = text;
    box.hidden = false;
  }

  function hideError(scope) {
    const box = scope.querySelector("[data-api-error]");
    if (box) box.hidden = true;
  }

  function getErrorText(error) {
    const fields = error?.data?.fields;

    if (fields && typeof fields === "object") {
      const messages = Object.values(fields).filter(Boolean);
      if (messages.length) return messages.join(". ");
    }

    return error?.message || "Произошла ошибка";
  }

  function updatePasswordState(scope, passwordSelector, confirmSelector, force = false) {
    const password = scope.querySelector(passwordSelector);
    const confirm = scope.querySelector(confirmSelector);

    if (!password || !confirm) return true;

    const shouldCheck = force || confirm.value.length > 0;
    const mismatch = shouldCheck && password.value !== confirm.value;

    scope.querySelectorAll("[data-password-error],[data-password-status]").forEach((item) => {
      item.hidden = !mismatch;
    });

    const label = scope.querySelector("[data-password-label]");
    const icon = scope.querySelector("[data-password-icon]");

    confirm.setAttribute("aria-invalid", mismatch ? "true" : "false");

    if (mismatch) {
      confirm.style.backgroundColor = "rgba(255,218,214,.35)";
      confirm.style.boxShadow = "0 0 0 1.5px #ba1a1a";
      if (label) label.style.color = "#ba1a1a";
      if (icon) icon.style.color = "#ba1a1a";
    } else {
      confirm.style.backgroundColor = "";
      confirm.style.boxShadow = "";
      if (label) label.style.color = "";
      if (icon) icon.style.color = "";
    }

    return !mismatch;
  }

  function setupPasswordCheck(scope, passwordSelector, confirmSelector) {
    const password = scope.querySelector(passwordSelector);
    const confirm = scope.querySelector(confirmSelector);

    if (!password || !confirm) return;

    const check = () => updatePasswordState(scope, passwordSelector, confirmSelector, false);
    password.addEventListener("input", check);
    confirm.addEventListener("input", check);
    check();
  }

  document.querySelectorAll("#errorAlert,#error-banner").forEach((item) => {
    item.style.display = "none";
  });

  function cleanupUnsupportedMobileLogin() {
    const mobile = document.querySelector(".mobile-view");
    if (!mobile) return;

    const forgot = [...mobile.querySelectorAll("a,button")].find((node) =>
      node.textContent.trim() === "Забыли пароль?"
    );
    if (forgot) forgot.style.display = "none";

    const socials = [...mobile.querySelectorAll("button")].filter((button) =>
      /^(Google|GitHub)$/.test(button.textContent.trim())
    );

    if (socials.length) {
      const group = socials[0].parentElement;
      if (group && socials.every((button) => group.contains(button))) {
        group.style.display = "none";

        const divider = group.previousElementSibling;
        if (divider && /или через/i.test(divider.textContent)) {
          divider.style.display = "none";
        }
      } else {
        socials.forEach((button) => {
          button.style.display = "none";
        });
      }
    }
  }

  if (MG.page === "login.html") {
    cleanupUnsupportedMobileLogin();
    document.querySelectorAll(".desktop-view form,.mobile-view form").forEach((form) => {
      const login = form.querySelector('input[name="identifier"],#login-identifier');
      const password = form.querySelector('input[name="password"],#login-password');

      if (!login || !password) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError(form);

        try {
          await MG.api("login", {
            method: "POST",
            json: {
              identifier: login.value.trim(),
              password: password.value
            }
          });

          location.href = MG.pageFile("profile.html");
        } catch (error) {
          showError(form, getErrorText(error));
        }
      });
    });
  }

  if (MG.page === "register.html") {
    const desktop = document.querySelector(".desktop-view");
    const mobile = document.querySelector(".mobile-view");

    if (desktop) {
      setupPasswordCheck(desktop, "#password", "#confirm_password");

      const form = desktop.querySelector("form");

      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError(form);

        if (!updatePasswordState(desktop, "#password", "#confirm_password", true)) {
          showError(form, "Пароли должны совпадать");
          return;
        }

        if (!desktop.querySelector("#agreement")?.checked) {
          showError(form, "Примите правила использования сайта");
          return;
        }

        try {
          await MG.api("register", {
            method: "POST",
            json: {
              fullname: form.querySelector("#fullname")?.value.trim(),
              username: form.querySelector("#username")?.value.trim(),
              email: form.querySelector("#email")?.value.trim(),
              password: form.querySelector("#password")?.value,
              confirm_password: form.querySelector("#confirm_password")?.value
            }
          });

          location.href = MG.pageFile("profile.html");
        } catch (error) {
          showError(form, getErrorText(error));
        }
      });
    }

    if (mobile) {
      setupPasswordCheck(mobile, "#reg-password", "#reg-confirm-password");

      const button = mobile.querySelector("#btn-register");

      button?.addEventListener("click", async () => {
        const errorScope = mobile.querySelector("main") || mobile;
        hideError(errorScope);

        if (!updatePasswordState(mobile, "#reg-password", "#reg-confirm-password", true)) {
          showError(errorScope, "Пароли должны совпадать");
          return;
        }

        if (!mobile.querySelector("#terms-checkbox")?.checked) {
          showError(errorScope, "Примите условия сервиса");
          return;
        }

        try {
          await MG.api("register", {
            method: "POST",
            json: {
              fullname: mobile.querySelector("#reg-fullname")?.value.trim(),
              username: mobile.querySelector("#reg-username")?.value.trim(),
              email: mobile.querySelector("#reg-email")?.value.trim(),
              password: mobile.querySelector("#reg-password")?.value,
              confirm_password: mobile.querySelector("#reg-confirm-password")?.value
            }
          });

          location.href = MG.pageFile("profile.html");
        } catch (error) {
          showError(errorScope, getErrorText(error));
        }
      });
    }
  }
})();
