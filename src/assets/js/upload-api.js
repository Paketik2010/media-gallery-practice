(() => {
  if (!window.MG || MG.page !== "upload.html") return;

  function showError(text) {
    MG.toast(text, true);
  }

  function currentType(scope) {
    const radio = scope.querySelector('input[name="media_type"]:checked');
    return radio?.value || scope.dataset.uploadType || "video";
  }

  function updateTypeCopy(scope, type) {
    const config = {
      image: {
        accept: "image/*",
        short: "JPG / PNG / WEBP",
        help: "Поддерживаемые форматы: JPG, PNG, WEBP до 20 МБ",
        mobile: "JPG, PNG, WEBP до 20 МБ"
      },
      video: {
        accept: "video/*",
        short: "MP4 / WEBM",
        help: "Поддерживаемые форматы: MP4, WEBM до 500 МБ",
        mobile: "MP4, WEBM до 500 МБ"
      },
      audio: {
        accept: "audio/*",
        short: "MP3 / WAV / OGG",
        help: "Поддерживаемые форматы: MP3, WAV, OGG до 100 МБ",
        mobile: "MP3, WAV, OGG до 100 МБ"
      }
    }[type];

    if (!config) return;
    if (scope._fileInput) scope._fileInput.accept = config.accept;

    const uploadTitle = [...scope.querySelectorAll("span")].find((node) => {
      return node.textContent.trim() === "Загрузка файла";
    });
    const header = uploadTitle?.parentElement;
    const short = header?.querySelector("span:last-child");
    if (short && short !== uploadTitle) short.textContent = config.short;

    const helpNode = [...scope.querySelectorAll("div")].find((node) =>
      node.querySelector(":scope > .material-symbols-outlined")?.textContent.trim() === "info" &&
      node.textContent.includes("Поддерживаемые форматы:"));
    helpNode?.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes("Поддерживаемые форматы:")) {
        node.nodeValue = " " + config.help;
      }
    });
    const linkLabel = [...scope.querySelectorAll("label")].find((node) =>
      node.textContent.includes("Ссылка на внешний видеопоток"));
    if (linkLabel) linkLabel.textContent = "Ссылка на материал";


    [...scope.querySelectorAll("div,p")].forEach((node) => {
      const text = node.textContent.trim();

      if (/^Поддерживаемые форматы:/i.test(text) && !node.querySelector("div,p")) {
        node.textContent = config.help;
      }

      if (/^MP4, WEBM, QuickTime/i.test(text) || /^JPG, PNG, WEBP до/i.test(text) || /^MP3, WAV, OGG до/i.test(text)) {
        node.textContent = config.mobile;
      }
    });
  }

  function drawTypeButtons(scope, type) {
    scope.querySelectorAll("[data-upload-type-button]").forEach((item) => {
      const itemType = item.dataset.uploadTypeButton;
      const active = itemType === type;

      item.style.outline = active ? "2px solid #4f46e5" : "";
      item.style.outlineOffset = active ? "1px" : "";

      if (scope.classList.contains("mobile-view")) {
        item.classList.toggle("bg-primary-fixed", active);
        item.classList.toggle("bg-surface-container-lowest", !active);
        item.classList.toggle("shadow-md", active);
        item.classList.toggle("shadow-sm", !active);

        let check = item.querySelector("[data-upload-check]");
        if (active && !check) {
          check = document.createElement("div");
          check.dataset.uploadCheck = "1";
          check.className = "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow";
          check.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
          item.prepend(check);
        } else if (!active && check) {
          check.remove();
        }

        const iconWrap = item.querySelector(".w-9.h-9.rounded-full");
        if (iconWrap) {
          iconWrap.classList.toggle("bg-primary", active);
          iconWrap.classList.toggle("text-on-primary", active);
          iconWrap.classList.toggle("shadow-sm", active);
          iconWrap.classList.toggle("bg-surface-container", !active);
          iconWrap.classList.remove("text-secondary", "text-tertiary", "text-primary");

          if (!active) {
            iconWrap.classList.add(itemType === "audio" ? "text-tertiary" : itemType === "image" ? "text-secondary" : "text-primary");
          }
        }

        const title = [...item.querySelectorAll("span")].find((node) => {
          return ["Фото", "Видео", "Аудио"].includes(node.textContent.trim());
        });
        if (title) {
          title.classList.toggle("text-on-primary-fixed", active);
          title.classList.toggle("font-semibold", active);
          title.classList.toggle("text-on-surface", !active);
        }

        const subtitle = [...item.querySelectorAll("span")].find((node) => /до\s+\d+\s*МБ/i.test(node.textContent));
        if (subtitle) {
          subtitle.classList.toggle("text-on-primary-fixed-variant", active);
          subtitle.classList.toggle("text-on-surface-variant/80", !active);
        }

        return;
      }

      const iconWrap = item.querySelector(":scope > div > div:first-child");
      const checkBadge = item.querySelector(":scope > div > div:last-child");
      const overlay = item.querySelector(".pointer-events-none");

      if (iconWrap) {
        iconWrap.className = active
          ? "w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center transition-colors"
          : "w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant transition-colors";
      }

      if (checkBadge) {
        checkBadge.className = active
          ? "w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center opacity-100 transition-opacity"
          : "w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center opacity-0 transition-opacity";
      }

      if (overlay) {
        overlay.className = active
          ? "absolute inset-0 rounded-xl bg-primary/10 opacity-100 pointer-events-none transition-opacity"
          : "absolute inset-0 rounded-xl bg-primary/5 opacity-0 pointer-events-none transition-opacity";
      }
    });
  }

  function selectType(scope, type) {
    if (!["image", "video", "audio"].includes(type)) return;

    scope.dataset.uploadType = type;

    scope.querySelectorAll('input[name="media_type"]').forEach((radio) => {
      radio.checked = radio.value === type;
    });

    drawTypeButtons(scope, type);
    updateTypeCopy(scope, type);
  }

  function setupTypeButtons(scope) {
    scope.querySelectorAll('input[name="media_type"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;

        selectType(scope, radio.value);
      });
    });

    scope.querySelectorAll("[data-upload-type-button]").forEach((card) => {
      card.addEventListener("click", () => {
        const type = card.dataset.uploadTypeButton;

        selectType(scope, type);
      });
    });

    const initial = scope.querySelector('input[name="media_type"]:checked')?.value || scope.dataset.uploadType || "video";
    selectType(scope, initial);
  }

  async function setupScope(scope, categories) {
    setupTypeButtons(scope);
    if (scope.classList.contains("mobile-view")) {
      [...scope.querySelectorAll("button")].forEach((button) => {
        const text = button.textContent.replace(/\s+/g, " ").trim();

        if (/В черновики/i.test(text)) {
          button.style.display = "none";
        }

        if (text === "Отмена") {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            location.href = MG.pageFile("gallery.html");
          });
        }
      });
    }

    scope.querySelectorAll("#assetCategory,#category-select").forEach((select) => {
      select.innerHTML = categories.map((category) => {
        return '<option value="' + MG.esc(category.name) + '">' +
          MG.esc(category.name) + '</option>';
      }).join("");
    });

    const form = scope.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = new FormData();
      data.set("title", scope.querySelector("#assetTitle,#material-title")?.value || "");
      data.set("description", scope.querySelector("#assetDescription,#material-desc")?.value || "");
      data.set("category", scope.querySelector("#assetCategory,#category-select")?.value || "Другое");
      data.set("type", currentType(scope));

      const source = scope.querySelector("[data-upload-link]")?.value.trim();
      if (source) data.set("source_url", source);

      if (!source) {
        showError("Загрузите файл или укажите ссылку");
        return;
      }

      try {
        const result = await MG.api("add_material", {
          method: "POST",
          form: data
        });

        MG.toast("Материал опубликован");

        setTimeout(() => {
          location.href = MG.pageFile("detail.html", "?id=" + result.material.id);
        }, 300);
      } catch (error) {
        showError(error.message);
      }
    });
  }

  async function run() {
    const user = await MG.getUser(true);

    if (!user) {
      location.href = MG.pageFile("login.html");
      return;
    }

    const categories = (await MG.api("categories")).categories;

    for (const scope of document.querySelectorAll(".desktop-view,.mobile-view")) {
      await setupScope(scope, categories);
    }
  }

  run().catch((error) => MG.toast(error.message, true));
})();
