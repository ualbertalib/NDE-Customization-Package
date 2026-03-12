(function () {
    "use strict";
    function initAngular() {
        if (typeof angular === 'undefined') {
            setTimeout(initAngular, 50);
            return;
        }
        var app = angular.module('viewCustom', ['angularLoad']);
    }
    initAngular();
    // Load LibChat
    (() => {
        const libchatHash = 'baadd67c0b9382719dabca82069083e2e6b6d873103a32cc235ec09ad41f22a5';
        const host = 'ualberta.libanswers.com';
        const div = document.createElement('div');
        div.id = `libchat_${libchatHash}`;
        document.body.appendChild(div);
        const scr = document.createElement('script');
        scr.src = `https://${host}/load_chat.php?hash=${libchatHash}`;
        document.body.appendChild(scr);
    })();
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
            const span = link.querySelector("span");
            const text = span ? span.textContent.trim() : link.textContent.trim();
            if (allowedTexts.includes(text)) {
                link.style.display = "";
                visibleCount++;
            } else {
                link.style.display = "none";
            }
        });
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
            if (existingMessage) {
                existingMessage.remove();
            }
        }
    };
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
    const observer = new MutationObserver(waitForLinks);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    waitForLinks();

    // Reposition sign-in snackbar to top-right
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
// Google Tag Manager
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
document.addEventListener('DOMContentLoaded', function () {
    var noscript = document.createElement('noscript');
    noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MX43PRW2" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(noscript, document.body.firstChild);
});