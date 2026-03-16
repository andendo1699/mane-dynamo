/**
 * Product Gallery Swiper
 * Initializes Swiper for product image gallery with thumbnail navigation
 * Supports horizontal (bottom) and vertical (left) thumbnail layouts
 */
(function () {
  'use strict';

  window.theme = window.theme || {};
  window.theme.productGallerySwiper = null;
  window.theme.productThumbsSwiper = null;

  function initProductGallerySwiper() {
    // Wait for Swiper to be available
    if (typeof Swiper === 'undefined') {
      setTimeout(initProductGallerySwiper, 100);
      return;
    }

    var mainSliderEl = document.querySelector('[data-product-single-media-slider].swiper');
    var thumbsSliderEl = document.querySelector('[data-product-single-media-thumbs].swiper');

    if (!mainSliderEl) return;

    // Destroy any existing instances first
    if (window.theme.productGallerySwiper && window.theme.productGallerySwiper.destroy) {
      try { window.theme.productGallerySwiper.destroy(true, true); } catch(e) {}
      window.theme.productGallerySwiper = null;
    }
    if (window.theme.productThumbsSwiper && window.theme.productThumbsSwiper.destroy) {
      try { window.theme.productThumbsSwiper.destroy(true, true); } catch(e) {}
      window.theme.productThumbsSwiper = null;
    }

    // Check if there are slides
    var slideNodes = mainSliderEl.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide');
    if (slideNodes.length <= 1) return;

    // Determine thumbs direction
    var isVerticalThumbs = false;
    if (thumbsSliderEl) {
      isVerticalThumbs = thumbsSliderEl.hasAttribute('data-thumbs-direction') &&
                         thumbsSliderEl.getAttribute('data-thumbs-direction') === 'vertical';
    }

    // Initialize thumbs swiper first (if it exists)
    var thumbsSwiper = null;
    if (thumbsSliderEl) {
      var thumbsConfig = {
        slidesPerView: 'auto',
        spaceBetween: 8,
        watchSlidesProgress: true,
        freeMode: true
      };

      if (isVerticalThumbs && window.innerWidth >= 768) {
        thumbsConfig.direction = 'vertical';
        thumbsConfig.spaceBetween = 8;
        thumbsConfig.slidesPerView = 'auto';

        // Set the height of the thumbs container to match main slider
        var mainSliderHeight = mainSliderEl.offsetHeight;
        if (mainSliderHeight > 0) {
          thumbsSliderEl.style.height = mainSliderHeight + 'px';
        } else {
          thumbsSliderEl.style.height = '500px';
        }
      } else {
        thumbsConfig.direction = 'horizontal';
      }

      thumbsSwiper = new Swiper(thumbsSliderEl, thumbsConfig);
      window.theme.productThumbsSwiper = thumbsSwiper;
    }

    // Initialize main gallery swiper
    var mainSwiperConfig = {
      loop: true,
      speed: 400,
      spaceBetween: 0,
      navigation: {
        nextEl: mainSliderEl.querySelector('.swiper-button-next'),
        prevEl: mainSliderEl.querySelector('.swiper-button-prev'),
      },
      on: {
        slideChangeTransitionEnd: function () {
          var activeSlide = this.slides[this.activeIndex];
          if (!activeSlide) return;

          var mediaId = activeSlide.getAttribute('data-media-id');
          if (mediaId) {
            switchMedia(mediaId);
          }
        },
        slideChange: function () {
          var swiperInstance = this;
          var allSlides = swiperInstance.slides;
          for (var s = 0; s < allSlides.length; s++) {
            if (s !== swiperInstance.activeIndex) {
              allSlides[s].dispatchEvent(new CustomEvent('theme:media:hidden', { bubbles: true }));
            }
          }

          var activeSlide = allSlides[swiperInstance.activeIndex];
          if (activeSlide) {
            activeSlide.dispatchEvent(new CustomEvent('theme:media:visible', { bubbles: true }));
          }
        }
      }
    };

    // Link thumbs if available
    if (thumbsSwiper) {
      mainSwiperConfig.thumbs = {
        swiper: thumbsSwiper,
      };
    }

    var mainSwiper = new Swiper(mainSliderEl, mainSwiperConfig);
    window.theme.productGallerySwiper = mainSwiper;

    // After main swiper init, update vertical thumbs height
    if (isVerticalThumbs && thumbsSliderEl && window.innerWidth >= 768) {
      setTimeout(function() {
        var height = mainSliderEl.querySelector('.swiper-slide-active')?.offsetHeight || mainSliderEl.offsetHeight;
        if (height > 0) {
          thumbsSliderEl.style.height = height + 'px';
          if (thumbsSwiper) thumbsSwiper.update();
        }
      }, 100);
    }

    // Handle thumbnail clicks - prevent default link behavior
    if (thumbsSliderEl) {
      var thumbLinks = thumbsSliderEl.querySelectorAll('.product-single__thumbnail-link');
      for (var t = 0; t < thumbLinks.length; t++) {
        thumbLinks[t].addEventListener('click', function (e) {
          e.preventDefault();
        });
      }
    }

    // Listen for media play/pause events
    for (var i = 0; i < slideNodes.length; i++) {
      slideNodes[i].addEventListener('theme:media:play', function () {
        mainSwiper.allowTouchMove = false;
        mainSliderEl.classList.add('has-media-active');
      });
      slideNodes[i].addEventListener('theme:media:pause', function () {
        mainSwiper.allowTouchMove = true;
        mainSliderEl.classList.remove('has-media-active');
      });
    }

    // Handle resize for vertical thumbs
    if (isVerticalThumbs) {
      var resizeHandler = function() {
        if (window.innerWidth >= 768) {
          var height = mainSliderEl.querySelector('.swiper-slide-active')?.offsetHeight || mainSliderEl.offsetHeight;
          if (height > 0 && thumbsSliderEl) {
            thumbsSliderEl.style.height = height + 'px';
            if (thumbsSwiper) {
              thumbsSwiper.changeDirection('vertical');
              thumbsSwiper.update();
            }
          }
        } else {
          if (thumbsSliderEl) {
            thumbsSliderEl.style.height = 'auto';
            if (thumbsSwiper) {
              thumbsSwiper.changeDirection('horizontal');
              thumbsSwiper.update();
            }
          }
        }
      };
      window.addEventListener('resize', resizeHandler);
    }
  }

  function switchMedia(mediaId) {
    var allMediaWrappers = document.querySelectorAll('[data-product-single-media-wrapper]');
    var targetMedia = document.querySelector('[data-product-single-media-wrapper][data-media-id="' + mediaId + '"]');

    for (var w = 0; w < allMediaWrappers.length; w++) {
      allMediaWrappers[w].dispatchEvent(new CustomEvent('theme:media:hidden', { bubbles: true }));
      allMediaWrappers[w].classList.add('media--hidden');
    }

    if (targetMedia) {
      targetMedia.classList.remove('media--hidden');
      targetMedia.dispatchEvent(new CustomEvent('theme:media:visible', { bubbles: true }));

      var deferredMedia = targetMedia.querySelector('[data-deferred-media]');
      if (deferredMedia && deferredMedia.getAttribute('loaded') !== 'true') {
        var deferredButton = targetMedia.querySelector('[data-deferred-media-button]');
        if (deferredButton) {
          deferredButton.dispatchEvent(new Event('click'));
        }
      }
    }
  }

  /**
   * Slide to a specific media by its data-id attribute
   */
  window.theme.slideToMedia = function (mediaId) {
    var mainSwiper = window.theme.productGallerySwiper;
    if (!mainSwiper) return;

    var slides = mainSwiper.slides;
    for (var i = 0; i < slides.length; i++) {
      var slideDataId = slides[i].getAttribute('data-id');
      if (slideDataId && slideDataId == mediaId) {
        var realIndex = parseInt(slides[i].getAttribute('data-swiper-slide-index'), 10);
        if (!isNaN(realIndex)) {
          mainSwiper.slideToLoop(realIndex, 400);
        } else {
          mainSwiper.slideTo(i, 400);
        }
        return;
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initProductGallerySwiper();
    });
  } else {
    initProductGallerySwiper();
  }

  // Re-initialize on Shopify section events
  document.addEventListener('shopify:section:load', function () {
    setTimeout(initProductGallerySwiper, 200);
  });

  window.theme.initProductGallerySwiper = initProductGallerySwiper;
})();
