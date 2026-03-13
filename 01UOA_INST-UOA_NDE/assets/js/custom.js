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
    // =========================================================================
    function injectBanner() {
        const header = document.querySelector('nde-header');

        if (!header || header.querySelector('.ual-top-banner')) return;

        header.innerHTML = `
            <div class="ual-top-banner">
                <div class="padding-right-left-big">
                    <a href="https://ualberta.ca">
                        <img src="https://www.ualberta.ca/_assets/images/ua-logo-reversed-white.svg" alt="University of Alberta">
                    </a>
                    <a href="https://library.ualberta.ca" class="ual-library-tag">Library</a>
                </div>
            </div>
        `;
    }
 
    const bannerObserver = new MutationObserver(() => {
        const header = document.querySelector('nde-header');
        if (header && !header.querySelector('.ual-top-banner')) {
            injectBanner();
        }
    });
 
    // Watch the full document tree for Angular rendering nde-header
    bannerObserver.observe(document.body, { childList: true, subtree: true });
 
 
    // =========================================================================
    // LIBCHAT WIDGET
    // Dynamically loads the LibAnswers live chat widget by appending a div
    // anchor and a script tag to the page body.
    // =========================================================================
    (() => {
        const libchatHash = 'baadd67c0b9382719dabca82069083e2e6b6d873103a32cc235ec09ad41f22a5';
        const host = 'ualberta.libanswers.com';
 
        // Create the div anchor the LibChat script will attach to
        const div = document.createElement('div');
        div.id = `libchat_${libchatHash}`;
        document.body.appendChild(div);
 
        // Load the LibChat script
        const scr = document.createElement('script');
        scr.src = `https://${host}/load_chat.php?hash=${libchatHash}`;
        document.body.appendChild(scr);
    })();
 
 
    // =========================================================================
    // RECORD LINKS FILTER
    // On full record pages, hides any links in the #links container that are
    // not in the allowedTexts list. Displays a fallback message if no
    // permitted links are found.
    // =========================================================================
    const allowedTexts = [
        "Display Source Record",
        "Theses and Dissertations subject guide",
        "Inventory list of the Ivo Andrić archives, Accession 96-165",
        "Guide thématique sur les thèses et mémoires",
        "Afficher la notice de la source"
    ];
 
    const filterLinks = () => {
        const linksContainer = document.querySelector("#links");
        if (!linksContainer) return;
 
        const links = linksContainer.querySelectorAll("a");
        let visibleCount = 0;
 
        links.forEach(link => {
            // Use the inner span text if present, otherwise fall back to link text
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
        if (visibleCount === 0) {
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
 
    // Poll briefly after DOM changes to catch links rendered slightly after
    // the mutation fires (Angular may render children in multiple passes)
    const waitForLinks = () => {
        filterLinks();
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            filterLinks();
            const hasLinks = document.querySelector("#links a");
            if (hasLinks || attempts >= 10) {
                clearInterval(interval);
            }
        }, 300);
    };
 
    // Re-run the filter whenever the DOM changes (e.g. navigating to a new record)
    const linksObserver = new MutationObserver(waitForLinks);
    linksObserver.observe(document.body, { childList: true, subtree: true });
 
    // Run immediately in case the links are already present on page load
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