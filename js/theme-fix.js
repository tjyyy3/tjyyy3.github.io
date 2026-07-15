/**
 * Keep the custom CSS contract aligned with Redefine's theme state.
 *
 * Redefine does not expose a dedicated theme-change event in the local theme
 * assets. The reliable signals available to custom scripts are the theme
 * classes it mutates (`html.dark|light`, `body.dark-mode|light-mode`) plus the
 * `REDEFINE-THEME-STATUS` localStorage entry it writes. We therefore keep a
 * single observer-based sync path that derives the active theme from whichever
 * class changed, then normalizes html/body classes, `data-theme`, and
 * `color-scheme` together.
 */
(function () {
    const html = document.documentElement;
    const darkTheme = 'dark';
    const lightTheme = 'light';
    const themeStorageKey = 'REDEFINE-THEME-STATUS';
    let isApplyingTheme = false;

    function readStoredTheme() {
        try {
            const storedTheme = localStorage.getItem(themeStorageKey);
            if (!storedTheme) {
                return null;
            }

            const parsedTheme = JSON.parse(storedTheme);
            if (typeof parsedTheme?.isDark !== 'boolean') {
                return null;
            }

            return parsedTheme.isDark ? darkTheme : lightTheme;
        } catch (error) {
            return null;
        }
    }

    function getSystemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? darkTheme
            : lightTheme;
    }

    function getThemeFromHtmlClass() {
        return html.classList.contains(darkTheme) ? darkTheme : lightTheme;
    }

    function getThemeFromBodyClass() {
        const body = document.body;
        if (!body) {
            return null;
        }

        return body.classList.contains('dark-mode') ? darkTheme : lightTheme;
    }

    function getThemeFromMutations(mutations) {
        const body = document.body;
        const bodyChanged = body
            ? mutations.some(function (mutation) {
                return mutation.target === body && mutation.attributeName === 'class';
            })
            : false;
        const htmlChanged = mutations.some(function (mutation) {
            return mutation.target === html && mutation.attributeName === 'class';
        });

        if (bodyChanged && !htmlChanged) {
            return getThemeFromBodyClass();
        }

        if (htmlChanged && !bodyChanged) {
            return getThemeFromHtmlClass();
        }

        if (bodyChanged && htmlChanged) {
            return getThemeFromBodyClass() || getThemeFromHtmlClass();
        }

        return null;
    }

    function resolveTheme(mutations) {
        return getThemeFromMutations(mutations || [])
            || readStoredTheme()
            || getThemeFromBodyClass()
            || getThemeFromHtmlClass()
            || getSystemTheme();
    }

    function applyTheme(themeName) {
        const body = document.body;

        isApplyingTheme = true;

        try {
            const isDark = themeName === darkTheme;

            html.classList.toggle(darkTheme, isDark);
            html.classList.toggle(lightTheme, !isDark);

            if (body) {
                body.classList.toggle('dark-mode', isDark);
                body.classList.toggle('light-mode', !isDark);
            }

            if (html.getAttribute('data-theme') !== themeName) {
                html.setAttribute('data-theme', themeName);
            }

            if (html.style.colorScheme !== themeName) {
                html.style.colorScheme = themeName;
            }
        } finally {
            isApplyingTheme = false;
        }
    }

    function syncTheme(mutations) {
        applyTheme(resolveTheme(mutations));
    }

    syncTheme();

    if (!document.body) {
        document.addEventListener('DOMContentLoaded', function handleReady() {
            syncTheme();
        }, { once: true });
    }

    const observer = new MutationObserver(function (mutations) {
        if (isApplyingTheme) {
            return;
        }

        if (!mutations.some(function (mutation) {
            return mutation.attributeName === 'class';
        })) {
            return;
        }

        syncTheme(mutations);
    });

    observer.observe(html, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
})();
