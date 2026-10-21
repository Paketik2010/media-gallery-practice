(() => {
  const inPages = location.pathname.includes("/pages/");
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function apiFile(name) {
    return (inPages ? "../api/" : "api/") + name + ".php";
  }

  function pageFile(name, query = "") {
    return (inPages ? "" : "pages/") + name + query;
  }

  function mediaUrl(url) {
    if (!url) return "";
    if (!url.startsWith("/uploads/")) return url;
    return (inPages ? "../uploads/" : "uploads/") + url.split("/").pop();
  }

  async function api(name, options = {}) {
    const response = await fetch(apiFile(name) + (options.query || ""), {
      method: options.method || "GET",
      headers: options.json ? { "Content-Type": "application/json" } : undefined,
      body: options.form || (options.json ? JSON.stringify(options.json) : undefined),
      credentials: "same-origin"
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      const error = new Error(data.error || "Ошибка запроса");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function esc(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function typeInfo(type) {
    if (type === "video") return { label: "Видео", icon: "videocam" };
    if (type === "audio") return { label: "Аудио", icon: "headphones" };
    return { label: "Изображение", icon: "image" };
  }

  function dateText(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Недавно";

    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return "Сегодня";
    if (days === 1) return "Вчера";
    if (days < 5) return days + " дня назад";
    if (days < 30) return days + " дней назад";

    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function initials(name) {
    return (String(name || "MG").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "MG");
  }

  function cardHtml(material, canDelete = false) {
    const info = typeInfo(material.type);
    const detail = pageFile("detail.html", "?id=" + material.id);

    let image;

    if (material.type === "video") {
      const videoSource = mediaUrl(material.fileUrl || material.sourceUrl || "");
      const poster = mediaUrl(material.thumbnailUrl || "");

      image = videoSource
        ? '<video src="' + esc(videoSource) + '"' +
            (poster ? ' poster="' + esc(poster) + '"' : '') +
            ' muted playsinline preload="metadata"></video>'
        : '<div class="mg-card__placeholder"><span class="material-symbols-outlined">' + info.icon + '</span></div>';
    } else if (material.type === "image") {
      const preview = mediaUrl(material.fileUrl || material.sourceUrl || material.thumbnailUrl || "");
      image = preview
        ? '<img src="' + esc(preview) + '" alt="' + esc(material.title) + '">'
        : '<div class="mg-card__placeholder"><span class="material-symbols-outlined">' + info.icon + '</span></div>';
    } else {
      const preview = mediaUrl(material.thumbnailUrl || "");
      image = preview
        ? '<img src="' + esc(preview) + '" alt="' + esc(material.title) + '">'
        : '<div class="mg-card__placeholder"><span class="material-symbols-outlined">' + info.icon + '</span></div>';
    }

    const action = canDelete
      ? '<button class="mg-card__save" type="button" data-api-delete="' + material.id + '" aria-label="Удалить"><span class="material-symbols-outlined">delete</span></button>'
      : '<button class="mg-card__save" type="button" aria-label="Сохранить"><span class="material-symbols-outlined">bookmark_border</span></button>';

    return '' +
      '<article class="mg-card" data-material-id="' + material.id + '" data-material-type="' + esc(material.type) + '" data-material-created="' + esc(material.createdAt || "") + '" data-material-views="' + Number(material.views || 0) + '" data-material-likes="' + Number(material.likes || 0) + '" data-mg-search-text="' + esc([
        material.title,
        material.description,
        material.category,
        (material.tags || []).join(" "),
        material.author?.name
      ].join(" ")) + '">' +
        '<a class="mg-card__preview" href="' + detail + '">' +
          image +
          '<span class="mg-card__type"><span class="material-symbols-outlined">' + info.icon + '</span>' + info.label + '</span>' +
          action +
          ((material.type === "video" || material.type === "audio")
            ? '<span class="mg-card__play"><span class="material-symbols-outlined">play_arrow</span></span>'
            : '') +
        '</a>' +
        '<div class="mg-card__body">' +
          '<div class="mg-card__topline">' +
            '<span class="mg-card__category">' + esc(material.category) + '</span>' +
            '<span class="mg-card__date">' + esc(dateText(material.createdAt)) + '</span>' +
          '</div>' +
          '<h3 class="mg-card__title">' + esc(material.title) + '</h3>' +
          '<p class="mg-card__description">' + esc(material.description || "Без описания") + '</p>' +
          '<div class="mg-card__footer">' +
            '<div class="mg-card__author">' +
              '<span class="mg-card__avatar-fallback">' + esc(initials(material.author?.name)) + '</span>' +
              '<span class="mg-card__author-name">' + esc(material.author?.name || "Автор") + '</span>' +
            '</div>' +
            '<div class="mg-card__metrics">' +
              '<span class="mg-card__metric mg-card__metric--likes" role="button" tabindex="0" data-api-like="' + material.id + '" aria-pressed="' + (material.liked ? "true" : "false") + '">' +
                '<span class="material-symbols-outlined">' + (material.liked ? "favorite" : "favorite_border") + '</span>' +
                '<span data-like-count>' + Number(material.likes || 0) + '</span>' +
              '</span>' +
              '<span class="mg-card__metric"><span class="material-symbols-outlined">' + (material.type === "audio" ? "headphones" : "visibility") + '</span>' + Number(material.views || 0) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function findCardContainer(scope) {
    const first = scope.querySelector(".mg-card");
    return first ? first.parentElement : null;
  }

  function renderCards(scope, materials, canDelete = false) {
    const container = findCardContainer(scope);
    if (!container) return null;

    if (!materials.length) {
      container.innerHTML =
        '<div class="col-span-full w-full rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-sm">' +
          '<span class="material-symbols-outlined text-[36px] text-outline">search_off</span>' +
          '<h3 class="font-headline-sm text-headline-sm text-on-surface mt-2">Материалов пока нет</h3>' +
          '<p class="font-body-md text-body-md text-on-surface-variant mt-1">Измените фильтры или добавьте новый материал.</p>' +
        '</div>';
      return container;
    }

    container.innerHTML = materials.map((material) => cardHtml(material, canDelete)).join("");

    if (scope.classList.contains("mobile-view")) {
      container.querySelectorAll(".mg-card").forEach((card) => {
        const type = card.dataset.materialType;
        const badge = card.querySelector(".mg-card__type");
        const save = card.querySelector(".mg-card__save");
        const saveIcon = save?.querySelector(".material-symbols-outlined");

        if (save && !save.hasAttribute("data-api-delete")) {
          save.setAttribute("aria-label", "Сохранить");
          if (saveIcon) saveIcon.textContent = "bookmark_border";
        }

        if (type === "image") {
          if (badge) badge.textContent = "ФОТО";
        } else if (type === "video") {
          if (badge) badge.textContent = "ВИДЕО";
        } else if (type === "audio") {
          if (badge) badge.textContent = "АУДИО";
        }
      });
    }

    return container;
  }

  function toast(text, isError = false) {
    let box = document.getElementById("mg-toast");

    if (!box) {
      box = document.createElement("div");
      box.id = "mg-toast";
      box.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:99999;padding:12px 16px;border-radius:12px;max-width:360px;font:500 14px/20px Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.16)";
      document.body.appendChild(box);
    }

    box.textContent = text;
    box.style.background = isError ? "#ffdad6" : "#ffffff";
    box.style.color = isError ? "#93000a" : "#0b1c30";
    box.hidden = false;

    clearTimeout(box.timer);
    box.timer = setTimeout(() => {
      box.hidden = true;
    }, 3000);
  }

  let userCache;

  async function getUser(force = false) {
    if (!force && userCache !== undefined) return userCache;

    try {
      userCache = (await api("me")).user;
    } catch (error) {
      if (error.status === 401) userCache = null;
      else throw error;
    }

    return userCache;
  }

  function updateHeader(user) {
    document.querySelectorAll("header").forEach((header) => {
      header.querySelectorAll('[data-path="admin-panel"],[data-path="panel-administratora"]').forEach((link) => {
        link.style.display = user?.role === "admin" ? "" : "none";
      });

      header.querySelectorAll("span,p").forEach((node) => {
        const text = node.textContent.trim();
        if (text === "Алексей Смирнов") node.textContent = user ? user.name : "Гость";
        if (text === "alex.smirnov@example.com") node.textContent = user ? user.email : "Не авторизован";
      });
    });

    document.querySelectorAll(".mg-mobile-nav__account").forEach((link) => {
      link.dataset.path = user ? "profile" : "login";
      const label = link.querySelector("span:last-child");
      if (label) label.textContent = user ? "Кабинет" : "Войти";
    });
  }

  async function initUser() {
    const user = await getUser().catch(() => null);
    updateHeader(user);
  }

  async function initMobileHome() {
    if (page !== "index.html") return;

    const mobile = document.querySelector(".mobile-view");
    if (!mobile) return;

    const heading = [...mobile.querySelectorAll("h2")].find((node) => {
      return node.textContent.trim() === "Новые материалы";
    });
    const section = heading?.closest("section");
    if (!section) return;

    const container = [...section.children].find((child) => {
      return child !== heading?.parentElement &&
        child.querySelector("h3") &&
        !child.querySelector("h2");
    });
    if (!container) return;

    const result = await api("materials", { query: "?limit=4" });
    const materials = (result.materials || []).slice(0, 4);

    container.className = "flex flex-col gap-space-md";
    container.innerHTML = materials.length
      ? materials.map((material) => cardHtml(material)).join("")
      : '<div class="w-full rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-sm">' +
          '<span class="material-symbols-outlined text-[32px] text-outline">perm_media</span>' +
          '<p class="font-body-md text-body-md text-on-surface-variant mt-2">Материалов пока нет</p>' +
        '</div>';

    container.querySelectorAll(".mg-card").forEach((card) => {
      const type = card.dataset.materialType;
      const badge = card.querySelector(".mg-card__type");
      const save = card.querySelector(".mg-card__save");
      const saveIcon = save?.querySelector(".material-symbols-outlined");

        if (save && !save.hasAttribute("data-api-delete")) {
          save.setAttribute("aria-label", "Сохранить");
          if (saveIcon) saveIcon.textContent = "bookmark_border";
        }

      if (type === "image") {
        if (badge) badge.textContent = "ФОТО";
      } else if (type === "video") {
        if (badge) badge.textContent = "ВИДЕО";
      } else if (type === "audio") {
        if (badge) badge.textContent = "АУДИО";
      }
    });

    const allLink = [...section.querySelectorAll("a")].find((link) =>
      /^Все\s*\(/i.test(link.textContent.trim())
    );
    if (allLink) allLink.textContent = "Все (" + Number(result.total || materials.length) + ")";
  }

  function initHeaderSearch() {
    document.querySelectorAll("header").forEach((header) => {
      header.querySelectorAll("input").forEach((input) => {
        if (!/поиск/i.test(input.placeholder || "")) return;

        const go = () => {
          const q = input.value.trim();
          location.href = pageFile("search.html", q ? "?q=" + encodeURIComponent(q) : "");
        };

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            go();
          }
        });

        input.closest("form")?.addEventListener("submit", (event) => {
          event.preventDefault();
          go();
        });
      });
    });
  }

  document.addEventListener("click", async (event) => {
    const logout = event.target.closest('a[data-path="login"]');

    if (logout && /выйти/i.test(logout.textContent)) {
      const user = await getUser().catch(() => null);

      if (user) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await api("logout", { method: "POST" }).catch(() => {});
        userCache = null;
        location.href = pageFile("login.html");
        return;
      }
    }

    const like = event.target.closest("[data-api-like]");

    if (like) {
      event.preventDefault();
      event.stopPropagation();

      try {
        const result = await api("like", {
          method: "POST",
          json: { id: Number(like.dataset.apiLike) }
        });

        const icon = like.querySelector(".material-symbols-outlined");
        const count = like.querySelector("[data-like-count]");

        if (icon) icon.textContent = result.liked ? "favorite" : "favorite_border";
        if (count) count.textContent = result.likes;
        like.setAttribute("aria-pressed", result.liked ? "true" : "false");
      } catch (error) {
        if (error.status === 401) {
          location.href = pageFile("login.html");
        } else {
          toast(error.message, true);
        }
      }
    }

    const deleteButton = event.target.closest("[data-api-delete]");

    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();

      if (!confirm("Удалить этот материал?")) return;

      try {
        await api("delete_material", {
          method: "POST",
          json: { id: Number(deleteButton.dataset.apiDelete) }
        });

        deleteButton.closest(".mg-card")?.remove();

        if (page === "detail.html") {
          location.href = pageFile("gallery.html");
        } else {
          toast("Материал удалён");
        }
      } catch (error) {
        toast(error.message, true);
      }
    }
  }, true);

  window.MG = {
    page,
    inPages,
    api,
    pageFile,
    mediaUrl,
    cardHtml,
    renderCards,
    getUser,
    updateHeader,
    toast,
    esc,
    typeInfo,
    dateText
  };

  initUser();
  initHeaderSearch();
  initMobileHome().catch((error) => toast(error.message, true));
})();
