/**
 * Theme Switch Fix - Sync data-theme attribute with classList
 * This fixes the issue where switching themes doesn't update all CSS styles
 */
(function() {
    // Initial sync - fix data-theme on first load before observers register
    function syncTheme() {
        const html = document.documentElement;
        const body = document.body;
        const isDark = html.classList.contains('dark') || 
              (body && body.classList.contains('dark-mode'));
        
        html.setAttribute('data-theme', isDark ? 'dark' : 'light');
        html.style.colorScheme = isDark ? 'dark' : 'light';
    }

    // Sync immediately on script load
    syncTheme();

    // Use MutationObserver to watch for class changes on html element
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const html = document.documentElement;
                const isDark = html.classList.contains('dark');
                
                // Sync data-theme attribute
                html.setAttribute('data-theme', isDark ? 'dark' : 'light');
                
                // Also sync color-scheme for system UI
                html.style.colorScheme = isDark ? 'dark' : 'light';
            }
        });
    });

    // Start observing
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    // Also watch body for dark-mode class changes
    if (document.body) {
        observeBody();
    } else {
        document.addEventListener('DOMContentLoaded', observeBody);
    }

    function observeBody() {
        const bodyObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const body = document.body;
                    const html = document.documentElement;
                    const isDark = body.classList.contains('dark-mode');
                    
                    // Ensure html class is in sync
                    if (isDark && !html.classList.contains('dark')) {
                        html.classList.add('dark');
                        html.classList.remove('light');
                    } else if (!isDark && html.classList.contains('dark')) {
                        html.classList.remove('dark');
                        html.classList.add('light');
                    }
                    
                    // Sync data-theme
                    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
                }
            });
        });

        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
})();
