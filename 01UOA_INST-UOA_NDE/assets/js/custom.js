(function () {
    "use strict";

    // =========================================================================
    // ANGULAR INITIALIZATION
    // Waits for Angular to be available before registering the custom module.
    // Retries every 50ms to avoid errors during slow page loads.
    // =========================================================================
    function initAngular() {
        if (typeof angular === 'undefined') {
            setTimeout(initAngular, 50);
            return;
        }
        var app = angular.module('viewCustom', ['angularLoad']);
    }
    initAngular();


    // =========================================================================
    // UAL TOP BANNER INJECTION
    // Injects the University of Alberta top banner into the nde-header element.
    // Uses a MutationObserver to handle Angular's async rendering — the banner
    // is injected as soon as nde-header appears in the DOM, and the guard
    // (.ual-top-banner check) prevents duplicate injection on re-renders.
    // Prepends the banner div rather than replacing innerHTML, so Primo's own
    // header content (including translated text) is left intact on language
    // switches.
    // =========================================================================
    function injectBanner() {
        const header = document.querySelector('nde-header');
        if (!header || header.querySelector('.ual-top-banner')) return;

        const banner = document.createElement('div');
        banner.className = 'ual-top-banner';
        banner.innerHTML = `
            <div class="ual-inner">
                <a href="https://ualberta.ca">
                    <img src="https://www.ualberta.ca/_assets/images/ua-logo-reversed-white.svg" alt="University of Alberta">
                </a>
                <a href="https://library.ualberta.ca" class="ual-library-tag">Library</a>
            </div>
        `;
        header.prepend(banner);
    }

    const bannerObserver = new MutationObserver(() => {
        const header = document.querySelector('nde-header');
        if (header && !header.querySelector('.ual-top-banner')) {
            injectBanner();
        }
    });

    bannerObserver.observe(document.body, { childList: true, subtree: true });


    // =========================================================================
    // LIBCHAT WIDGET
    // Dynamically loads the LibAnswers live chat widget by appending a div
    // anchor and a script tag to the page body. Once the widget renders,
    // swaps the button image to a mobile-appropriate version on narrow
    // viewports and keeps it in sync if the viewport is resized.
    //
    // A CSS rule is injected early to cap the image width and prevent the
    // unscaled 2x PNG from causing horizontal overflow before JS runs.
    // The chatObserver stays connected (does not disconnect) to handle cases
    // where the widget re-renders the img element on mobile. A second observer
    // watches the src attribute for resets by the LibChat script itself.
    // =========================================================================
    (() => {
        const libchatHash = 'baadd67c0b9382719dabca82069083e2e6b6d873103a32cc235ec09ad41f22a5';
        const host = 'ualberta.libanswers.com';
        const desktopImg = 'https://sites.library.ualberta.ca/wp-content/uploads/2026/05/chat-button-desktop.png';
        const mobileImg  = 'https://sites.library.ualberta.ca/wp-content/uploads/2026/05/chat-button-mobile.png';
        const mq = window.matchMedia('(max-width: 768px)');

        // Inject early to prevent overflow before JS swap runs
        const chatStyle = document.createElement('style');
        chatStyle.textContent = '.s-lch-widget-float-btn img { max-width: 100vw; box-sizing: border-box; }';
        document.head.appendChild(chatStyle);

        const swapChatImg = (img) => {
            if (mq.matches) {
                img.src = mobileImg;
                img.style.setProperty('width',     '54px', 'important');
                img.style.setProperty('height',    '54px', 'important');
                img.style.setProperty('max-width', '54px', 'important');
            } else {
                img.src = desktopImg;
                img.style.removeProperty('width');
                img.style.removeProperty('height');
                img.style.removeProperty('max-width');
            }
        };

        // Create the div anchor the LibChat script will attach to
        const div = document.createElement('div');
        div.id = `libchat_${libchatHash}`;
        document.body.appendChild(div);

        // Load the LibChat script
        const scr = document.createElement('script');
        scr.src = `https://${host}/load_chat.php?hash=${libchatHash}`;
        document.body.appendChild(scr);

        let imgObserver = null;
        const chatObserver = new MutationObserver(() => {
            const img = document.querySelector('.s-lch-widget-float-btn img');
            if (!img) return;
            swapChatImg(img);

            // Set up src-attribute watcher and resize listener once only
            if (!imgObserver) {
                mq.addEventListener('change', () => swapChatImg(img));
                imgObserver = new MutationObserver(() => {
                    const expected = mq.matches ? mobileImg : desktopImg;
                    if (img.getAttribute('src') !== expected) swapChatImg(img);
                });
                imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
            }
        });

        chatObserver.observe(document.body, { childList: true, subtree: true });
    })();


    // =========================================================================
    // RECORD LINKS FILTER
    // On full record pages, hides any links in the NDE links container that are
    // not in the allowedTexts list. Displays a fallback message if no
    // permitted links are found.
    // =========================================================================
    const allowedTexts = [
        "Display Source Record",
        "Theses and Dissertations subject guide",
        "Inventory list of the Ivo Andrić archives, Accession 96-165",
        "Guide thématique sur les thèses et mémoires",
        "Afficher la notice de la source",
        "Orientation guide"
    ];

    const filterLinks = () => {
        const linksContainer = document.querySelector('[data-qa="full_display_links_online_links"]');
        if (!linksContainer) return;

        const links = linksContainer.querySelectorAll("a");
        let visibleCount = 0;

        links.forEach(link => {
            // Use the inner span text if present, otherwise fall back to full link text
            // (mat-icon contains only SVG, so textContent is safe to use directly)
            const span = link.querySelector("span");
            const text = span ? span.textContent.trim() : link.textContent.trim();

            if (allowedTexts.includes(text)) {
                link.style.display = "";
                visibleCount++;
            } else {
                link.style.display = "none";
            }
        });

        // Show or remove the fallback message depending on visible link count
        const existingMessage = document.querySelector("#no-links-message");
        if (links.length > 0 && visibleCount === 0) {
            if (!existingMessage) {
                const message = document.createElement("p");
                message.id = "no-links-message";
                message.textContent = "No links are available for this record.";
                message.style.marginTop = "1em";
                linksContainer.appendChild(message);
            }
        } else {
            if (existingMessage) existingMessage.remove();
        }
    };

    const waitForLinks = () => {
        filterLinks();
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            filterLinks();
            const hasLinks = document.querySelector('[data-qa="full_display_links_online_links"] a');
            if (hasLinks || attempts >= 10) {
                clearInterval(interval);
            }
        }, 300);
    };

    const linksObserver = new MutationObserver(waitForLinks);
    linksObserver.observe(document.body, { childList: true, subtree: true });

    waitForLinks();


    // =========================================================================
    // SIGN-IN SNACKBAR REPOSITION
    // Moves the Angular Material snackbar that appears after sign-in from the
    // default bottom-left position to the top-right corner of the viewport.
    // =========================================================================
    const signInObserver = new MutationObserver(() => {
        const panes = document.querySelectorAll('.cdk-overlay-container .cdk-overlay-pane');
        panes.forEach(pane => {
            if (pane.querySelector('mat-snack-bar-container')) {
                pane.style.setProperty('position', 'fixed', 'important');
                pane.style.setProperty('top', '20px', 'important');
                pane.style.setProperty('right', '20px', 'important');
                pane.style.removeProperty('bottom');
                pane.style.removeProperty('left');
            }
        });
    });

    signInObserver.observe(document.body, { childList: true, subtree: true });

})();


// =============================================================================
// GOOGLE TAG MANAGER
// Loads the GTM script asynchronously and appends a noscript fallback iframe
// once the DOM is ready. Kept outside the main IIFE as GTM expects global
// access to window.dataLayer.
// =============================================================================
(function(w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l !== 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-MX43PRW2');

// Append the GTM noscript fallback for environments where JS is disabled
document.addEventListener('DOMContentLoaded', function () {
    var noscript = document.createElement('noscript');
    noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MX43PRW2" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(noscript, document.body.firstChild);
});