/* ==========================================================================
   Product Review Carousel — behavior
   Behavior spec:
   - Auto-advances every AUTOPLAY_INTERVAL_MS.
   - Desktop: prev/next buttons AND clicking a review card change the slide.
   - Mobile: only the prev/next buttons change the slide (no card list to click).
   - Hovering pauses autoplay; it resumes AUTOPLAY_INTERVAL_MS after the
     mouse leaves. Clicking/tapping anything in the component pauses it the
     same way, resuming AUTOPLAY_INTERVAL_MS after the last interaction.
   - Dots are a visual indicator only — not clickable.
   ========================================================================== */

(function () {
  "use strict";

  var AUTOPLAY_INTERVAL_MS = 5000;

  function renderStars(root) {
    root.querySelectorAll("[data-rating]").forEach(function (el) {
      var rating = Number(el.dataset.rating);
      var max = Number(el.dataset.max || 5);
      var html = "";
      for (var i = 0; i < max; i++) {
        html +=
          '<svg class="prc__star' +
          (i < rating ? "" : " prc__star--empty") +
          '" width="clamp(16px, 2.5vw, 21px)" height="clamp(15px, 2.5vw, 21px)"><use href="#icon-star"></use></svg>';
      }
      el.innerHTML = html;
    });
  }
  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-prc-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-prc-dot]"));
    var reviewCards = Array.prototype.slice.call(root.querySelectorAll("[data-prc-review]"));
    var prevBtn = root.querySelector("[data-prc-prev]");
    var nextBtn = root.querySelector("[data-prc-next]");

    var total = slides.length;
    if (total === 0) {
      return;
    }
    renderStars(root);
    var activeIndex = findInitialIndex();
    var timerId = null;

    function findInitialIndex() {
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains("is-active")) {
          return i;
        }
      }
      return 0;
    }

    function applyActiveState() {
      for (var i = 0; i < total; i++) {
        var isActive = i === activeIndex;
        toggleActive(slides[i], isActive);
        toggleActive(dots[i], isActive);
        toggleActive(reviewCards[i], isActive);
      }
    }

    function toggleActive(el, isActive) {
      if (!el) {
        return;
      }
      el.classList.toggle("is-active", isActive);
    }

    function goTo(index) {
      activeIndex = ((index % total) + total) % total; // wrap both directions
      applyActiveState();
      scheduleNextAdvance(); // manual navigation always restarts the quiet period
    }

    function next() {
      goTo(activeIndex + 1);
    }

    function prev() {
      goTo(activeIndex - 1);
    }

    function clearTimer() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    }

    // Reschedules autoplay for AUTOPLAY_INTERVAL_MS from *now*. Calling this
    // is how every interaction (manual nav, click, tap, mouse leaving) buys
    // another quiet period before the next auto-advance.
    function scheduleNextAdvance() {
      clearTimer();
      timerId = setTimeout(function () {
        activeIndex = (activeIndex + 1) % total;
        applyActiveState();
        scheduleNextAdvance();
      }, AUTOPLAY_INTERVAL_MS);
    }

    // --- wire up controls ---

    if (prevBtn) {
      prevBtn.addEventListener("click", prev);
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", next);
    }

    reviewCards.forEach(function (card, index) {
      function activateUnlessInnerControl(event) {
        // Let an in-card "View Product" link navigate normally without
        // also being treated as a generic "tap inside the component".
        if (event.target.closest("a, button")) {
          return;
        }
        goTo(index);
      }

      card.addEventListener("click", activateUnlessInnerControl);

      // tabindex="0" makes the card focusable, so it needs the matching
      // keyboard behavior (Enter/Space) to actually be operable that way.
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); // stop Space from scrolling the page
          activateUnlessInnerControl(event);
        }
      });
    });

    // Hover: pause immediately, resume once the mouse actually leaves.
    root.addEventListener("mouseenter", clearTimer);
    root.addEventListener("mouseleave", scheduleNextAdvance);

    // Any tap/click inside the component (e.g. tapping the photo on
    // mobile, where there's no hover) buys another quiet period too.
    root.addEventListener(
      "pointerdown",
      function () {
        scheduleNextAdvance();
      },
      { passive: true },
    );

    // --- go ---
    applyActiveState();
    scheduleNextAdvance();
  }

  function init() {
    var carousels = document.querySelectorAll("[data-prc]");
    carousels.forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
