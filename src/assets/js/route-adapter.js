(() => {
  const inPages = window.location.pathname.includes('/pages/');
  const root = inPages ? '../' : './';
  document.documentElement.classList.remove('mg-mobile-menu-open');

  const routes = {
    'main': root + 'index.html',
    'glavnaya': root + 'index.html',
    'glavnaya-stranitsa': root + 'index.html',
    'gallery': root + 'pages/gallery.html',
    'galereya': root + 'pages/gallery.html',
    'obshchaya-galereya': root + 'pages/gallery.html',
    'images': root + 'pages/images.html',
    'izobrazheniya': root + 'pages/images.html',
    'videos': root + 'pages/videos.html',
    'video': root + 'pages/videos.html',
    'audio': root + 'pages/audio.html',
    'search': root + 'pages/search.html',
    'poisk': root + 'pages/search.html',
    'register': root + 'pages/register.html',
    'login': root + 'pages/login.html',
    'vhod': root + 'pages/login.html',
    'profile': root + 'pages/profile.html',
    'lichnyy-kabinet': root + 'pages/profile.html',
    'add-asset': root + 'pages/upload.html',
    'dobavlenie-materiala': root + 'pages/upload.html',
    'admin-panel': root + 'pages/admin.html',
    'panel-administratora': root + 'pages/admin.html'
  };

  const polishMobileOnly = () => {
    const mobile = document.querySelector('.mobile-view');
    if (!mobile) return;

    const pathname = window.location.pathname.toLowerCase();
    const header = mobile.querySelector('header');

    header?.querySelectorAll('img[src*="logo.svg"]').forEach((logo) => {
      logo.dataset.path = 'main';
      logo.setAttribute('role', 'link');
      logo.setAttribute('aria-label', '\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e');
      logo.tabIndex = 0;
      logo.style.cursor = 'pointer';
    });

    if (pathname.endsWith('/detail.html')) {
      const backIcon = [...(header?.querySelectorAll('.material-symbols-outlined') || [])].find((icon) => {
        return icon.textContent.trim() === 'arrow_back';
      });
      backIcon?.closest('button')?.remove();
    }

    if (/\/(gallery|images|videos|audio)\.html$/.test(pathname)) {
      const content = mobile.querySelector('main > div');
      const intro = [...(content?.children || [])].find((node) => node.querySelector?.('h1'));
      if (intro) intro.style.display = 'none';
    }

    if (pathname.endsWith('/search.html')) {
      const searchSection = mobile.querySelector('main section');
      const headingRow = [...(searchSection?.children || [])].find((node) => node.querySelector?.('h1'));
      if (headingRow) headingRow.style.display = 'none';
    }
  };
  const ensureDesktopSearchLink = () => {
    document.querySelectorAll('.desktop-view header nav').forEach((nav) => {
      if (nav.querySelector('a[data-path="search"]')) return;

      const audioLink = nav.querySelector('a[data-path="audio"]');
      if (!audioLink) return;

      const searchLink = document.createElement('a');
      searchLink.href = '#';
      searchLink.dataset.path = 'search';
      searchLink.textContent = 'Поиск';
      searchLink.className = 'px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors';

      if (window.location.pathname.toLowerCase().endsWith('/search.html')) {
        searchLink.classList.remove('text-on-surface-variant');
        searchLink.classList.add('bg-surface-container-high', 'text-primary', 'font-title-md');
        searchLink.setAttribute('aria-current', 'page');
      }

      audioLink.insertAdjacentElement('afterend', searchLink);
    });
  };

  const ensureMobileNav = () => {
    const mobile = document.querySelector('.mobile-view');
    if (!mobile || mobile.querySelector('.mg-mobile-nav')) return;

    const pathname = window.location.pathname.toLowerCase();
    const active = pathname.endsWith('/gallery.html') ? 'gallery'
      : pathname.endsWith('/images.html') ? 'images'
      : pathname.endsWith('/videos.html') ? 'videos'
      : pathname.endsWith('/search.html') ? 'search'
      : pathname.endsWith('/audio.html') ? 'audio'
      : /\/(login|register|profile)\.html$/.test(pathname) ? 'account'
      : '';

    const item = (path, icon, label, key, extra = '') => {
      const current = active === key;
      return '<a class="mg-mobile-nav__link ' + extra + (current ? ' is-active' : '') + '" data-path="' + path + '" href="#"' +
        (current ? ' aria-current="page"' : '') + '>' +
        '<span class="material-symbols-outlined">' + icon + '</span>' +
        '<span>' + label + '</span>' +
      '</a>';
    };

    const nav = document.createElement('nav');
    nav.className = 'mg-mobile-nav';
    nav.setAttribute('aria-label', 'Мобильная навигация');
    nav.innerHTML = '<div class="mg-mobile-nav__inner">' +
      item('images', 'image', 'Фото', 'images') +
      item('videos', 'movie', 'Видео', 'videos') +
      item('search', 'search', 'Поиск', 'search', ' mg-mobile-nav__search') +
      item('audio', 'audiotrack', 'Аудио', 'audio') +
      item('gallery', 'photo_library', '\u0413\u0430\u043b\u0435\u0440\u0435\u044f', 'gallery') +
    '</div>';

    mobile.appendChild(nav);
  };

  const ensureMobileMenu = () => {
    const mobile = document.querySelector('.mobile-view');
    if (!mobile || mobile.querySelector('.mg-mobile-menu')) return;

    const menuButton = mobile.querySelector('header button[aria-label="Меню"]');
    if (!menuButton) return;

    const menu = document.createElement('div');
    menu.className = 'mg-mobile-menu';
    menu.hidden = true;
    menu.innerHTML =
      '<button class="mg-mobile-menu__backdrop" type="button" data-mobile-menu-close aria-label="Закрыть меню"></button>' +
      '<div class="mg-mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Навигация">' +
        '<div class="mg-mobile-menu__header">' +
          '<strong>Навигация</strong>' +
          '<button class="mg-mobile-menu__close" type="button" data-mobile-menu-close aria-label="Закрыть"><span class="material-symbols-outlined">close</span></button>' +
        '</div>' +
        '<a class="mg-mobile-menu__item" data-path="main" href="#"><span class="material-symbols-outlined">home</span><span>Главная</span></a>' +
        '<a class="mg-mobile-menu__item" data-path="gallery" href="#"><span class="material-symbols-outlined">photo_library</span><span>Галерея</span></a>' +
        '<a class="mg-mobile-menu__item" data-path="add-asset" href="#"><span class="material-symbols-outlined">add_circle</span><span>Добавить материал</span></a>' +
        '<a class="mg-mobile-menu__item" data-path="profile" href="#"><span class="material-symbols-outlined">person</span><span>Личный кабинет</span></a>' +
      '</div>';

    mobile.appendChild(menu);

    const open = () => {
      menu.hidden = false;
      menuButton.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('mg-mobile-menu-open');
    };

    const close = () => {
      menu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('mg-mobile-menu-open');
    };

    menuButton.type = 'button';
    menuButton.setAttribute('aria-expanded', 'false');

    menuButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      menu.hidden ? open() : close();
    });

    menu.querySelectorAll('[data-mobile-menu-close]').forEach((button) => {
      button.addEventListener('click', close);
    });

    menu.querySelectorAll('a[data-path]').forEach((link) => {
      link.addEventListener('click', close);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) close();
    });
  };

  const ensureMobileHeaderActions = () => {
    const mobile = document.querySelector('.mobile-view');
    if (!mobile) return;

    mobile.querySelectorAll('header [aria-label="Поиск"]').forEach((control) => {
      if (!control.dataset.path) control.dataset.path = 'search';
      if (control.tagName === 'BUTTON') control.type = 'button';
    });

    mobile.querySelectorAll('header [aria-label="Профиль"]').forEach((control) => {
      if (!control.dataset.path) control.dataset.path = 'profile';
    });

    const personIcon = [...mobile.querySelectorAll('header .material-symbols-outlined')].find((icon) => {
      return icon.textContent.trim() === 'person';
    });
    const personControl = personIcon?.closest('a,button,div');
    if (personControl && !personControl.dataset.path) {
      personControl.dataset.path = 'profile';
      personControl.setAttribute('role', 'link');
      personControl.tabIndex = 0;
    }

    [...mobile.querySelectorAll('button')].forEach((button) => {
      if (button.dataset.path) return;
      if (button.textContent.replace(/\s+/g, ' ').trim() === 'Добавить') {
        button.dataset.path = 'add-asset';
        button.type = 'button';
      }
    });
  };

  polishMobileOnly();
  ensureDesktopSearchLink();
  ensureMobileNav();
  ensureMobileMenu();
  ensureMobileHeaderActions();

  window.addEventListener('pageshow', () => {
    document.documentElement.classList.remove('mg-mobile-menu-open');
    document.querySelectorAll('.mg-mobile-menu').forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll('.mobile-view header button[aria-label="Меню"]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', async (event) => {
    const shareButton = event.target.closest('.mobile-view button');
    const shareIcon = shareButton?.querySelector('.material-symbols-outlined')?.textContent.trim();

    if (shareButton && shareIcon === 'share') {
      event.preventDefault();

      const shareData = {
        title: document.title || 'MediaGallery',
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          window.MG?.toast?.('Ссылка скопирована');
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          window.MG?.toast?.('Не удалось поделиться ссылкой', true);
        }
      }
      return;
    }

    const link = event.target.closest('[data-path]');
    if (!link) return;
    const path = link.dataset.path;
    if (!routes[path]) return;
    event.preventDefault();
    window.location.href = routes[path];
  });
})();
