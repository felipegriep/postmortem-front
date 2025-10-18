// Runtime-configurable globals for the frontend.
// Set these values per environment (e.g., in CI/CD or hosting) without rebuilding the app.
// Example:
//   window.NG_API_DNS = 'https://api.mycompany.com';
//   window.NG_LOGIN_URL = 'https://api.mycompany.com/auth/login';

(function () {
    // Default values; these will be overwritten if environment.json or global vars are provided
    var defaults = {
        NG_API_DNS: 'http://localhost:8081',
        NG_GOOGLE_CLIENT_ID: '585748395907-a7vn1014fncm3mgnra5gmtoo04rf01d5.apps.googleusercontent.com',
        NG_LOGIN_URL: 'http://localhost:8081/auth/login'
    };

    function applyConfig(obj) {
        try {
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                try {
                    // Only set if value is defined and non-empty
                    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
                        window[k] = obj[k];
                    }
                } catch (e) {
                    // ignore individual assignment failures
                }
            }
        } catch (e) {
            // ignore
        }
    }

    // First apply defaults
    applyConfig(defaults);

    // Then apply any globals that may have been set by deployment (already present on window)
    try {
        if (window.NG_API_DNS) defaults.NG_API_DNS = window.NG_API_DNS;
        if (window.NG_GOOGLE_CLIENT_ID) defaults.NG_GOOGLE_CLIENT_ID = window.NG_GOOGLE_CLIENT_ID;
        if (window.NG_LOGIN_URL) defaults.NG_LOGIN_URL = window.NG_LOGIN_URL;
    } catch (e) {
        // ignore
    }

    // Attempt to fetch an environment.json file in assets. This allows hosting to drop a static JSON
    // next to other assets without a full rebuild. If it exists, merge and apply it.
    try {
        var req = new XMLHttpRequest();
        req.open('GET', '/assets/environment.json', false); // synchronous by default to ensure values are ready before app boot
        req.send(null);
        if (req.status >= 200 && req.status < 300 && req.responseText) {
            try {
                var parsed = JSON.parse(req.responseText);
                if (parsed && typeof parsed === 'object') {
                    // Merge parsed over defaults
                    for (var p in parsed) {
                        if (parsed.hasOwnProperty(p) && parsed[p] !== undefined && parsed[p] !== null) {
                            defaults[p] = parsed[p];
                        }
                    }
                    applyConfig(parsed);
                }
            } catch (e) {
                // invalid JSON - ignore and continue with defaults
                console.warn('assets/environment.json exists but could not be parsed', e);
            }
        }
    } catch (e) {
        // If fetching fails (file not present), ignore and continue using defaults
    }

    // Re-assign resulting defaults onto window to ensure consumers see them
    applyConfig(defaults);

    // Expose a helper for other scripts to read the resulting config object
    try {
        window.NG__CONFIG = defaults;
    } catch (e) {
    }
})();
