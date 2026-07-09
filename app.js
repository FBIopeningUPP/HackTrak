const Store = {
    currentRoute: window.location.hash || '#dashboard',
    data: {
        settings: {
            exchangeRate: 95.0,
            stipendRate: 8.5,
            ticketHours: 35,
        },
        goals: [],
        projects: [],
        hours: [],
        submissions: [],
    },
    listeners: [],

    init() {
        const saved = localStorage.getItem('hacktrak_db');
        if (saved) {
            this.data = {...this.data, ...JSON.parse(saved)};
        }
        window.addEventListener('hashchange', () => {
            this.currentRoute = window.location.hash || '#dashboard';
            this.notify();
        });
    },

    save() {
        localStorage.setItem('hacktrak_db', JSON.stringify(this.data));
        this.notify();
    },

    saveSilent() {
        localStorage.setItem('hacktrak_db', JSON.stringify(this.data));
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach((listener) => listener());
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    helpers: {
        formatDate(dateString) {
            if (!dateString) return '';
            const options = { weekday: 'short', month: 'short', day: 'numeric'};
            return new Date(dateString).toLocaleDateString(undefined, options);
        },

        getProjectTotalHours(projectId) {
            return Store.data.hours
                .filter(h => h.projectId === projectId)
                .reduce((sum, h) => sum + parseFloat(h.amount), 0);
        },

        getTotalApprovedHours() {
            return Store.data.submissions
                .filter(s => s.status === 'approved')
                .reduce((sum, s) => sum + parseFloat(s.totalHours), 0);
        }
    }
};

const Views = {
    Dashboard() {
        return `
            <h2 class="view-title">Command Center</h2>
            <div style="background: var(--tertiary); padding: 3rem;" class="neu-border neu-shadow">
                <h3 style="color: white; font-size: 2rem; text-transform: uppercase; font-weight: 900;">Welcome to HackTrak</h3>
                <p style="color: white; font-weight: bold; margin-top: 1rem; font-size: 1.2rem;">The Waterfall Math Engine will be rendered here soon.</p>
            </div>
        `;
    },

    Settings() {
        const goalsList = Store.data.goals.length === 0
            ? `<p style="font-weight: bold;">No custom goals set yet.</p>`
            : Store.data.goals.map(g => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--white); margin-bottom: 1rem;" class="neu-border neu-shadow">
                        <span style="font-weight: 900; font-size: 1.2rem;">${g.name}</span>
                        <span style="font-weight: 900; font-size: 1.2rem;">$${g.costUsd.toFixed(2)}</span>
                        <button data-delete-goal="${g.id}" style="background: var(--secondary); padding: 0.5rem 1rem; font-weight: bold; cursor: pointer;" class="neu- border neu-shadow">REMOVE</button>
                </div>
            `).join('');

        return `
            <h2 class="view-title">System Settings</h2>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; align-items: start;">

                <!-- GLOBAL RATES -->
                <div style="background: var(--primary); padding: 2rem;" class="neu-border neu-shadow">
                    <h3 style="margin-bottom: 1.5rem; text-transform: uppercase; font-weight: 900;">Global Rates</h3>
                    <form id="settings-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Exchange Rate (INR/USD)</label>
                            <input name="exchangeRate" type="number" step="0.01" value="${Store.data.settings.exchangeRate}" class="neu-border" style="padding: 1rem; font-size: 1.2rem; outline: none;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Stipend Rate (USD/Hr)</label>
                            <input name="stipendRate" type="number" step="0.01" value="${Store.data.settings.stipendRate}" class="neu-border" style="padding: 1rem; font-size: 1.2rem; outline: none;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Ticket Goal (Hours)</label>
                            <input name="ticketHours" type="number" value="${Store.data.settings.ticketHours}" class="neu-border" style="padding: 1rem; font-size: 1.2rem; outline: none;">
                        </div>
                    </form>
                </div>

                <!-- CUSTOM GOALS MANAGER -->
                <div style="background: var(--tertiary); padding: 2rem;" class="neu-border neu-shadow">
                    <h3 style="margin-bottom: 1.5rem; color: white; text-transform: uppercase; font-weight: 900;">Custom Funding Goals</h3>

                    <!-- Add Goal Form -->
                    <form id="add-goal-form" style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
                        <input id="goal-name" type="text" placeholder="Goal Name (e.g. Flight)" required class="neu-border" style="padding: 0.8rem; flex-grow: 1; outline: none;">
                        <input id="goal-cost" type="number" placeholder="Cost (USD)" required class="neu-border" style="padding: 0.8rem; width: 120px; outline: none;">
                        <button type="submit" style="background: var(--primary); padding: 0.8rem; font-weight: 900; cursor: pointer;" class="neu-border neu- shadow">+</button>
                    </form>
                    <!-- Rendered Goals -->
                    <div id="goals-list">
                        ${goalsList}
                    </div>
                </div>

            </div>
        `;
    }
};

const UI = {
    root: document.getElementById('app'),
    
    render() {
        const navHTML = `
            <nav>
                <h1 class="neu-border neu-shadow">HackTrak</h1>
                <div class="nav-links">
                    <a href="#dashboard" class="neu-border neu-shadow ${Store.currentRoute === '#dashboard' || Store.currentRoute === '' ? 'active' : ''}">Dashboard</a>
                    <a href="#projects" class="neu-border neu-shadow ${Store.currentRoute === '#projects' ? 'active' : ''}">Projects</a>
                    <a href="#timeline" class="neu-border neu-shadow ${Store.currentRoute === '#timeline' ? 'active' : ''}">Timeline</a>
                    <a href="#settings" class="neu-border neu-shadow ${Store.currentRoute === '#settings' ? 'active' : ''}">Settings</a>
                </div>
            </nav>
        `;

        let mainContent = '';
        if (Store.currentRoute === '#dashboard' || Store.currentRoute === '') {
            mainContent = Views.Dashboard();
        } else if (Store.currentRoute === '#settings') {
            mainContent = Views.Settings();
        } else {
            mainContent = `<h2 class="view-title">404 - Page Not Found</h2>`;
        }

        this.root.innerHTML = `
            ${navHTML}
            <main>
                ${mainContent}
            </main>
        `;

        this.attachEvents();
    },

    attachEvents() {
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('input', (e) => {
                if (e.target.name) {
                    Store.data.settings[e.target.name] = parseFloat(e.target.value);
                    Store.saveSilent();
                }
            });
        }

        const addGoalForm = document.getElementById('add-goal-form');
        if (addGoalForm) {
            addGoalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('goal-name').value.trim();
                const costUsd = parseFloat(document.getElementById('goal-cost').value);

                Store.data.goals.push({
                    id: Store.generateId(),
                    name: name,
                    costUsd: costUsd,
                });
                Store.save()
            });
        }

        const goalsList = document.getElementById('goals-list');
        if (goalsList) {
            goalsList.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-delete-goal')) {
                    const goalId = e.target.getAttribute('data-delete-goal');
                    Store.data.goals = Store.data.goals.filter(g => g.id !== goalId);
                    Store.save();
                }
            });
        }
    }
};

Store.init();
Store.subscribe(() => UI.render());
UI.render();