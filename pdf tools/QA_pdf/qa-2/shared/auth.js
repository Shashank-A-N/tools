/**
 * ShadowTools Global Authentication Module
 * Handles user registration, login, logout, and session persistence via localStorage.
 * Include this script on any page that needs auth awareness.
 */
const ShadowAuth = (() => {
    const STORAGE_KEY = 'shadowtools_users';
    const SESSION_KEY = 'shadowtools_session';

    // --- Core Data Access ---
    function _getUsers() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (e) { return []; }
    }
    function _saveUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
    function _setSession(user) {
        const session = { email: user.email, name: user.name, avatar: user.avatar || '', loggedInAt: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    function _clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    // --- Public API ---
    function register(name, email, password) {
        if (!name || !email || !password) return { ok: false, msg: 'All fields are required.' };
        if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
        const users = _getUsers();
        if (users.find(u => u.email === email)) return { ok: false, msg: 'An account with this email already exists.' };
        const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=8b5cf6`;
        const newUser = { name, email, password: btoa(password), avatar, createdAt: Date.now() };
        users.push(newUser);
        _saveUsers(users);
        _setSession(newUser);
        return { ok: true, user: getCurrentUser() };
    }

    function login(email, password) {
        if (!email || !password) return { ok: false, msg: 'Email and password are required.' };
        const users = _getUsers();
        const user = users.find(u => u.email === email);
        if (!user) return { ok: false, msg: 'No account found with this email.' };
        if (atob(user.password) !== password) return { ok: false, msg: 'Incorrect password.' };
        _setSession(user);
        return { ok: true, user: getCurrentUser() };
    }

    function logout() {
        _clearSession();
    }

    function getCurrentUser() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch (e) { return null; }
    }

    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    return { register, login, logout, getCurrentUser, isLoggedIn };
})();


/**
 * ShadowAuth UI Helpers
 * Auto-injects a user avatar/button into the page header if a specific container exists.
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('shadow-auth-ui');
    if (!container) return;

    function render() {
        const user = ShadowAuth.getCurrentUser();
        if (user) {
            container.innerHTML = `
                <div class="shadow-auth-profile">
                    <img src="${user.avatar}" alt="${user.name}" class="shadow-auth-avatar" title="${user.name} (${user.email})">
                    <span class="shadow-auth-name">${user.name.split(' ')[0]}</span>
                    <button id="shadow-auth-logout" class="shadow-auth-logout-btn" title="Logout">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            `;
            document.getElementById('shadow-auth-logout').addEventListener('click', () => {
                ShadowAuth.logout();
                render();
                // Optionally reload or redirect
                if (typeof onShadowAuthChange === 'function') onShadowAuthChange(null);
            });
        } else {
            container.innerHTML = `
                <a href="/index.html#auth" class="shadow-auth-login-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <span>Login</span>
                </a>
            `;
        }
    }

    render();
    // Re-render on storage change (e.g., login from another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'shadowtools_session') render();
    });
});
