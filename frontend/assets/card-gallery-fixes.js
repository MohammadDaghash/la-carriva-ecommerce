// card-gallery-fixes.js
// Goals:
//  A) Arrows-only navigation (disable swipe/drag gestures in card galleries)
//  B) Reset previous card to its cover when a new card is entered (mobile + desktop)
//  C) Re-enable inner gallery arrows when the section itself is a carousel

(function () {
  // -------- helpers --------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function goToFirstSlide(gal) {
    if (!gal) return false;

    // A) Click the first dot if present
    const firstDot = gal.querySelector('.slideshow-dots button, .slideshow-dot, [data-slide-dot], [aria-label="Go to slide 1"]');
    if (firstDot && typeof firstDot.click === 'function') firstDot.click();

    // B) Theme API goTo(0) if available
    const api = gal.querySelector('slideshow-container,[data-slideshow],.slideshow,[ref="slideshow"]');
    if (api && typeof api.goTo === 'function') api.goTo(0);

    // C) Reset scroll/transform on the track
    const track = gal.querySelector('.slideshow-track,[data-slideshow-track],.slides,.lc-card__track,.swiper-wrapper');
    if (track) {
      if (typeof track.scrollTo === 'function') track.scrollTo({ left: 0, behavior: 'instant' });
      if (typeof track.scroll === 'function')   track.scroll({ left: 0,  behavior: 'instant' });
      if (track.style) track.style.transform = 'translate3d(0,0,0)';
    }

    // D) Normalize slide state WITHOUT touching display (keeps drag logic intact if ever needed)
    const slides = gal.querySelectorAll('.slideshow-slide, slideshow-slide');
    if (slides.length) {
      slides.forEach((s, i) => {
        s.removeAttribute('hidden');
        s.removeAttribute('inert');
        s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
        s.classList.toggle('is-active', i === 0);
        s.style.removeProperty('display'); // ensure no inline display:none remains
        s.querySelectorAll('[hidden]').forEach(el => el.removeAttribute('hidden'));
      });
    }

    return true;
  }

  // Re-enable inner galleries & arrows when nested in outer carousels
  function enableInnerGalleries(ctx = document) {
    [
      '.card-gallery slideshow-container[disabled]',
      '.card-gallery [data-slideshow][disabled]',
      '.card-gallery slideshow[disabled]',
      '.card-gallery .slideshow[disabled]',
      '.card-gallery [ref="slideshow"][disabled]',
    ].forEach(sel => {
      ctx.querySelectorAll(sel).forEach(el => el.removeAttribute('disabled'));
    });

    ctx.querySelectorAll(
      '.card-gallery [data-slideshow][inert], .card-gallery slideshow-container[inert], .card-gallery [ref="slideshow"][inert]'
    ).forEach(el => el.removeAttribute('inert'));

    ctx.querySelectorAll(
      '.card-gallery [aria-disabled="true"]'
    ).forEach(el => el.removeAttribute('aria-disabled'));

    // Arrow wrapper visible
    ctx.querySelectorAll('.card-gallery .slideshow-arrows').forEach(el => {
      el.style.display = '';
      el.removeAttribute('hidden');
      el.classList.remove('is-hidden');
    });

    // If section is a carousel, explicitly re-enable inner slideshows
    ctx.querySelectorAll(
      '.resource-list-carousel, .product-list--carousel, [aria-roledescription="carousel"], [data-carousel]'
    ).forEach(shell => {
      shell.querySelectorAll('slideshow-container, slideshow, [data-slideshow], .slideshow, [ref="slideshow"]').forEach(el => {
        try { if ('disabled' in el) el.disabled = false; } catch (e) {}
        el.removeAttribute('disabled');
        el.removeAttribute('inert');
        el.removeAttribute('aria-disabled');
      });
    });
  }

  // Disable swipe/drag in galleries; keep vertical scroll and clicks working
  function disableSwipeInGallery(gal) {
    if (!gal || gal.__lcNoSwipe) return;
    gal.__lcNoSwipe = true;

    const track = gal.querySelector(
      '.slideshow-track,[data-slideshow-track],.slides,.lc-card__track,.swiper-wrapper'
    );

    // Allow vertical scrolling; the browser will suppress horizontal panning
    if (track && track.style) {
      track.style.touchAction = 'pan-y';     // <-- key: vertical only, no horizontal swipe
      track.style.userSelect = 'none';
      track.style.webkitUserSelect = 'none';
    }

    // Images shouldn’t start native drag
    gal.querySelectorAll('img').forEach(img => {
      img.setAttribute('draggable', 'false');
      img.style.webkitUserDrag = 'none';
    });

    // IMPORTANT: No preventDefault/stopPropagation on move anymore
  }


  function initNoSwipe(scope = document) {
    scope.querySelectorAll('.card-gallery').forEach(disableSwipeInGallery);
  }
  

  function resetCard(cardEl) {
    if (!cardEl) return;
    const gal = cardEl.querySelector('.card-gallery');
    if (gal) goToFirstSlide(gal);
  }


  // Reset all galleries except the one inside "scope" (delay avoids outer carousel race)
  function resetOthers(scope) {
    const currentCard = scope ? scope.closest('product-card, .product-card') : null;
    const doReset = () => {
      document.querySelectorAll('.card-gallery').forEach(gal => {
        if (currentCard && currentCard.contains(gal)) return;
        goToFirstSlide(gal);
      });
    };
    setTimeout(doReset, 40);
  }



  // Track which gallery is "active" so we can reset the previous one immediately
  let ACTIVE_GALLERY = null;

  function activateGallery(gal) {
    if (ACTIVE_GALLERY && ACTIVE_GALLERY !== gal) {
      goToFirstSlide(ACTIVE_GALLERY); // snap previous card to cover
    }
    ACTIVE_GALLERY = gal;
  }

  function deactivateGallery(gal) {
    if (!gal) return;
    goToFirstSlide(gal);
    if (ACTIVE_GALLERY === gal) ACTIVE_GALLERY = null;
  }

  // Add this new function with your other helpers
  function bindScrollReset() {
    if (window.__lcScrollBound) return;
    window.__lcScrollBound = true;

    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      if (!ACTIVE_GALLERY) return;
      
      // Clear any pending timeout
      clearTimeout(scrollTimeout);
      
      // Reset immediately when scroll starts
      if (ACTIVE_GALLERY) {
        const activeCard = ACTIVE_GALLERY.closest('product-card, .product-card');
        if (activeCard) {
          goToFirstSlide(ACTIVE_GALLERY);
          ACTIVE_GALLERY = null;
        }
      }
    }, { passive: true });

    // Also detect touch scrolling specifically
    let lastTouchY = 0;
    
    document.addEventListener('touchstart', (e) => {
      lastTouchY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!ACTIVE_GALLERY) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = Math.abs(currentY - lastTouchY);
      
      // If user moved vertically more than 10px, they're scrolling
      if (deltaY > 10) {
        const activeCard = ACTIVE_GALLERY.closest('product-card, .product-card');
        
        // Make sure the touch isn't inside the gallery arrows
        const isInsideGallery = e.target.closest('.card-gallery');
        
        if (activeCard && !isInsideGallery) {
          goToFirstSlide(ACTIVE_GALLERY);
          ACTIVE_GALLERY = null;
        }
      }
      
      lastTouchY = currentY;
    }, { passive: true });
  }

  // Add this new function to detect horizontal carousel swiping
  function bindHorizontalSwipeReset() {
    if (window.__lcHorizontalSwipeBound) return;
    window.__lcHorizontalSwipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!ACTIVE_GALLERY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);

      // If horizontal movement is greater than vertical (swiping left/right on carousel)
      if (deltaX > deltaY && deltaX > 30) {
        isHorizontalSwipe = true;
        
        // Check if we're swiping on the outer carousel, not inside a gallery
        const isInsideGallery = e.target.closest('.card-gallery');
        const isOnCarousel = e.target.closest('.product-list--carousel, .resource-list-carousel, [aria-roledescription="carousel"]');
        
        if (isOnCarousel && !isInsideGallery && ACTIVE_GALLERY) {
          goToFirstSlide(ACTIVE_GALLERY);
          ACTIVE_GALLERY = null;
        }
      }
    }, { passive: true });
  }

  // Detect horizontal scroll on carousels
  // Detect carousel slide changes via transform/position changes
  function bindHorizontalScrollReset() {
    if (window.__lcHorizontalScrollBound) return;
    window.__lcHorizontalScrollBound = true;

    // Watch for transform/style changes on carousel items
    const observer = new MutationObserver((mutations) => {
      if (!ACTIVE_GALLERY) return;

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || 
            mutation.attributeName === 'class' || 
            mutation.attributeName === 'aria-hidden')) {
          
          const target = mutation.target;
          
          // Check if this is a product card in a carousel that's being hidden/moved
          const card = target.closest('product-card, .product-card');
          const carousel = target.closest('.product-list--carousel, .resource-list-carousel, [aria-roledescription="carousel"]');
          
          if (card && carousel) {
            const gal = card.querySelector('.card-gallery');
            
            // If the active gallery is in this card that's moving
            if (gal && ACTIVE_GALLERY === gal) {
              goToFirstSlide(ACTIVE_GALLERY);
              ACTIVE_GALLERY = null;
            }
          }
        }
      });
    });

    // Observe all product cards in carousels
    setTimeout(() => {
      document.querySelectorAll('.product-list--carousel, .resource-list-carousel, [aria-roledescription="carousel"]').forEach(carousel => {
        carousel.querySelectorAll('product-card, .product-card').forEach(card => {
          observer.observe(card, {
            attributes: true,
            attributeFilter: ['style', 'class', 'aria-hidden']
          });
        });
      });
    }, 500);
  }

  // --- Observe cards; when a card leaves view, snap its gallery to the cover
  function observeCardsVisibility(root = document) {
    // Avoid rebinding multiple observers
    if (window.__lcCardIO) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        // If the card is mostly out of view, reset its gallery
        // (0.6 threshold keeps it stable while the user is still over the card)
        if (!entry.isIntersecting || entry.intersectionRatio < 0.4) {
          resetCard(card);
        }
      });
    }, {
      root: null,            // viewport
      rootMargin: '0px',
      threshold: [0, 0.4, 0.6, 1]
    });

    // Start observing every product card currently on the page
    document.querySelectorAll('product-card, .product-card').forEach(card => {
      io.observe(card);
    });

    // Keep a reference to detach if needed
    window.__lcCardIO = io;
  }


  // Watch featured/nested carousels; when a product-card becomes "hidden"/inactive,
  // reset its OWN inner gallery to the cover image.
  function observeOuterCarousels(root = document) {
    const shells = root.querySelectorAll(
      '.product-list--carousel, .resource-list-carousel, [aria-roledescription="carousel"], [data-carousel]'
    );
    if (!shells.length) return;

    shells.forEach((shell) => {
      shell.querySelectorAll('product-card, .product-card').forEach((card) => {
        // Only bind once per card
        if (card.__lcCardObs) return;
        card.__lcCardObs = true;

        // Reset this card's gallery to slide #1
        const resetThisCard = () => {
          const gal = card.querySelector('.card-gallery');
          if (gal && typeof goToFirstSlide === 'function') {
            goToFirstSlide(gal);
          }
        };

        const mo = new MutationObserver((mutList) => {
          for (const m of mutList) {
            if (m.type !== 'attributes') continue;
            const attr = m.attributeName;

            // Case 1: outer carousel toggles aria-hidden="true" on the slide
            if (attr === 'aria-hidden') {
              if (card.getAttribute('aria-hidden') === 'true') {
                // slight delay lets the outer slider finish its toggle
                setTimeout(resetThisCard, 30);
              }
            }
            // Case 2: "active/is-active" class removed by the outer carousel
            else if (attr === 'class') {
              const wasActive = m.oldValue && /(^|\s)(is-active|active)(\s|$)/.test(m.oldValue);
              const isActive  = /(^|\s)(is-active|active)(\s|$)/.test(card.className || '');
              if (wasActive && !isActive) {
                setTimeout(resetThisCard, 30);
              }
            }
          }
        });

        mo.observe(card, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['aria-hidden', 'class'],
        });
      });
    });
  }

  let __lcGuardBound = false;
  function bindGlobalResetGuard() {
    if (__lcGuardBound) return;
    __lcGuardBound = true;

    const enterEvents = ['pointerdown', 'touchstart', 'mousedown', 'click'];

    enterEvents.forEach(evt => {
      document.addEventListener(
        evt,
        (e) => {
          // Nothing to do if there isn't an active gallery
          if (!ACTIVE_GALLERY) return;

          const activeCard = ACTIVE_GALLERY.closest('product-card, .product-card');
          const targetCard = e.target.closest
            ? e.target.closest('product-card, .product-card')
            : null;

          // If the tap/click is outside the active card, snap the previous one to its cover
          if (activeCard && targetCard !== activeCard) {
            // Reset previous card immediately
            goToFirstSlide(ACTIVE_GALLERY);
            // We don't clear ACTIVE_GALLERY here—let the next card's own onEnter set it.
          }
        },
        { capture: true, passive: true } // capture so outer carousels can't block it
      );
    });
  }

  // -------- behaviors --------
  function bindBehaviors(ctx = document) {
    const cards = Array.from(ctx.querySelectorAll('product-card, .product-card'));

    cards.forEach((card) => {
      if (card.__lcBound) return;
      card.__lcBound = true;

      const gallery = card.querySelector('.card-gallery');

      const onEnter = () => { if (gallery) activateGallery(gallery); };
      const onLeave = () => { if (gallery) deactivateGallery(gallery); };

      // Desktop hover
      card.addEventListener('mouseenter', onEnter, { passive: true });
      card.addEventListener('mouseleave', onLeave,  { passive: true });

      // Mobile/touch + keyboard: enter on press/focus *and also on click*
      ['pointerdown','touchstart','focusin','mousedown','click'].forEach(evt => {
        card.addEventListener(evt, onEnter, { passive: true });
      });

      // Leave/end signals (a bit wider net for touch)
      ['pointerleave','touchend','touchcancel','blur','pointerup','mouseup'].forEach(evt => {
        card.addEventListener(evt, onLeave, { passive: true });
      });

      // Also bind to link wrapper if present (many themes wrap the media with a large <a>)
      const link = card.querySelector('.product-card__link, .product-card-link, a[href*="/products/"]');
      if (link && !link.__lcBound) {
        link.__lcBound = true;

        // Make activation happen even if the browser only fires a click
        ['mouseenter','pointerdown','touchstart','focusin','mousedown','click'].forEach(evt => {
          link.addEventListener(evt, onEnter, { passive: true });
        });

        ['mouseleave','pointerleave','touchend','touchcancel','blur','pointerup','mouseup'].forEach(evt => {
          link.addEventListener(evt, onLeave,  { passive: true });
        });
      }
    });

    // --- Reset a specific card's gallery (helper used by the observer)
    function resetCard(cardEl) {
      if (!cardEl) return;
      const gal = cardEl.querySelector('.card-gallery');
      if (gal) goToFirstSlide(gal);
    }


    // Global: whenever a new interaction starts anywhere else, reset the previous card
    (function bindGlobalCardEnterGuard() {
      if (window.__lcCardGuardBound) return;
      window.__lcCardGuardBound = true;

      const ENTER_EVENTS = ['pointerdown','touchstart','mousedown','click'];

      ENTER_EVENTS.forEach(evt => {
        document.addEventListener(evt, (e) => {
          if (!window.ACTIVE_GALLERY) return;

          const activeCard = ACTIVE_GALLERY.closest('product-card, .product-card');
          const targetCard = e.target.closest && e.target.closest('product-card, .product-card');

          // If you’re starting interaction on a different card, reset the old one now.
          if (activeCard && targetCard && targetCard !== activeCard) {
            setTimeout(() => resetCard(activeCard), 30);
          }

          // If you tapped completely outside cards, reset the active one too.
          if (activeCard && !targetCard) {
            setTimeout(() => resetCard(activeCard), 30);
            window.ACTIVE_GALLERY = null;
          }
        }, { capture: true, passive: true });
      });
    })();



    // ---- Global guard: when user starts interacting anywhere else, reset previous card ----
    let __lcGuardBound = false;
    function bindGlobalResetGuard() {
      if (__lcGuardBound) return;
      __lcGuardBound = true;

      const enterEvents = ['pointerdown', 'touchstart', 'mousedown', 'click'];

      enterEvents.forEach(evt => {
        document.addEventListener(
          evt,
          (e) => {
            // Nothing to do if there isn't an active gallery
            if (!ACTIVE_GALLERY) return;

            const activeCard = ACTIVE_GALLERY.closest('product-card, .product-card');
            const targetCard = e.target.closest
              ? e.target.closest('product-card, .product-card')
              : null;

            // If the tap/click is outside the active card, snap the previous one to its cover
            if (activeCard && targetCard !== activeCard) {
              // Reset previous card immediately
              goToFirstSlide(ACTIVE_GALLERY);
              // We don't clear ACTIVE_GALLERY here—let the next card's own onEnter set it.
            }
          },
          { capture: true, passive: true } // capture so outer carousels can't block it
        );
      });
    }



    // Safety net: init arrows-only + activation on each gallery
    Array.from(ctx.querySelectorAll('.card-gallery')).forEach((gal) => {
      if (!gal.__lcNoSwipe) disableSwipeInGallery(gal);
      if (gal.__lcBound) return;
      gal.__lcBound = true;

      // Enter also on click here
      ['mouseenter','pointerdown','touchstart','focusin','mousedown','click'].forEach(evt => {
        gal.addEventListener(evt, () => activateGallery(gal), { passive: true });
      });

      ['mouseleave','pointerleave','touchend','touchcancel','blur','pointerup','mouseup'].forEach(evt => {
        gal.addEventListener(evt, () => deactivateGallery(gal), { passive: true });
      });
    });

    observeCardsVisibility(ctx);
    observeOuterCarousels(ctx);
  }


  // Observe DOM changes (sections/carousels re-render)
  function observe() {
    const mo = new MutationObserver(() => {
      enableInnerGalleries(document);
      initNoSwipe(document);
      bindBehaviors(document);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    enableInnerGalleries(document);
    initNoSwipe(document);
    bindBehaviors(document);
    bindGlobalResetGuard();
    observeCardsVisibility(document); 
    observeOuterCarousels(document);
    bindHorizontalSwipeReset();
    bindHorizontalScrollReset();
    observe();
  }

  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('shopify:section:load', (e) => {
    enableInnerGalleries(e.target);
    initNoSwipe(e.target);
    bindBehaviors(e.target);
    bindGlobalResetGuard();
    observeCardsVisibility(e.target);
    observeOuterCarousels(e.target);
    bindHorizontalScrollReset();
  });

  document.addEventListener('shopify:section:select', (e) => {
    enableInnerGalleries(e.target);
    initNoSwipe(e.target);
    bindBehaviors(e.target);
    bindGlobalResetGuard();
    observeCardsVisibility(e.target);
    observeOuterCarousels(e.target);
    bindScrollReset();
  });

})();

// --- Mobile/Featured fixes: re-enable inner carousels and stop outer drag stealing gestures ---
function unblockInnerGalleriesInCarousels(root = document) {
  const shells = root.querySelectorAll(
    '.product-list--carousel, .resource-list-carousel, [aria-roledescription="carousel"], [data-carousel]'
  );

  shells.forEach(shell => {
    shell.querySelectorAll('.card-gallery').forEach(gal => {
      // 1) Make sure the inner slideshow isn't disabled
      gal.querySelectorAll('slideshow-container, [data-slideshow], .slideshow, [ref="slideshow"]').forEach(el => {
        try { if ('disabled' in el) el.disabled = false; } catch (e) {}
        el.removeAttribute('disabled');
        el.removeAttribute('inert');
        el.removeAttribute('aria-disabled');
      });

      // 2) Prevent the outer carousel from stealing the gesture
      ['touchstart','pointerdown','mousedown'].forEach(evt => {
        gal.addEventListener(evt, ev => { ev.stopPropagation(); }, { passive: true });
      });

      // 3) Also stop move + end/cancel so outer carousel can’t hijack mid-gesture
      ['touchmove','pointermove','mousemove','touchend','pointerup','mouseup','touchcancel','pointercancel']
        .forEach(evt => {
          gal.addEventListener(evt, ev => { ev.stopPropagation(); }, { passive: true });
        });
    });
  });
}

(function () {
  let ACTIVE_GALLERY = null;

  function activateGallery(gal) {
    // If there's already an active gallery and it's different from the new one
    if (ACTIVE_GALLERY && ACTIVE_GALLERY !== gal) {
      // Properly deactivate the old one first
      const oldSlideshowComponent = ACTIVE_GALLERY.querySelector('slideshow-component, [ref="slideshow"]');
      if (oldSlideshowComponent) {
        const oldSlides = oldSlideshowComponent.querySelectorAll('slideshow-slide');
        if (oldSlides.length > 0) {
          // Reset to first slide
          oldSlides.forEach((slide, index) => {
            if (index === 0) {
              slide.setAttribute('aria-hidden', 'false');
              slide.classList.add('is-active');
            } else {
              slide.setAttribute('aria-hidden', 'true');
              slide.classList.remove('is-active');
            }
          });
          
          // Reset scroll position
          const oldSlideshowSlides = oldSlideshowComponent.querySelector('slideshow-slides');
          if (oldSlideshowSlides) {
            oldSlideshowSlides.scrollTo({ left: 0, behavior: 'instant' });
          }
        }
        
        // Hide arrows on the old gallery
        const oldArrowsContainer = oldSlideshowComponent.querySelector('slideshow-arrows');
        if (oldArrowsContainer) {
          oldArrowsContainer.style.display = 'none';
        }
      }
      
      // Remove visual outline from old card
      const oldCard = ACTIVE_GALLERY.closest('product-card, .product-card');
      if (oldCard) oldCard.style.outline = '';
    }
    
    // Now set the new active gallery
    ACTIVE_GALLERY = gal;
    
    // Show arrows on the NEW active gallery
    const slideshowComponent = gal.querySelector('slideshow-component, [ref="slideshow"]');
    if (slideshowComponent) {
      const arrowsContainer = slideshowComponent.querySelector('slideshow-arrows');
      if (arrowsContainer) {
        arrowsContainer.style.display = '';
      }
    }
  }

  function deactivateGallery(gal) {
    ACTIVE_GALLERY = null;
    
    // Remove visual feedback
    const card = gal.closest('product-card, .product-card');
    if (card) card.style.outline = '';
    
    // Reset to first slide - UPDATED for your theme structure
    const slideshowComponent = gal.querySelector('slideshow-component, [ref="slideshow"]');
    
    if (slideshowComponent) {
      
      const slides = slideshowComponent.querySelectorAll('slideshow-slide');
      if (slides.length > 0) {
        
        slides.forEach((slide, index) => {
          if (index === 0) {
            slide.setAttribute('aria-hidden', 'false');
            slide.classList.add('is-active');
          } else {
            slide.setAttribute('aria-hidden', 'true');
            slide.classList.remove('is-active');
          }
        });
        
        // HIDE THE ARROWS after deactivating
        const arrowsContainer = slideshowComponent.querySelector('slideshow-arrows');
        if (arrowsContainer) {
          arrowsContainer.style.display = 'none !important';
        }

        // Reset the container scroll position
        const slideshowSlides = slideshowComponent.querySelector('slideshow-slides');
        if (slideshowSlides) {
          slideshowSlides.scrollTo({ left: 0, behavior: 'instant' });
        }

      }

    }
  }

  // Expose globally
  window.ACTIVE_GALLERY_DEBUG = () => ACTIVE_GALLERY;

  function init() {
    document.querySelectorAll('.card-gallery').forEach(gal => {
      
      // Test on click
      gal.addEventListener('click', () => {
        activateGallery(gal);
      }, { passive: true });
      
      // Test on arrow click specifically
      gal.querySelectorAll('[data-slide-arrow], .slideshow-arrow, button[aria-label*="slide"]').forEach(arrow => {
        arrow.addEventListener('click', (e) => {
          activateGallery(gal);
          // e.stopPropagation();
        }, { passive: false });
      });
    });
    
    // ===== SCROLL DETECTION =====
    let lastScrollY = window.scrollY;
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // If user scrolled more than 5px and there's an active gallery
      if (scrollDelta > 5 && ACTIVE_GALLERY) {
        deactivateGallery(ACTIVE_GALLERY);
      }
      
      lastScrollY = currentScrollY;
    }, { passive: true });
    
    // ===== TOUCH SCROLL DETECTION (for mobile) =====
    let touchStartY = 0;
    let touchStartX = 0;
    let isTouchingGallery = false;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      
      // Check if touch is inside a gallery
      isTouchingGallery = e.target.closest('.card-gallery') !== null;
      
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!ACTIVE_GALLERY) return;
      
      const touchCurrentY = e.touches[0].clientY;
      const touchCurrentX = e.touches[0].clientX;
      const deltaY = Math.abs(touchCurrentY - touchStartY);
      const deltaX = Math.abs(touchCurrentX - touchStartX);
      
      // If vertical movement is greater than horizontal (scrolling down/up)
      // AND the touch didn't start inside the gallery (or moved outside)
      if (deltaY > 1 ) {
        deactivateGallery(ACTIVE_GALLERY);
        isTouchingGallery = false;
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {;
      isTouchingGallery = false;
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();