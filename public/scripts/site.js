/* DILO Creative Lab - accessibility, palette preview and navigation glue.
   The published interaction bundle owns the animations; this file keeps the
   persistent navigation, document metadata and focus model in sync. */
(function () {
  "use strict";

  var pageLabels = {
    "/": "Home",
    "/evenements": "Events",
    "/a-propos": "About",
    "/contact": "Contact",
  };

  var root = document.documentElement;
  var latestTitle = document.title;
  var navWasOpen = false;
  var lastNavFocus = null;
  var titleOverrideInstalled = false;

  function normalizePath(pathname) {
    var path = (pathname || "/").split("?")[0].split("#")[0];
    if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
    if (path.endsWith(".html")) path = path.slice(0, -".html".length);
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  }

  function updateNav(path) {
    var nav = document.querySelector("[data-twostep-nav]");
    if (!nav) return;
    var current = normalizePath(path || location.pathname);
    nav.querySelectorAll("a.twostep-nav__logo, a.twostep-nav__link").forEach(function (link) {
      var href = normalizePath(link.getAttribute("href") || "");
      var isCurrent = href === current;
      link.classList.toggle("w--current", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function syncNavState() {
    var nav = document.querySelector("[data-twostep-nav]");
    if (!nav) return;
    var toggle = nav.querySelector('[data-nav-toggle="toggle"]');
    var menu = nav.querySelector(".twostep-nav__bottom");
    var active = nav.getAttribute("data-nav-status") === "active";

    if (toggle) {
      toggle.setAttribute("aria-expanded", String(active));
      toggle.setAttribute("aria-label", active ? "Close menu" : "Open menu");
    }
    if (menu) {
      menu.toggleAttribute("inert", !active);
      menu.setAttribute("aria-hidden", String(!active));
    }
    var main = document.getElementById("main-content");
    if (main) main.toggleAttribute("inert", active);
    root.classList.toggle("nav-open", active);

    if (active && !navWasOpen) {
      navWasOpen = true;
      lastNavFocus = document.activeElement;
      window.setTimeout(function () {
        if (nav.getAttribute("data-nav-status") !== "active" || !menu) return;
        var first = menu.querySelector("a, button");
        if (first) first.focus({ preventScroll: true });
      }, 280);
    } else if (!active && navWasOpen) {
      navWasOpen = false;
      if (lastNavFocus && typeof lastNavFocus.focus === "function") {
        lastNavFocus.focus({ preventScroll: true });
      }
      lastNavFocus = null;
    }
  }

  function parseNext(html) {
    if (!html) return null;
    try {
      return new DOMParser().parseFromString(html, "text/html");
    } catch (_error) {
      return null;
    }
  }

  function updateMetadata(nextHtml) {
    var parsed = parseNext(nextHtml);
    if (!parsed) return;
    var title = parsed.querySelector("title");
    if (title && title.textContent) {
      latestTitle = title.textContent;
      document.title = latestTitle;
    }
    var description = parsed.querySelector('meta[name="description"]');
    var localDescription = document.querySelector('meta[name="description"]');
    if (description && localDescription) {
      localDescription.setAttribute("content", description.getAttribute("content") || "");
    }
    var nextCanonical = parsed.querySelector('link[rel="canonical"]');
    var localCanonical = document.querySelector('link[rel="canonical"]');
    if (nextCanonical && localCanonical) {
      localCanonical.setAttribute("href", nextCanonical.getAttribute("href") || "");
    }
  }

  function announcePage(path) {
    var status = document.getElementById("page-status");
    if (!status) return;
    var current = normalizePath(path || location.pathname);
    status.textContent = (pageLabels[current] || document.title) + " page";
  }

  function closeMenuIfOpen() {
    var nav = document.querySelector("[data-twostep-nav]");
    if (nav && nav.getAttribute("data-nav-status") === "active") {
      nav.setAttribute("data-nav-status", "not-active");
      syncNavState();
    }
  }

  function installTitleOverride() {
    if (titleOverrideInstalled) return;
    titleOverrideInstalled = true;
    // Registered after the published bundle so this listener runs last.
    window.addEventListener("focus", function () {
      document.title = latestTitle;
    });
    window.addEventListener("blur", function () {
      document.title = "Hey, come back?";
    });
  }

  function paletteIsValid(value) {
    return value === "black" || value === "lime";
  }

  function syncPaletteUi() {
    var palette = root.getAttribute("data-palette");
    if (!paletteIsValid(palette)) palette = "black";
    var switcher = document.querySelector("[data-palette-switcher]");
    if (switcher) {
      switcher.querySelectorAll("[data-palette-option]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-palette-option") === palette));
      });
    }
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", palette === "lime" ? "#BAFF57" : "#000000");
  }

  function applyPalette(palette, updateUrl) {
    if (!paletteIsValid(palette)) palette = "black";
    root.setAttribute("data-palette", palette);
    try {
      window.localStorage.setItem("dilo-palette", palette);
    } catch (_error) {
      /* Storage can be unavailable in hardened browsers. */
    }
    if (updateUrl && window.history && window.history.replaceState) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("palette", palette);
        window.history.replaceState(window.history.state, "", url);
      } catch (_error) {
        /* Ignore malformed URLs. */
      }
    }
    syncPaletteUi();
  }

  function setupPaletteSwitcher() {
    var switcher = document.querySelector("[data-palette-switcher]");
    if (!switcher) return;
    switcher.addEventListener("click", function (event) {
      var button = event.target.closest("[data-palette-option]");
      if (!button) return;
      applyPalette(button.getAttribute("data-palette-option"), true);
    });
    syncPaletteUi();
  }

  function setup() {
    updateNav(location.pathname);
    syncNavState();
    setupPaletteSwitcher();

    var nav = document.querySelector("[data-twostep-nav]");
    if (nav && window.MutationObserver) {
      new MutationObserver(syncNavState).observe(nav, {
        attributes: true,
        attributeFilter: ["data-nav-status"],
      });
    }

    // The open menu covers the page and the page is inert. Keep Tab inside the
    // menu so keyboard focus cannot land on a visually covered layer.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return;
      var currentNav = document.querySelector("[data-twostep-nav]");
      if (!currentNav || currentNav.getAttribute("data-nav-status") !== "active") return;
      var toggle = currentNav.querySelector('[data-nav-toggle="toggle"]');
      var menu = currentNav.querySelector(".twostep-nav__bottom");
      if (!toggle || !menu) return;
      var menuItems = Array.prototype.slice
        .call(menu.querySelectorAll("a, button"))
        .filter(function (el) {
          var rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      if (!menuItems.length) return;
      var first = toggle;
      var last = menuItems[menuItems.length - 1];

      if (!currentNav.contains(document.activeElement)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    });

    // The published mouse trail injects decorative <img> nodes without alt
    // text. Mark them as such as they appear.
    function markTrailImages(rootNode) {
      var scope = rootNode && rootNode.querySelectorAll ? rootNode : document;
      var images = [];
      if (scope.nodeType === 1 && scope.matches(".mwg020 .created-img")) images.push(scope);
      images = images.concat(Array.prototype.slice.call(scope.querySelectorAll(".mwg020 .created-img")));
      images.forEach(function (img) {
        img.setAttribute("alt", "");
        img.setAttribute("aria-hidden", "true");
      });
    }
    markTrailImages(document);
    if (window.MutationObserver) {
      new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) markTrailImages(node);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }

    if (window.barba && window.barba.hooks) {
      window.barba.hooks.before(function () {
        var container = document.querySelector('[data-barba="container"]');
        if (container) container.setAttribute("aria-busy", "true");
        closeMenuIfOpen();
      });

      window.barba.hooks.afterEnter(function (data) {
        var container = document.querySelector('[data-barba="container"]');
        if (container) container.removeAttribute("aria-busy");
        updateNav(location.pathname);
        updateMetadata(data && data.next ? data.next.html : "");
        latestTitle = document.title;
        announcePage(location.pathname);
        syncNavState();
        syncPaletteUi();
        if (container) {
          window.setTimeout(function () {
            container.focus({ preventScroll: true });
          }, 60);
        }
      });
    }

    // If the loader bundle ever fails, don't leave a full-screen curtain.
    window.setTimeout(function () {
      var loader = document.querySelector("[data-load-wrap]");
      if (!loader) return;
      if (window.getComputedStyle(loader).display !== "none") {
        loader.style.display = "none";
        root.classList.add("tds-loader-off");
      }
    }, 8000);

    if (document.readyState === "complete") installTitleOverride();
    else window.addEventListener("load", installTitleOverride, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
