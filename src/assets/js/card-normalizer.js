(() => {
  var TYPES = {
    image: { label: "Изображение", icon: "image" },
    video: { label: "Видео", icon: "videocam" },
    audio: { label: "Аудио", icon: "graphic_eq" }
  };

  var categories = [
    "Фотографии","Фото","Музыка","Обучение","Развлечения","Архитектура",
    "Путешествия","Технологии","Город","Подкасты","Звуковые эффекты",
    "Звуки","Дизайн","Природа","Electronic"
  ];

  var dateRe = /(Сегодня(?:,\s*\d{1,2}:\d{2})?|Вчера(?:,\s*\d{1,2}:\d{2})?|(?:Неделю|Недели|Неделя)\s+назад|\d+\s*(?:час(?:а|ов)?|дн(?:я|ей)|нед(?:\.|еля|ели|елю)?|месяц(?:а|ев)?)\s+назад|\d{1,2}\s+(?:янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)[а-я]*\s*(?:\d{4})?)/i;

  function clean(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function inferType(root) {
    var path = location.pathname.toLowerCase();
    if (path.endsWith("/images.html")) return "image";
    if (path.endsWith("/videos.html")) return "video";
    if (path.endsWith("/audio.html")) return "audio";

    var text = clean(root.textContent).toLowerCase();
    if (
      text.indexOf("аудио") !== -1 ||
      text.indexOf("подкаст") !== -1 ||
      text.indexOf("музыка") !== -1 ||
      text.indexOf("звуки") !== -1 ||
      text.indexOf("music_note") !== -1 ||
      text.indexOf("graphic_eq") !== -1 ||
      text.indexOf("headphones") !== -1
    ) return "audio";

    if (
      text.indexOf("видео") !== -1 ||
      text.indexOf("videocam") !== -1 ||
      text.indexOf("play_circle") !== -1
    ) return "video";

    return "image";
  }

  function largestPreviewImage(root) {
    var images = Array.from(root.querySelectorAll("img"));
    var ranked = images.map(function(img) {
      var rect = img.getBoundingClientRect();
      return { img: img, area: rect.width * rect.height };
    }).sort(function(a, b) { return b.area - a.area; });

    if (!ranked.length || ranked[0].area <= 2500) return "";
    return ranked[0].img.currentSrc || ranked[0].img.src || "";
  }

  function avatarImage(root) {
    var images = Array.from(root.querySelectorAll("img"));
    var avatar = images.find(function(img) {
      var rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.width <= 48 && rect.height > 0 && rect.height <= 48;
    });
    return avatar ? (avatar.currentSrc || avatar.src || "") : "";
  }

  function titleElement(root) {
    var heading = root.querySelector("h2, h3, h4");
    if (heading) return heading;

    var candidates = Array.from(root.querySelectorAll(".font-title-md, [class*='text-title-md']"));
    return candidates.find(function(el) {
      var text = clean(el.textContent);
      return text.length >= 3 &&
        text.length <= 120 &&
        !/^(Изображение|ФОТО|Фото|Видео|ВИДЕО|Аудио|АУДИО|Музыка|МУЗЫКА|Подкаст|ПОДКАСТ|Звуки|ЗВУКИ)$/i.test(text);
    }) || null;
  }

  function firstHeading(root) {
    var heading = titleElement(root);
    return clean(heading && heading.textContent) || "Мультимедийный материал";
  }

  function description(root, title) {
    var paragraphs = Array.from(root.querySelectorAll("p"))
      .map(function(p) { return clean(p.textContent); })
      .filter(function(text) {
        return text.length >= 22 &&
          text !== title &&
          !dateRe.test(text) &&
          !/^(MP3|FLAC|RAW|4K|FHD|Публичный)/i.test(text);
      })
      .sort(function(a, b) { return b.length - a.length; });

    return paragraphs[0] || "Материал из общей мультимедийной галереи.";
  }

  function category(root, type) {
    var text = clean(root.textContent).toLowerCase();
    var found = categories.find(function(item) {
      return text.indexOf(item.toLowerCase()) !== -1;
    });
    if (found === "Фото") return "Фотографии";
    if (found === "Звуки") return "Звуковые эффекты";
    if (found) return found;
    if (type === "image") return "Фотографии";
    return "Другое";
  }

  function date(root) {
    var match = clean(root.textContent).match(dateRe);
    return clean(match && match[0]) || "Недавно";
  }

  function metricAfterIcon(root, names) {
    var icons = Array.from(root.querySelectorAll(".material-symbols-outlined"));
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      if (names.indexOf(clean(icon.textContent)) === -1) continue;
      var parentText = clean(icon.parentElement && icon.parentElement.textContent)
        .replace(clean(icon.textContent), "")
        .trim();
      var number = parentText.match(/[\d.,]+\s*[kкKК]?/);
      if (number) return number[0];
    }
    return "";
  }

  function author(root, title) {
    var images = Array.from(root.querySelectorAll("img"));
    var avatar = images.find(function(img) {
      var rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.width <= 48 && rect.height > 0 && rect.height <= 48;
    });

    if (avatar && avatar.parentElement) {
      var avatarText = clean(avatar.parentElement.textContent)
        .replace(/person|favorite|visibility|headphones|schedule/gi, "")
        .replace(dateRe, "")
        .replace(/^[А-ЯA-ZЁ]{1,3}\s+(?=[А-ЯA-ZЁ])/u, "")
        .trim();
      if (avatarText && avatarText !== title) return avatarText;
    }

    var personIcon = Array.from(root.querySelectorAll(".material-symbols-outlined"))
      .find(function(icon) { return clean(icon.textContent) === "person"; });
    if (personIcon && personIcon.parentElement) {
      var personText = clean(personIcon.parentElement.textContent).replace("person", "").trim();
      if (personText) return personText.replace(dateRe, "").trim();
    }

    if (location.pathname.toLowerCase().indexOf("profile") !== -1) {
      return "Алексей Смирнов";
    }

    var categoryLower = categories.map(function(item) { return item.toLowerCase(); });
    var allText = Array.from(root.querySelectorAll("span, p, div"))
      .map(function(el) { return clean(el.textContent); })
      .filter(function(text) {
        return /^[А-ЯA-ZЁ][А-Яа-яA-Za-zЁё .'-]{2,40}$/.test(text) &&
          text !== title &&
          categoryLower.indexOf(text.toLowerCase()) === -1 &&
          !/Изображение|Фото|Видео|Аудио|Публичный|Недавно|МУЗЫКА|ПОДКАСТ|ЗВУКИ/i.test(text);
      });

    if (allText.length) return allText[allText.length - 1];

    var titleNode = titleElement(root);
    if (titleNode && titleNode.parentElement) {
      var bulletLine = Array.from(titleNode.parentElement.querySelectorAll("span,p"))
        .map(function(el) { return clean(el.textContent); })
        .find(function(text) {
          return text.indexOf("•") !== -1 && text.length <= 90 && !/kbps|МБ|MB|fps/i.test(text.split("•")[0]);
        });
      if (bulletLine) {
        var beforeBullet = clean(bulletLine.split("•")[0]);
        if (beforeBullet && beforeBullet !== title) return beforeBullet;
      }
    }

    return "Автор";
  }

  function cleanAuthorName(name) {
    return clean(name)
      .replace(dateRe, "")
      .replace(/^[А-ЯA-ZЁ]{1,3}\s+(?=[А-ЯA-ZЁ])/u, "")
      .replace(/\s*[•·]\s*(?:Lossless|FLAC|MP3|RAW|4K|FHD|Electronic|Folk Instrumental).*$/i, "")
      .trim() || "Автор";
  }

  function initials(name) {
    var parts = cleanAuthorName(name).split(/\s+/).slice(0, 2);
    var result = parts.map(function(part) { return part.charAt(0); }).join("").toUpperCase();
    return result || "MG";
  }

  function mediaCandidate(root) {
    var text = clean(root.textContent);
    if (!titleElement(root)) return false;
    return /(Изображение|ФОТО|Фото|Видео|ВИДЕО|Аудио|АУДИО|Музыка|МУЗЫКА|Подкаст|ПОДКАСТ|Звуки|ЗВУКИ)/i.test(text);
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  }

  function cardHtml(data) {
    var info = TYPES[data.type];
    var playable = data.type === "video" || data.type === "audio";
    var preview = data.preview
      ? '<img src="' + escapeHtml(data.preview) + '" alt="">'
      : '<div class="mg-card__placeholder"><span class="material-symbols-outlined">' + info.icon + '</span></div>';
    var avatar = data.avatar
      ? '<img class="mg-card__avatar" src="' + escapeHtml(data.avatar) + '" alt="">'
      : '<span class="mg-card__avatar-fallback">' + escapeHtml(initials(data.author)) + '</span>';

    var detailBase = location.pathname.indexOf("/pages/") !== -1 ? "detail.html" : "pages/detail.html";
    var detailHref = detailBase + "?type=" + encodeURIComponent(data.type);

    return '' +
      '<a class="mg-card__preview" href="' + detailHref + '" aria-label="' + escapeHtml(data.title) + '">' +
        preview +
        '<span class="mg-card__type"><span class="material-symbols-outlined">' + info.icon + '</span>' + info.label + '</span>' +
        '<button class="mg-card__save" type="button" aria-label="Сохранить"><span class="material-symbols-outlined">bookmark_border</span></button>' +
        (playable ? '<span class="mg-card__play"><span class="material-symbols-outlined">play_arrow</span></span>' : '') +
      '</a>' +
      '<div class="mg-card__body">' +
        '<div class="mg-card__topline">' +
          '<span class="mg-card__category">' + escapeHtml(data.category) + '</span>' +
          '<span class="mg-card__date">' + escapeHtml(data.date) + '</span>' +
        '</div>' +
        '<h3 class="mg-card__title">' + escapeHtml(data.title) + '</h3>' +
        '<p class="mg-card__description">' + escapeHtml(data.description) + '</p>' +
        '<div class="mg-card__footer">' +
          '<div class="mg-card__author">' +
            avatar +
            '<span class="mg-card__author-name">' + escapeHtml(data.author) + '</span>' +
          '</div>' +
          '<div class="mg-card__metrics">' +
            '<span class="mg-card__metric mg-card__metric--likes"><span class="material-symbols-outlined">favorite</span>' + escapeHtml(data.likes || "0") + '</span>' +
            '<span class="mg-card__metric"><span class="material-symbols-outlined">' + (data.type === "audio" ? "headphones" : "visibility") + '</span>' + escapeHtml(data.views || "—") + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function normalize(root) {
    if (!root || root.dataset.mgNormalized === "1") return;

    var originalSearchText = clean(root.textContent);

    var data = {
      type: inferType(root),
      preview: largestPreviewImage(root),
      avatar: avatarImage(root),
      title: firstHeading(root),
      description: "",
      category: "",
      date: "",
      author: "",
      likes: metricAfterIcon(root, ["favorite", "favorite_border"]),
      views: metricAfterIcon(root, ["visibility", "headphones", "graphic_eq"])
    };

    data.description = description(root, data.title);
    data.category = category(root, data.type);
    data.date = date(root);
    data.author = cleanAuthorName(author(root, data.title))
      .replace(/\b(?:share|download|bookmark_border|more_vert)\b/gi, "")
      .trim() || "Автор";
    if (data.author.toLowerCase().indexOf(data.title.toLowerCase()) !== -1) {
      data.author = "Автор";
    }

    root.dataset.mgNormalized = "1";
    root.dataset.mgSearchText = originalSearchText;
    root.className = "mg-card";
    root.innerHTML = cardHtml(data);
  }

  function normalizeArticles(scope) {
    var path = location.pathname.toLowerCase();
    var dedicatedCatalog =
      path.endsWith("/gallery.html") ||
      path.endsWith("/images.html") ||
      path.endsWith("/videos.html") ||
      path.endsWith("/audio.html") ||
      path.endsWith("/search.html");

    var articles = Array.from(scope.querySelectorAll("main article"));

    if (dedicatedCatalog) {
      articles.forEach(normalize);
      return;
    }

    articles.filter(mediaCandidate).forEach(normalize);
  }

  function allowLooseCard(card) {
    var path = location.pathname.toLowerCase();
    if (path.endsWith("/") || path.endsWith("/index.html")) {
      var section = card.closest("section");
      var sectionHeading = section && section.querySelector("h2");
      return clean(sectionHeading && sectionHeading.textContent) === "Новые материалы";
    }
    if (
      path.indexOf("/audio") !== -1 ||
      path.indexOf("/images") !== -1 ||
      path.indexOf("/videos") !== -1 ||
      path.indexOf("/profile") !== -1
    ) return true;
    return false;
  }

  function normalizeLooseCards(scope) {
    Array.from(scope.querySelectorAll("h2,h3,h4")).forEach(function(heading) {
      if (heading.closest(".mg-card") || heading.closest("article")) return;

      var headingText = clean(heading.textContent);
      if (!headingText || /^(Аудио|Видео|Изображения|Галерея|Новые материалы|Популярные категории|Мои материалы|Поиск)$/i.test(headingText)) return;

      var card = heading.parentElement;
      for (var depth = 0; depth < 6 && card && card !== scope; depth++, card = card.parentElement) {
        var cls = typeof card.className === "string" ? card.className : "";
        var text = clean(card.textContent);
        var rounded = cls.indexOf("rounded-xl") !== -1 || cls.indexOf("rounded-2xl") !== -1;
        var surfaced = cls.indexOf("bg-surface-container-lowest") !== -1 || cls.indexOf("bg-white") !== -1;
        var mediaText = /(Изображение|ФОТО|Фото|Видео|ВИДЕО|Аудио|АУДИО|Музыка|МУЗЫКА|Подкаст|ПОДКАСТ|Звуки|ЗВУКИ)/i.test(text);
        var headings = card.querySelectorAll("h2,h3,h4").length;

        if (rounded && surfaced && mediaText && headings === 1 && text.length < 1400 && allowLooseCard(card)) {
          normalize(card);
          break;
        }
      }
    });
  }

  function normalizeRoundedDivCards(scope) {
    Array.from(scope.querySelectorAll("div")).forEach(function(card) {
      if (card.dataset.mgNormalized === "1" || card.closest(".mg-card")) return;

      var cls = typeof card.className === "string" ? card.className : "";
      var rounded = cls.indexOf("rounded-xl") !== -1 || cls.indexOf("rounded-2xl") !== -1;
      var surfaced = cls.indexOf("bg-surface-container-lowest") !== -1 || cls.indexOf("bg-white") !== -1;

      if (location.pathname.toLowerCase().indexOf("/profile") !== -1) {
        var profileHeading = card.querySelector("h2");
        if (clean(profileHeading && profileHeading.textContent) === "Мои материалы") return;
      }

      if (!rounded || !surfaced || !mediaCandidate(card) || !allowLooseCard(card)) return;

      var nestedCandidates = Array.from(card.querySelectorAll("div")).filter(function(child) {
        if (child === card) return false;
        var childCls = typeof child.className === "string" ? child.className : "";
        return (childCls.indexOf("rounded-xl") !== -1 || childCls.indexOf("rounded-2xl") !== -1) &&
          (childCls.indexOf("bg-surface-container-lowest") !== -1 || childCls.indexOf("bg-white") !== -1) &&
          mediaCandidate(child);
      });

      if (nestedCandidates.length === 0) normalize(card);
    });
  }

  function likeStorageKey(card) {
    var preview = card.querySelector(".mg-card__preview img");
    var title = clean(card.querySelector(".mg-card__title") && card.querySelector(".mg-card__title").textContent);
    var source = preview ? (preview.currentSrc || preview.src || "") : "";
    return "mg-like:" + location.pathname + ":" + title + ":" + source;
  }

  function likeCountText(metric) {
    return clean(metric.textContent)
      .replace(/favorite_border|favorite/gi, "")
      .trim();
  }

  function parseLikeCount(value) {
    var normalized = (value || "").replace(",", ".").trim();
    var match = normalized.match(/([\d.]+)\s*([kк])?/i);
    if (!match) return 0;
    var number = parseFloat(match[1]);
    if (!Number.isFinite(number)) return 0;
    return Math.round(number * (match[2] ? 1000 : 1));
  }

  function formatLikeCount(value, original) {
    if (/[kк]/i.test(original || "")) {
      var compact = (value / 1000).toFixed(1).replace(/\.0$/, "");
      return compact + "k";
    }
    return String(value);
  }

  function setLikeState(metric, liked) {
    var icon = metric.querySelector(".material-symbols-outlined");
    var original = metric.dataset.mgLikeOriginal || "0";
    var base = parseLikeCount(original);
    var count = liked ? base + 1 : base;

    metric.setAttribute("aria-pressed", liked ? "true" : "false");
    metric.setAttribute("aria-label", liked ? "Убрать лайк" : "Поставить лайк");

    if (icon) icon.textContent = liked ? "favorite" : "favorite_border";

    var countNode = metric.querySelector("[data-mg-like-count]");
    if (!countNode) {
      countNode = document.createElement("span");
      countNode.dataset.mgLikeCount = "1";
      metric.appendChild(countNode);
    }
    countNode.textContent = formatLikeCount(count, original);
  }

  function activateLikes() {
    document.querySelectorAll(".mg-card__metric--likes").forEach(function(metric) {
      if (metric.dataset.mgLikeReady === "1") return;

      var original = likeCountText(metric) || "0";
      var icon = metric.querySelector(".material-symbols-outlined");
      var countNode = document.createElement("span");
      countNode.dataset.mgLikeCount = "1";
      countNode.textContent = original;

      metric.dataset.mgLikeOriginal = original;
      metric.dataset.mgLikeReady = "1";
      metric.setAttribute("role", "button");
      metric.setAttribute("tabindex", "0");
      metric.innerHTML = "";
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
      }
      metric.appendChild(icon);
      metric.appendChild(countNode);

      var card = metric.closest(".mg-card");
      var key = likeStorageKey(card || metric);
      var liked = false;
      try {
        liked = localStorage.getItem(key) === "1";
      } catch (_) {}

      setLikeState(metric, liked);

      var toggle = function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        var next = metric.getAttribute("aria-pressed") !== "true";
        setLikeState(metric, next);
        try {
          if (next) localStorage.setItem(key, "1");
          else localStorage.removeItem(key);
        } catch (_) {}
      };

      metric.addEventListener("click", toggle);
      metric.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") toggle(event);
      });
    });
  }

  function run() {
    var path = location.pathname.toLowerCase();
    var needsMobileCatalogCards =
      path.endsWith("/gallery.html") ||
      path.endsWith("/images.html") ||
      path.endsWith("/videos.html") ||
      path.endsWith("/audio.html") ||
      path.endsWith("/search.html") ||
      path.endsWith("/profile.html");
    var selector = needsMobileCatalogCards ? ".desktop-view, .mobile-view" : ".desktop-view";

    document.querySelectorAll(selector).forEach(function(scope) {
      normalizeArticles(scope);
      normalizeLooseCards(scope);
      normalizeRoundedDivCards(scope);
    });
  }

  run();

  if (document.readyState === "complete") {
    activateLikes();
  } else {
    window.addEventListener("load", activateLikes, { once: true });
  }
})();
