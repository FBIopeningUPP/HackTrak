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
                        <span style="font-weight: 900; font-size: 1.2rem;">${g.hoursNeeded} HRS</span>
                        <button data-delete-goal="${g.id}" style="background: var(--secondary); padding: 0.5rem 1rem; font-weight: bold; cursor: pointer;" class="neu-border neu-shadow">REMOVE</button>
                </div>
            `).join('');

        return `
            <h2 class="view-title">System Settings</h2>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; align-items: start;">

                <!-- GLOBAL RATES -->
                <div style="background: var(--primary); padding: 1.5rem;" class="neu-border neu-shadow">
                    <h3 style="margin-bottom: 1.5rem; text-transform: uppercase; font-weight: 900;">Global Rates</h3>
                    <form id="settings-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Exchange Rate (INR/USD)</label>
                            <input name="exchangeRate" type="number" step="0.01" value="${Store.data.settings.exchangeRate}" class="neu-border" style="padding: 1rem; font-size: 1rem; outline: none;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Travel Grant Rate (USD/Hr)</label>
                            <input name="stipendRate" type="number" step="0.01" value="${Store.data.settings.stipendRate}" class="neu-border" style="padding: 1rem; font-size: 1rem; outline: none;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-weight: 900; text-transform: uppercase;">Ticket Goal (Hours)</label>
                            <input name="ticketHours" type="number" value="${Store.data.settings.ticketHours}" class="neu-border" style="padding: 1rem; font-size: 1rem; outline: none;">
                        </div>
                    </form>
                </div>

                <!-- CUSTOM GOALS MANAGER -->
                <div style="background: var(--tertiary); padding: 2rem;" class="neu-border neu-shadow">
                    <h3 style="margin-bottom: 1.5rem; color: white; text-transform: uppercase; font-weight: 900;">Custom Funding Goals</h3>

                    <!-- Add Goal Form -->
                    <form id="add-goal-form" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; align-items: flex-start;">
                        <input id="goal-name" type="text" placeholder="Goal Name (e.g. Flight)" required class="neu-border" style="padding: 0.5rem; flex-grow: 1; outline: none;">
                        <input id="goal-cost" type="number" placeholder="Hours" required class="neu-border" style="padding: 0.5rem; width: 120px; outline: none;">
                        <button type="submit" style="background: var(--primary); padding: 0.5rem 1rem; font-weight: 900; cursor: pointer;" class="neu-border neu-shadow">+</button>
                    </form>
                    <!-- Rendered Goals -->
                    <div id="goals-list">
                        ${goalsList}
                    </div>
                </div>

            </div>
        `;
    },

    Projects() {
        const activeProjects = Store.data.projects.filter(p => !p.archived);

        const projectsList = activeProjects.length === 0
            ? `<div style="padding: 3rem; background: var(--white); text-align: center;" class="neu-border neu-shadow"><h3 style="font-weight: 900; font-size: 1.5rem;">NO PROJECTS YET</h3><p style="font-weight: bold; margin-top: 1rem;">Initialize a project below to start logging hours against it.</p></div>`
            : `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; align-items: stretch;">` +
                activeProjects.map(p => `
                   <div style="background: var(--white); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;" class="neu-border neu-shadow"> 
                   <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="font-weight: 900; font-size: 1.5rem; word-break: break-word;">${p.name}</h3>
                            <span style="background: var(--primary); padding: 0.25rem 0.5rem; font-weight: 900; white-space: nowrap;" class="neu-border">${Store.helpers.getProjectTotalHours(p.id)} HRS</span>
                        </div>
                    </div>
                    <div style="font-weight: 900; font-size: 0.9rem;">Launched: ${Store.helpers.formatDate(p.createdAt)}</div>
                    </div>
                    </div>
                `).join('') + `</div>`;

                return `
                    <h2 class="view-title">Project Roster</h2>
                    <!-- Create Project Form -->
                    <div style="background: var(--tertiary); padding: 1.5rem; margin-bottom: 2.5rem;" class="neu-border neu-shadow">
                        <h3 style="margin-bottom: 1rem; color: white; text-transform: uppercase; font-weight: 900;">Initialize New Project</h3>
                        <form id="add-project-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <input id="project-name" type="text" placeholder="Project Name" required class="neu-border" style="padding: 0.75rem; font-size: 1.1rem; outline: none;">
                            <textarea id="project-notes" placeholder="Scope / Description" class="neu-border" style="padding: 0.75rem; font-size: 1.1rem; outline: none; resize: vertical; min-height: 80px;"></textarea>
                            <button type="submit" style="background: var(--primary); padding: 1rem; font-weight: 900; font-size: 1.2rem; cursor: pointer; text-transform: uppercase;" class="neu-border neu-shadow">CREATE PROJECT</button>
                        </form>
                    </div>

                    ${projectsList}
                `;
        },
        Timeline() {
            const activeProjects = Store.data.projects.filter(p => !p.archived);

            const projectOptions = activeProjects.length === 0
                ? `<option value="" disabled selected>No active projects. Go create one!</option>`
                : activeProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

            const unsubmittedHours = Store.data.hours.filter(h => !h.submitted);
            const totalUnsubmitted = unsubmittedHours.reduce((sum, h) => sum + parseFloat(h.amount), 0);

            const bankList = unsubmittedHours.length === 0
                ? `<p style="font-weight: bold; font-size: 1.2rem;">Your bank is empty. Log some hours above.</p>`
                : `<div style="display: flex; flex-direction: column; gap: 1rem;">` +
                  unsubmittedHours.map(h => {
                      const proj = Store.data.projects.find(p => p.id === h.projectId);
                      return `
                          <div style="background: var(--white); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;" class="neu-border neu-shadow">
                              <div>
                                  <div style="font-weight: 900; font-size: 1.3rem; margin-bottom: 0.25rem;">${proj ? proj.name : 'Unknown Project'}</div>
                                  <div style="font-weight: bold; font-size: 1rem;">${h.description}</div>
                              </div>
                              <div style="display: flex; align-items: center; gap: 1.5rem;">
                                  <div style="font-weight: 900; font-size: 2rem;">${h.amount} <span style="font-size: 1rem;">HRS</span></div>
                                  <button data-delete-hour="${h.id}" style="background: var(--secondary); padding: 0.5rem 1rem; font-weight: 900; cursor: pointer; height: fit-content;" class="neu-border neu-shadow">X</button>
                              </div>
                          </div>
                          `;
                  }).join('') + `</div>`;

            const submitBtn = unsubmittedHours.length > 0
                ? `<button id="btn-submit-timesheet" style="background: var(--secondary); padding: 1.5rem; font-weight: 900; font-size: 1.5rem; width: 100%; margin-top: 2rem; cursor: pointer; text-transform: uppercase;" class="neu-border neu-shadow">Submit ${totalUnsubmitted} Hours to Timesheet</button>`
                : '';

            const pastSubmissions = Store.data.submissions.length === 0
                ? `<p style="font-weight: bold; font-size: 1.2rem;">No timesheet submissions yet.</p>`
                : `<div style="display: flex; flex-direction: column; gap: 1rem;">` +
                  Store.data.submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(sub => `
                      <div style="background: var(--bg-color); padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;" class="neu-border neu-shadow">
                          <div>
                              <div style="font-weight: 900; font-size: 1.2rem; margin-bottom: 0.25rem; text-transform: uppercase;">Timesheet Batch</div>
                              <div style="font-weight: bold; font-size: 0.9rem; color: #333;">Logged on: ${Store.helpers.formatDate(sub.timestamp)}</div>
                          </div>
                          <div style="display: flex; align-items: center; gap: 1rem;">
                              <div style="font-weight: 900; font-size: 1.6rem;">${sub.totalHours} <span style="font-size: 0.9rem;">HRS</span></div>
                              <span style="background: var(--primary); padding: 0.35rem 0.6rem; font-weight: 900; font-size: 0.8rem; text-transform: uppercase;" class="neu-border">Approved</span>
                          </div>
                        </div>
                    `).join('') + `</div>`;

            return `
                <h2 class="view-title">Timeline Logger</h2>

                <div style="background: var(--tertiary); padding: 1.5rem; margin-bottom: 2.5rem;" class="neu-border neu-shadow">
                    <h3 style="margin-bottom: 1rem; color: white; text-transform: uppercase; font-weight: 900;">Log Work Hours</h3>

                    <form id="log-hours-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <select id="log-project" required class="neu-border" style="padding: 0.75rem; font-size: 1.1rem; outline: none; cursor: pointer;">
                            ${projectOptions}
                        </select>

                        <input id="log-amount" type="number" step="0.25" min="0.25" placeholder="Hours (e.g. 2.5)" required class="neu-border" style="padding: 0.75rem; font-size: 1.1rem; outline: none;">

                        <input id="log-desc" type="text" placeholder="What did you do?" required class="neu-border" style="padding: 0.75rem; font-size: 1.1rem; outline: none;">

                        <button type="submit" ${activeProjects.length === 0 ? 'disabled' : ''} style="background: var(--primary); padding: 1rem; font-weight: 900; font-size: 1.2rem; cursor: pointer; text-transform: uppercase;" class="neu-border neu-shadow">RECORD HOURS</button>
                    </form>
                </div>

                <div id="unsubmitted-bank" style="margin-bottom: 3rem;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5rem;">
                        <h3 style="text-transform: uppercase; font-weight: 900; font-size: 1.8rem;">Unsubmitted Bank</h3>
                        <span style="font-weight: 900; font-size: 1.2rem; background: var(--primary); padding: 0.5rem 1rem;" class="neu-border">${totalUnsubmitted}TOTAL HRS</span>
                    </div>
                    ${bankList}
                    ${submitBtn}
                </div>

                <div style="margin-bottom: 3rem; padding-top: 2rem; border-top: 4px solid var(--text-color);">
                    <h3 style="text-transform: uppercase; font-weight: 900; font-size: 1.5rem;">Audit Log (History)</h3>
                    ${pastSubmissions}
                </div>
            `;
        },

        Dashboard() {
            const totalApprovedHours = Store.helpers.getTotalApprovedHours();
            const stipendRate = Store.data.settings.stipendRate;
            const exchangeRate = Store.data.settings.exchangeRate;

            const totalUsd = totalApprovedHours * stipendRate;
            const totalInr = totalUsd * exchangeRate;

            let remainingHours = totalApprovedHours;

            const goalsRender = Store.data.goals.length === 0
                ? `<div style="background: var(--white); padding: 1.5rem; font-weight: bold; text-align: center; text-transform: uppercase;" class="neu-border neu-shadow">No custom goals set. Head to settings.</div>`
                : Store.data.goals.map(g => {
                    const hoursNeeded = parseFloat(g.hoursNeeded) || 1;
                    let hoursAllocated = 0;

                    if (remainingHours >= hoursNeeded) {
                        hoursAllocated = hoursNeeded;
                        remainingHours -= hoursNeeded;
                    } else if (remainingHours > 0) {
                        hoursAllocated = remainingHours;
                        remainingHours = 0;
                    }

                    const percentComplete = Math.min(100, Math.floor((hoursAllocated / hoursNeeded) * 100));
                    const isComplete = percentComplete === 100;

                    return `
                        <div style="background: var(--white); padding: 1.5rem; margin-bottom: 1.5rem;" class="neu-border neu-shadow">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
                                <h4 style="font-weight: 900; font-size: 1.4rem; text-transform: uppercase;">${g.name}</h4>
                                <span style="font-weight: 900; font-size: 1.2rem;">${hoursAllocated} / ${hoursNeeded} HRS</span>
                            </div>

                            <!-- Neubrutalist Progress Bar -->
                            <div style="height: 30px; background: var(--bg-color); width: 100%; position: relative;" class="neu-border">
                                <div style="height: 100%; width: ${percentComplete}%; background: ${isComplete ? 'var(--tertiary)' : 'var(--primary)'}; border-right:${percentComplete > 0 && !isComplete ? '4px solid var(--text-color)' : 'none'}; transition: width 0.5s ease;"></div>
                                <span style="position: absolute; left: 10px; top: 3px; font-weight: 900; color: var(--text-color);">${percentComplete}%</span>
                            </div>
                        </div>
                    `;
                }).join('');

                const projectBreakdown = Store.data.projects.length === 0
                    ? `<p style="font-weight: bold; font-size: 1.2rem;">No projects initialized.</p>`
                    : `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">` +
                      Store.data.projects.map(p => `
                          <div style="background: var(--bg-color); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;" class="neu-border neu-shadow">
                              <div>
                                  <div style="font-weight: 900; font-size: 1.2rem; margin-bottom: 0.25rem; word-break: break-word;">${p.name}</div>
                                  <div style="font-weight: bold; font-size: 0.8rem; color: #555;">${p.archived ? 'ARCHIVED' : 'ACTIVE'}</div>
                              </div>
                              <div style="font-weight: 900; font-size: 1.5rem; white-space: nowrap;">${Store.helpers.getProjectTotalHours(p.id)} <span style="font-size: 0.8rem;">HRS</span></div>
                          </div>
                      `).join('') + `</div>`;
            
            return `
                <h2 class="view-title">Command Center</h2>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3.5rem;">

                    <div style="background: var(--secondary); padding: 2rem; display: flex; flex-direction: column; justify-content: center;" class="neu-border neu-shadow">
                        <h3 style="font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem;">Total Approved</h3>
                        <span style="font-weight: 900; font-size: 3.5rem;">${totalApprovedHours} <span style="font-size: 1.5rem;">HRS</span></span>
                    </div>

                    <div style="background: var(--tertiary); padding: 2rem; display: flex; flex-direction: column; justify-content: center;" class="neu-border neu-shadow">
                        <h3 style="color: white; font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem;">Travel Grant (USD)</h3>
                        <span style="color: white; font-weight: 900; font-size: 3.5rem;">$${totalUsd.toFixed(2)}</span>
                    </div>

                    <div style="background: var(--primary); padding: 2rem; display: flex; flex-direction: column; justify-content: center;" class="neu-border neu-shadow">
                        <h3 style="font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem;">Travel Grant (INR)</h3>
                        <span style="font-weight: 900; font-size: 3.5rem;">₹${totalInr.toFixed(2)}</span>
                    </div>

                </div>

                <h3 style="font-size: 2.5rem; font-weight: 900; text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: -1px;">Funding Waterfall</h3>
                <div style="background: var(--white); padding: 2rem; border: 4px solid var(--text-color); box-shadow: 8px 8px 0px var(--text-color);">
                    ${goalsRender}
                </div>
                <h3 style="font-size: 2.5rem; font-weight: 900; text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: -1px; margin-top: 3.5rem;">Project Breakdown</h3>
                    <div style="background: var(--white); padding: 2rem; border: 4px solid var(--text-color); box-shadow: 8px 8px 0px var(--text-color); margin-bottom:3.5rem;">
                        ${projectBreakdown}
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
        } else if (Store.currentRoute === '#projects'){
            mainContent = Views.Projects();
        } else if (Store.currentRoute === '#timeline') {
            mainContent = Views.Timeline();
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
                const hoursNeeded = parseFloat(document.getElementById('goal-cost').value);

                Store.data.goals.push({
                    id: Store.generateId(),
                    name: name,
                    hoursNeeded: hoursNeeded,
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

        const addProjectForm = document.getElementById('add-project-form');
        if (addProjectForm) {
            addProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Store.data.projects.push({
                    id: Store.generateId(),
                    name: document.getElementById('project-name').value.trim(),
                    notes: document.getElementById('project-notes').value.trim(),
                    createdAt: new Date().toISOString(),
                    archived: false,
                });
                Store.save();
            });
        }

        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-archive-project')) {
                    if (confirm("Archive this project? You won't be able to log new hours to it.")) {
                        const projectId = e.target.getAttribute('data-archive-project');
                        const proj = Store.data.projects.find(p => p.id === projectId);
                        if (proj) {
                            proj.archived = true;
                            Store.save();
                        }
                    }
                }
            });
        }

        const logHoursForm = document.getElementById('log-hours-form');
        if (logHoursForm) {
            logHoursForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Store.data.hours.push({
                    id: Store.generateId(),
                    projectId: document.getElementById('log-project').value,
                    amount: parseFloat(document.getElementById('log-amount').value),
                    description: document.getElementById('log-desc').value.trim(),
                    createdAt: new Date().toISOString(),
                    submitted: false
                });
                Store.save();
            });
        }
        const submitTimesheetBtn = document.getElementById('btn-submit-timesheet');
        if (submitTimesheetBtn) {
            submitTimesheetBtn.addEventListener('click', () => {
                if(confirm("Submit these hours? They will be locked into a Timesheet block.")) {
                    const unsubmittedHours = Store.data.hours.filter(h => !h.submitted);
                    const totalAmount = unsubmittedHours.reduce((sum, h) => sum + parseFloat(h.amount), 0);

                    Store.data.submissions.push({
                        id: Store.generateId(),
                        timestamp: new Date().toISOString(),
                        totalHours: totalAmount,
                        status: 'approved',
                    });

                    unsubmittedHours.forEach(h => h.submitted = true);

                    Store.save();
                }
            });
        }
        const bankContainer = document.getElementById('unsubmitted-bank');
        if (bankContainer) {
            bankContainer.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-delete-hour')) {
                    const hourId = e.target.getAttribute('data-delete-hour');
                    Store.data.hours = Store.data.hours.filter(h => h.id !== hourId);
                    Store.save();
                }
            });
        }
    }
};

Store.init();
Store.subscribe(() => UI.render());
UI.render();