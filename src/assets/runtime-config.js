// Runtime-configurable globals for the frontend.
// Set these values per environment (e.g., in CI/CD or hosting) without rebuilding the app.
// Example:
//   window.NG_API_DNS = 'https://api.mycompany.com';
//   window.NG_LOGIN_URL = 'https://api.mycompany.com/auth/login';

(function () {
  // If you don't set a value here, the app will use its internal defaults.
  // IncidentService falls back to 'http://localhost:8081' when NG_API_DNS is not provided.
  window.NG_API_DNS = 'http://localhost:8081' // window.NG_API_DNS || '';
  window.NG_GOOGLE_CLIENT_ID = '585748395907-a7vn1014fncm3mgnra5gmtoo04rf01d5.apps.googleusercontent.com';
  window.NG_LOGIN_URL = 'http://localhost:8081/auth/login';
})();
