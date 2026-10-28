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


  function setupRegistrationFeedback(scope, selectors) {
    const fields = {
      name: scope.querySelector(selectors.name),
      username: scope.querySelector(selectors.username),
      email: scope.querySelector(selectors.email),
      password: scope.querySelector(selectors.password),
      confirm: scope.querySelector(selectors.confirm)
    };
    if (Object.values(fields).some((field) => !field)) return null;

    fields.name.minLength = 2;
    fields.username.minLength = 3;
    fields.username.maxLength = 32;
    fields.password.minLength = 8;
    Object.values(fields).forEach((field) => { field.required = true; });

    const count = document.createElement("p");
    count.className = "font-body-sm text-body-sm text-on-surface-variant";
    fields.username.parentElement.insertAdjacentElement("afterend", count);

    const checkIcon = [...fields.username.parentElement.querySelectorAll(".material-symbols-outlined")]
      .find((icon) => icon.textContent.trim() === "check_circle");
    const validUsername = (name) => /^[\p{L}\p{N}_.-]{3,32}$/u.test(name);

    function updateUsername() {
      const name = fields.username.value.trim();
      const length = Array.from(name).length;
      const valid = validUsername(name);
      count.textContent = "Логин: 3–32 символа (" + length + "/32)";
      count.style.color = name && !valid ? "#ba1a1a" : "";
      if (checkIcon) checkIcon.hidden = !valid;
    }

    const indicator = fields.password.parentElement.nextElementSibling;
    const segments = [...(indicator?.children || [])].filter((item) => item.tagName === "DIV");
    const strengthLabel = indicator?.querySelector("span");

    function updateStrength() {
      const value = fields.password.value;
      const length = Array.from(value).length;
      const kinds = [
        /[a-zа-яё]/u.test(value),
        /[A-ZА-ЯЁ]/u.test(value),
        /[0-9]/.test(value),
        /[^\p{L}\p{N}]/u.test(value)
      ].filter(Boolean).length;
      let level = length ? 1 : 0;
      if (length >= 8) level = 2;
      if (length >= 10 && kinds >= 2) level = 3;
      if (length >= 12 && kinds >= 3) level = 4;

      const color = level <= 1 ? "#ba1a1a" : level === 2 ? "#b26c00" :
        level === 3 ? "#4f46e5" : "#178052";
      segments.forEach((segment, index) => {
        segment.style.backgroundColor = index < level ? color : "#d3e4fe";
      });
      if (strengthLabel) {
        strengthLabel.textContent = length < 8 ? "Минимум 8 символов" :
          level === 2 ? "Слабый" : level === 3 ? "Средний" : "Надёжный";
        strengthLabel.style.color = level ? color : "#777587";
      }
    }

    const errorScope = scope.querySelector("form") || scope.querySelector("main") || scope;
    Object.values(fields).forEach((field) => {
      field.addEventListener("input", () => hideError(errorScope));
    });
    fields.username.addEventListener("input", updateUsername);
    fields.password.addEventListener("input", updateStrength);
    updateUsername();
    updateStrength();
    return fields;
  }

  function registrationError(fields) {
    if (!fields) return "Заполните поля регистрации";
    if (Array.from(fields.name.value.trim()).length < 2) return "Имя должно содержать минимум 2 символа";
    const username = fields.username.value.trim();
    if (!/^[\p{L}\p{N}_.-]{3,32}$/u.test(username)) {
      return "Логин: от 3 до 32 символов, буквы, цифры, точка, дефис или _";
    }
    if (!fields.email.value.trim() || !fields.email.validity.valid) return "Введите корректный email";
    if (Array.from(fields.password.value).length < 8) return "Пароль должен содержать минимум 8 символов";
    if (!fields.confirm.value) return "Повторите пароль";
    if (fields.password.value !== fields.confirm.value) return "Пароли не совпадают";
    return "";
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
      const fields = setupRegistrationFeedback(desktop, {
        name: "#fullname", username: "#username", email: "#email",
        password: "#password", confirm: "#confirm_password"
      });
      setupPasswordCheck(desktop, "#password", "#confirm_password");

      const form = desktop.querySelector("form");

      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError(form);

        updatePasswordState(desktop, "#password", "#confirm_password", true);
        const invalid = registrationError(fields);
        if (invalid) {
          showError(form, invalid);
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
      const fields = setupRegistrationFeedback(mobile, {
        name: "#reg-fullname", username: "#reg-username", email: "#reg-email",
        password: "#reg-password", confirm: "#reg-confirm-password"
      });
      setupPasswordCheck(mobile, "#reg-password", "#reg-confirm-password");

      const button = mobile.querySelector("#btn-register");

      button?.addEventListener("click", async () => {
        const errorScope = mobile.querySelector("main") || mobile;
        hideError(errorScope);

        updatePasswordState(mobile, "#reg-password", "#reg-confirm-password", true);
        const invalid = registrationError(fields);
        if (invalid) {
          showError(errorScope, invalid);
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
