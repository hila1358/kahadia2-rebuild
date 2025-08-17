// קה״דיה - מערכת ניהול שבצ״ק - Main Application Logic
class KahadiaApp {
    constructor() {
        this.apiBase = '/api';
        this.currentSection = 'dashboard';
        this.data = {
            personnel: [],
            departments: [],
            positions: [],
            skills: [],
            constraints: [],
            assignments: []
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        await this.loadDashboardData();
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Theme toggle
        const themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Modal close
        document.querySelector('.modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    setupNavigation() {
        // Set initial active state
        this.showSection('dashboard');
    }

    // Navigation
    showSection(sectionName) {
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });

        // Update page sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            this.loadSectionData(sectionName);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'personnel':
                await this.loadPersonnelData();
                break;
            case 'departments':
                await this.loadDepartmentsData();
                break;
            case 'positions':
                await this.loadPositionsData();
                break;
            case 'skills':
                await this.loadSkillsData();
                break;
            case 'constraints':
                await this.loadConstraintsData();
                break;
            case 'schedule':
                await this.loadScheduleBuilder();
                break;
            case 'view-schedule':
                await this.loadScheduleView();
                break;
        }
    }

    // API Methods
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            
            if (!response.ok) {
                const errorData = await response.json();
                const error = new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }
            
            const result = await response.json();
            
            // Handle both formats: {success: true, data: ...} and direct data
            if (result.success !== undefined) {
                if (!result.success) {
                    throw new Error(result.error || 'API call failed');
                }
                return result.data;
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            if (!error.message.includes('Cross-department assignment conflict')) {
                this.showToast(error.message, 'error');
            }
            throw error;
        }
    }

    // Dashboard
    async loadDashboardData() {
        try {
            const [personnel, positions, assignments, constraints] = await Promise.all([
                this.apiCall('/personnel'),
                this.apiCall('/positions'), 
                this.apiCall('/assignments'),
                this.apiCall('/constraints')
            ]);

            this.data.personnel = personnel;
            this.updateDashboardStats(personnel, positions, assignments, constraints);
            this.renderUpcomingSchedules(assignments);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboardStats(personnel, positions, assignments, constraints) {
        document.getElementById('totalPersonnel').textContent = personnel.length;
        document.getElementById('activePositions').textContent = positions.length;
        
        // Calculate staffing rate
        const assignedCount = assignments.filter(a => a.person_id).length;
        const totalSlots = assignments.length;
        const staffingRate = totalSlots > 0 ? Math.round((assignedCount / totalSlots) * 100) : 0;
        document.getElementById('staffingRate').textContent = `${staffingRate}%`;
        
        // Get current week constraints
        const currentWeek = this.getCurrentWeek();
        const weekConstraints = constraints.filter(c => this.isInCurrentWeek(c.date));
        document.getElementById('weeklyConstraints').textContent = weekConstraints.length;
    }

    renderUpcomingSchedules(assignments) {
        const tbody = document.getElementById('upcomingSchedules');
        tbody.innerHTML = '';

        // Get next few assignments
        const upcoming = assignments
            .filter(a => a.person_name) // Only assigned ones
            .slice(0, 5); // Show first 5

        upcoming.forEach(assignment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.position_name || 'לא מוגדר'}</td>
                <td>${this.formatDate(assignment.date) || '13.08.2025'}</td>
                <td>${assignment.start_time || '08:00'} - ${assignment.end_time || '14:00'}</td>
                <td>${assignment.person_name || '-'}</td>
                <td><span class="status-badge status-active">מאושר</span></td>
                <td>
                    <button class="btn-icon" onclick="app.editAssignment(${assignment.id})">✏️</button>
                    <button class="btn-icon" onclick="app.deleteAssignment(${assignment.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Personnel
    async loadPersonnelData(filters = {}) {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
            if (filters.populationId) queryParams.append('populationId', filters.populationId);
            if (filters.qualificationId) queryParams.append('qualificationId', filters.qualificationId);
            
            const queryString = queryParams.toString();
            const endpoint = queryString ? `/personnel?${queryString}` : '/personnel';
            
            const personnel = await this.apiCall(endpoint);
            this.data.personnel = personnel;
            this.renderPersonnelTable(personnel);
            this.renderPersonnelFilters();
        } catch (error) {
            console.error('Failed to load personnel data:', error);
        }
    }
    
    async renderPersonnelFilters() {
        const filterContainer = document.getElementById('personnelFilters');
        if (!filterContainer) return;
        
        try {
            const [departments, populations, skills] = await Promise.all([
                this.apiCall('/departments'),
                this.apiCall('/populations'),
                this.apiCall('/skills')
            ]);
            
            filterContainer.innerHTML = `
                <div class="filters-row">
                    <div class="filter-group">
                        <label class="filter-label">חיפוש</label>
                        <input type="text" id="searchFilter" class="filter-input" placeholder="שם או מספר אישי">
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">מחלקה</label>
                        <select id="departmentFilter" class="filter-select">
                            <option value="">כל המחלקות</option>
                            ${departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">אוכלוסייה</label>
                        <select id="populationFilter" class="filter-select">
                            <option value="">כל האוכלוסיות</option>
                            ${populations.map(pop => `<option value="${pop.id}">${pop.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">כישור</label>
                        <select id="qualificationFilter" class="filter-select">
                            <option value="">כל הכישורים</option>
                            ${skills.map(skill => `<option value="${skill.id}">${skill.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="btn btn-primary" onclick="app.applyPersonnelFilters()">סנן</button>
                        <button class="btn btn-secondary" onclick="app.clearPersonnelFilters()">נקה</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    }
    
    applyPersonnelFilters() {
        const filters = {
            search: document.getElementById('searchFilter')?.value || '',
            departmentId: document.getElementById('departmentFilter')?.value || '',
            populationId: document.getElementById('populationFilter')?.value || '',
            qualificationId: document.getElementById('qualificationFilter')?.value || ''
        };
        
        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                delete filters[key];
            }
        });
        
        this.loadPersonnelData(filters);
    }
    
    clearPersonnelFilters() {
        document.getElementById('searchFilter').value = '';
        document.getElementById('departmentFilter').value = '';
        document.getElementById('populationFilter').value = '';
        document.getElementById('qualificationFilter').value = '';
        
        this.loadPersonnelData();
    }

    renderPersonnelTable(personnel) {
        const tbody = document.getElementById('personnelTable');
        const headerRow = document.querySelector('#personnelTable thead tr');
        tbody.innerHTML = '';
        
        // Add select all checkbox to header if not exists
        if (!headerRow.querySelector('.select-checkbox')) {
            const selectAllCell = document.createElement('th');
            selectAllCell.innerHTML = '<input type="checkbox" class="select-all-checkbox" onchange="app.toggleSelectAll()">';
            headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        }

        personnel.forEach(person => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-checkbox" data-person-id="${person.id}" onchange="app.updateBulkActions()"></td>
                <td>${person.full_name}</td>
                <td>${person.personal_number}</td>
                <td>${person.rank}</td>
                <td>${person.department_name || 'לא שובץ'}</td>
                <td>${person.population_name || 'לא מוגדר'}</td>
                <td>
                    <div class="skills-grid">
                        ${person.skills ? person.skills.map(skill => 
                            `<span class="skill-tag">${skill.name}</span>`
                        ).join('') : ''}
                    </div>
                </td>
                <td>
                    <button class="btn-icon" onclick="app.editPerson(${person.id})">✏️</button>
                    <button class="btn-icon" onclick="app.deletePerson(${person.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Show/hide bulk actions
        this.updateBulkActions();
    }

    // Departments
    async loadDepartmentsData() {
        try {
            const departments = await this.apiCall('/departments');
            this.data.departments = departments;
            this.renderDepartments(departments);
        } catch (error) {
            console.error('Failed to load departments data:', error);
        }
    }

    renderDepartments(departments) {
        const container = document.getElementById('departmentsContainer');
        container.innerHTML = '';

        departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'department-card';
            card.innerHTML = `
                <div class="department-header">
                    <div class="department-name">${dept.name}</div>
                    <div class="department-count">${dept.member_count || 0} אנשים</div>
                </div>
                <div class="department-details">
                    <p><strong>מפקד מחלקה:</strong> ${dept.commander_name || 'לא מוגדר'}</p>
                    ${dept.notes ? `<p><strong>הערות:</strong> ${dept.notes}</p>` : ''}
                </div>
                <div class="department-actions">
                    <button class="btn btn-secondary" onclick="app.viewDepartment(${dept.id})">צפייה</button>
                    <button class="btn btn-secondary" onclick="app.editDepartment(${dept.id})">עריכה</button>
                    <button class="btn btn-danger" onclick="app.deleteDepartment(${dept.id})">מחיקה</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Positions
    async loadPositionsData() {
        try {
            const positions = await this.apiCall('/positions');
            this.data.positions = positions;
            this.renderPositionsTable(positions);
        } catch (error) {
            console.error('Failed to load positions data:', error);
        }
    }

    renderPositionsTable(positions) {
        const tbody = document.getElementById('positionsTable');
        tbody.innerHTML = '';

        positions.forEach(position => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${position.name}</td>
                <td>${position.roles_list || 'אין תפקידנים'}</td>
                <td>
                    <div class="skills-grid">
                        ${position.required_skills ? position.required_skills.map(skill => 
                            `<span class="skill-tag">${skill.name}${skill.is_mandatory ? ' *' : ''}</span>`
                        ).join('') : 'אין דרישות'}
                    </div>
                </td>
                <td>
                    <button class="btn-icon" onclick="app.editPosition(${position.id})">✏️</button>
                    <button class="btn-icon" onclick="app.deletePosition(${position.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Skills
    async loadSkillsData() {
        try {
            const skills = await this.apiCall('/skills');
            this.data.skills = skills;
            this.renderSkillsTable(skills);
        } catch (error) {
            console.error('Failed to load skills data:', error);
        }
    }

    renderSkillsTable(skills) {
        const tbody = document.getElementById('skillsTable');
        tbody.innerHTML = '';

        skills.forEach(skill => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${skill.name}</td>
                <td>${skill.certified_count || 0}</td>
                <td>${skill.notes || ''}</td>
                <td>
                    <button class="btn-icon" onclick="app.editSkill(${skill.id})">✏️</button>
                    <button class="btn-icon" onclick="app.deleteSkill(${skill.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Constraints
    async loadConstraintsData() {
        try {
            // Set default current week in the week picker
            const weekPicker = document.getElementById('constraintWeekPicker');
            if (weekPicker && !weekPicker.value) {
                const currentWeek = this.getCurrentWeekForInput();
                weekPicker.value = currentWeek;
            }
            
            const constraints = await this.apiCall('/constraints');
            this.data.constraints = constraints;
            this.renderConstraintsGrid(constraints);
        } catch (error) {
            console.error('Failed to load constraints data:', error);
        }
    }

    renderConstraintsGrid(constraints) {
        const grid = document.getElementById('constraintsGrid');
        grid.innerHTML = '';

        if (constraints.length === 0) {
            grid.innerHTML = '<p class="text-muted">אין אילוצים מוגדרים</p>';
            return;
        }

        // Group constraints by person and date
        const grouped = {};
        constraints.forEach(constraint => {
            const key = `${constraint.person_name}-${constraint.date}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(constraint);
        });

        // Render constraints
        Object.entries(grouped).forEach(([key, personConstraints]) => {
            const [personName, date] = key.split('-');
            const constraintDiv = document.createElement('div');
            constraintDiv.className = 'constraint-item';
            constraintDiv.innerHTML = `
                <div class="constraint-header">
                    <strong>${personName}</strong>
                    <span>${this.formatDate(date)}</span>
                </div>
                <div class="constraint-badges">
                    ${personConstraints.map(c => 
                        `<span class="constraint-badge constraint-${c.type.toLowerCase()}">${c.type}</span>`
                    ).join('')}
                </div>
            `;
            grid.appendChild(constraintDiv);
        });
    }

    // Schedule Builder
    async loadScheduleBuilder() {
        const positionId = document.getElementById('schedulePositionSelect')?.value;
        const week = document.getElementById('scheduleWeekSelect')?.value;

        if (!positionId || !week) {
            document.getElementById('scheduleBuilder').innerHTML = 
                '<p class="text-muted">בחר עמדה ושבוע כדי להתחיל בבניית שבצ״ק</p>';
            return;
        }

        try {
            const scheduleData = await this.apiCall(`/schedule-weeks?position_id=${positionId}&week=${week}`);
            this.renderScheduleBuilder(scheduleData, positionId, week);
        } catch (error) {
            console.error('Failed to load schedule builder:', error);
        }
    }

    renderScheduleBuilder(scheduleData, positionId, week) {
        const container = document.getElementById('scheduleBuilder');
        
        if (!scheduleData || scheduleData.length === 0) {
            container.innerHTML = `
                <div class="schedule-empty">
                    <p>עדיין לא נוצר שבצ״ק עבור עמדה זו</p>
                    <button class="btn btn-primary" onclick="app.createScheduleWeek(${positionId}, '${week}')">
                        צור שבצ״ק חדש
                    </button>
                </div>
            `;
            return;
        }

        // Render schedule building interface
        container.innerHTML = `
            <div class="schedule-builder-interface">
                <div class="time-blocks">
                    <h3>טווחי שעות</h3>
                    <div id="timeBlocksList">
                        <!-- Time blocks will be loaded here -->
                    </div>
                    <button class="btn btn-secondary" onclick="app.addTimeBlock()">הוסף טווח שעות</button>
                </div>
                <div class="assignments-grid" id="assignmentsGrid">
                    <!-- Assignment grid will be loaded here -->
                </div>
            </div>
        `;
    }

    // Schedule View
    async loadScheduleView() {
        const positionId = document.getElementById('viewPositionSelect')?.value;
        const week = document.getElementById('viewWeekSelect')?.value;

        if (!positionId || !week) {
            document.getElementById('scheduleViewGrid').innerHTML = 
                '<p class="text-muted">בחר עמדה ושבוע לצפייה בשבצ״ק</p>';
            return;
        }

        try {
            const assignments = await this.apiCall(`/assignments?position_id=${positionId}&week=${week}`);
            this.renderScheduleView(assignments);
        } catch (error) {
            console.error('Failed to load schedule view:', error);
        }
    }

    renderScheduleView(assignments) {
        const grid = document.getElementById('scheduleViewGrid');
        
        if (!assignments || assignments.length === 0) {
            grid.innerHTML = '<p class="text-muted">אין שיבוצים עבור עמדה ושבוע אלה</p>';
            return;
        }

        // Create schedule grid
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        let gridHTML = '<div class="schedule-cell schedule-header">שעות</div>';
        
        // Header row
        days.forEach(day => {
            gridHTML += `<div class="schedule-cell schedule-header">${day}</div>`;
        });

        // Group assignments by time block
        const timeBlocks = {};
        assignments.forEach(assignment => {
            const timeKey = `${assignment.start_time}-${assignment.end_time}`;
            if (!timeBlocks[timeKey]) {
                timeBlocks[timeKey] = new Array(7).fill(null);
            }
            timeBlocks[timeKey][assignment.day_of_week] = assignment;
        });

        // Render time block rows
        Object.entries(timeBlocks).forEach(([timeKey, assignments]) => {
            gridHTML += `<div class="schedule-cell schedule-time">${timeKey}</div>`;
            assignments.forEach(assignment => {
                if (assignment) {
                    gridHTML += `
                        <div class="schedule-cell has-shift">
                            <div class="shift-name">${assignment.role_name}</div>
                            <div class="shift-person">${assignment.person_name || 'לא משובץ'}</div>
                        </div>
                    `;
                } else {
                    gridHTML += '<div class="schedule-cell">-</div>';
                }
            });
        });

        grid.innerHTML = gridHTML;
    }

    // Modal Management
    showModal(title, content) {
        const modal = document.getElementById('genericModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('genericModal');
        modal.classList.remove('active');
    }

    // Form Modals
    showPersonnelModal(person = null) {
        const title = person ? 'עריכת תיק אישי' : 'הוספת תיק אישי חדש';
        const content = `
            <form id="personnelForm">
                <div class="form-group">
                    <label class="form-label">שם מלא *</label>
                    <input type="text" class="form-input" name="full_name" value="${person?.full_name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">מספר אישי *</label>
                    <input type="text" class="form-input" name="personal_number" value="${person?.personal_number || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">דרגה *</label>
                    <select class="form-select" name="rank" required>
                        <option value="">בחר דרגה</option>
                        <option value="רב״ט" ${person?.rank === 'רב״ט' ? 'selected' : ''}>רב״ט</option>
                        <option value="סמל" ${person?.rank === 'סמל' ? 'selected' : ''}>סמל</option>
                        <option value="סמ״ר" ${person?.rank === 'סמ״ר' ? 'selected' : ''}>סמ״ר</option>
                        <option value="רס״ר" ${person?.rank === 'רס״ר' ? 'selected' : ''}>רס״ר</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">גף *</label>
                    <input type="text" class="form-input" name="branch" value="${person?.branch || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">מקום מגורים *</label>
                    <input type="text" class="form-input" name="residence" value="${person?.residence || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">מספר טלפון *</label>
                    <input type="tel" class="form-input" name="phone" value="${person?.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">הערות</label>
                    <textarea class="form-input" name="notes" rows="3">${person?.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${person ? 'עדכן' : 'הוסף'} תיק אישי
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">ביטול</button>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        // Setup form handler
        document.getElementById('personnelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePersonnelSubmit(person?.id);
        });
    }

    async handlePersonnelSubmit(personId) {
        const form = document.getElementById('personnelForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const method = personId ? 'PUT' : 'POST';
            const endpoint = personId ? `/personnel/${personId}` : '/personnel';
            
            await this.apiCall(endpoint, method, data);
            this.showToast(`תיק אישי ${personId ? 'עודכן' : 'נוצר'} בהצלחה`, 'success');
            this.closeModal();
            this.loadPersonnelData();
        } catch (error) {
            console.error('Failed to save personnel:', error);
        }
    }

    // Utility Methods
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL');
    }

    getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        return start.toISOString().split('T')[0];
    }
    
    getCurrentWeekForInput() {
        const now = new Date();
        const year = now.getFullYear();
        
        // Get the Monday of the current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        const monday = new Date(now.setDate(diff));
        
        // Calculate week number (ISO 8601)
        const startOfYear = new Date(year, 0, 1);
        const daysSinceStart = Math.floor((monday - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    isInCurrentWeek(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        return date >= weekStart && date <= weekEnd;
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.dataset.theme === 'dark';
        body.dataset.theme = isDark ? 'light' : 'dark';
        
        const themeBtn = document.querySelector('.theme-toggle-btn');
        themeBtn.textContent = isDark ? '🌙' : '☀️';
        
        // Save theme preference
        localStorage.setItem('theme', body.dataset.theme);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-right: 10px;">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Quick actions
    showQuickAdd() {
        // Show quick add menu or modal
        console.log('Quick add menu');
    }
    
    // Multi-select functionality
    toggleSelectAll() {
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        const individualCheckboxes = document.querySelectorAll('.select-checkbox');
        
        individualCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateBulkActions();
    }
    
    updateBulkActions() {
        const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
        const bulkActionsContainer = document.getElementById('bulkActions');
        
        if (selectedCheckboxes.length > 0) {
            if (!bulkActionsContainer) {
                // Create bulk actions bar
                const actionsBar = document.createElement('div');
                actionsBar.id = 'bulkActions';
                actionsBar.className = 'bulk-actions-bar';
                actionsBar.innerHTML = `
                    <div class="bulk-actions-content">
                        <span class="selected-count">${selectedCheckboxes.length} נבחרו</span>
                        <div class="bulk-actions-buttons">
                            <button class="btn btn-secondary" onclick="app.bulkAddToPopulation()">הוסף לאוכלוסייה</button>
                            <button class="btn btn-secondary" onclick="app.bulkAddToDepartment()">הוסף למחלקה</button>
                            <button class="btn btn-secondary" onclick="app.bulkAddQualification()">הוסף כישור</button>
                        </div>
                    </div>
                `;
                
                const personnelSection = document.getElementById('personnel');
                if (personnelSection) {
                    personnelSection.insertBefore(actionsBar, personnelSection.firstChild);
                }
            } else {
                // Update selected count
                const countSpan = bulkActionsContainer.querySelector('.selected-count');
                if (countSpan) {
                    countSpan.textContent = `${selectedCheckboxes.length} נבחרו`;
                }
            }
        } else if (bulkActionsContainer) {
            bulkActionsContainer.remove();
        }
    }
    
    getSelectedPersonnelIds() {
        const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
        return Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-person-id'));
    }
    
    async bulkAddToPopulation() {
        const selectedIds = this.getSelectedPersonnelIds();
        if (selectedIds.length === 0) return;
        
        // Load populations for selection
        try {
            const populations = await this.apiCall('/populations');
            this.showBulkPopulationModal(selectedIds, populations);
        } catch (error) {
            console.error('Failed to load populations:', error);
        }
    }
    
    showBulkPopulationModal(selectedIds, populations) {
        const content = `
            <form id="bulkPopulationForm">
                <div class="form-group">
                    <label class="form-label">בחר אוכלוסייה</label>
                    <select class="form-select" name="population_id" required>
                        <option value="">בחר אוכלוסייה</option>
                        ${populations.map(pop => `<option value="${pop.id}">${pop.name}</option>`).join('')}
                    </select>
                </div>
                <p class="text-muted">פעולה זו תעדכן את האוכלוסייה עבור ${selectedIds.length} תיקים אישיים נבחרים</p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">עדכן אוכלוסייה</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">ביטול</button>
                </div>
            </form>
        `;
        
        this.showModal('עדכון אוכלוסייה - פעולה קבוצתית', content);
        
        document.getElementById('bulkPopulationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const populationId = formData.get('population_id');
            
            try {
                // Update each selected person
                await Promise.all(selectedIds.map(personId => 
                    this.apiCall(`/personnel/${personId}`, 'PUT', { population_id: populationId })
                ));
                
                this.showToast(`אוכלוסייה עודכנה עבור ${selectedIds.length} תיקים אישיים`, 'success');
                this.closeModal();
                this.loadPersonnelData();
            } catch (error) {
                console.error('Failed to update population:', error);
            }
        });
    }
    
    async bulkAddToDepartment() {
        const selectedIds = this.getSelectedPersonnelIds();
        if (selectedIds.length === 0) return;
        
        try {
            const departments = await this.apiCall('/departments');
            this.showBulkDepartmentModal(selectedIds, departments);
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    }
    
    showBulkDepartmentModal(selectedIds, departments) {
        const content = `
            <form id="bulkDepartmentForm">
                <div class="form-group">
                    <label class="form-label">בחר מחלקה</label>
                    <select class="form-select" name="department_id" required>
                        <option value="">בחר מחלקה</option>
                        ${departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
                    </select>
                </div>
                <p class="text-muted">פעולה זו תעדכן את המחלקה עבור ${selectedIds.length} תיקים אישיים נבחרים</p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">עדכן מחלקה</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">ביטול</button>
                </div>
            </form>
        `;
        
        this.showModal('עדכון מחלקה - פעולה קבוצתית', content);
        
        document.getElementById('bulkDepartmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const departmentId = formData.get('department_id');
            
            try {
                await Promise.all(selectedIds.map(personId => 
                    this.apiCall(`/personnel/${personId}`, 'PUT', { department_id: departmentId })
                ));
                
                this.showToast(`מחלקה עודכנה עבור ${selectedIds.length} תיקים אישיים`, 'success');
                this.closeModal();
                this.loadPersonnelData();
            } catch (error) {
                console.error('Failed to update department:', error);
            }
        });
    }
    
    async bulkAddQualification() {
        const selectedIds = this.getSelectedPersonnelIds();
        if (selectedIds.length === 0) return;
        
        try {
            const skills = await this.apiCall('/skills');
            this.showBulkQualificationModal(selectedIds, skills);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    }
    
    showBulkQualificationModal(selectedIds, skills) {
        const content = `
            <form id="bulkQualificationForm">
                <div class="form-group">
                    <label class="form-label">בחר כישור</label>
                    <select class="form-select" name="skill_id" required>
                        <option value="">בחר כישור</option>
                        ${skills.map(skill => `<option value="${skill.id}">${skill.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">סטטוס</label>
                    <select class="form-select" name="status" required>
                        <option value="מוסמך כשיר">מוסמך כשיר</option>
                        <option value="בתהליך הסמכה">בתהליך הסמכה</option>
                        <option value="נכשל">נכשל</option>
                        <option value="פג תוקף">פג תוקף</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">תאריך התחלת הכשרה</label>
                    <input type="date" class="form-input" name="training_start_date">
                </div>
                <div class="form-group">
                    <label class="form-label">תאריך סיום הכשרה</label>
                    <input type="date" class="form-input" name="training_end_date">
                </div>
                <div class="form-group">
                    <label class="form-label">תאריך פקיעה</label>
                    <input type="date" class="form-input" name="expiry_date">
                </div>
                <div class="form-group">
                    <label class="form-label">הערות</label>
                    <textarea class="form-input" name="notes" rows="3"></textarea>
                </div>
                <p class="text-muted">פעולה זו תוסיף כישור עבור ${selectedIds.length} תיקים אישיים נבחרים</p>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">הוסף כישור</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">ביטול</button>
                </div>
            </form>
        `;
        
        this.showModal('הוספת כישור - פעולה קבוצתית', content);
        
        document.getElementById('bulkQualificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const qualificationData = Object.fromEntries(formData.entries());
            
            try {
                await Promise.all(selectedIds.map(personId => 
                    this.apiCall(`/personnel/${personId}/skills`, 'POST', qualificationData)
                ));
                
                this.showToast(`כישור נוסף עבור ${selectedIds.length} תיקים אישיים`, 'success');
                this.closeModal();
                this.loadPersonnelData();
            } catch (error) {
                console.error('Failed to add qualification:', error);
            }
        });
    }

    // Placeholder methods for CRUD operations
    async editPerson(id) { 
        try {
            const person = await this.apiCall(`/personnel/${id}`);
            this.showPersonnelModal(person);
        } catch (error) {
            console.error('Failed to load person:', error);
            this.showToast('שגיאה בטעינת התיק האישי', 'error');
        }
    }
    
    async deletePerson(id) { 
        if (confirm('האם אתה בטוח שברצונך למחוק תיק אישי זה?')) {
            try {
                await this.apiCall(`/personnel/${id}`, 'DELETE');
                this.showToast('תיק אישי נמחק בהצלחה', 'success');
                this.loadPersonnelData();
            } catch (error) {
                console.error('Failed to delete person:', error);
            }
        }
    }
    
    async viewDepartment(id) {
        try {
            const department = await this.apiCall(`/departments/${id}`);
            this.showDepartmentViewModal(department);
        } catch (error) {
            console.error('Failed to load department:', error);
        }
    }
    
    showDepartmentViewModal(department) {
        const soldiersHtml = department.members && department.members.length > 0 
            ? department.members.map(member => `
                <div class="soldier-item">
                    <span class="soldier-name">${member.full_name}</span>
                    <span class="soldier-rank">${member.rank}</span>
                    <span class="soldier-number">${member.personal_number}</span>
                    ${member.is_commander ? '<span class="commander-badge">מפקד</span>' : ''}
                </div>
            `).join('')
            : '<p class="text-muted">אין חיילים במחלקה</p>';
            
        const content = `
            <div class="department-view">
                <div class="view-section">
                    <h3>פרטי מחלקה</h3>
                    <p><strong>שם מחלקה:</strong> ${department.name}</p>
                    <p><strong>מפקד מחלקה:</strong> ${department.commander_name || 'לא מוגדר'}</p>
                    <p><strong>כמות חברים:</strong> ${department.member_count || 0}</p>
                    ${department.notes ? `<p><strong>הערות:</strong> ${department.notes}</p>` : ''}
                </div>
                <div class="view-section">
                    <h3>חברי המחלקה</h3>
                    <div class="soldiers-list">
                        ${soldiersHtml}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">סגור</button>
                </div>
            </div>
        `;
        
        this.showModal(`צפייה במחלקה: ${department.name}`, content);
    }
    
    showDepartmentEditModal(department, personnel) {
        // Get current department members
        const currentMembers = department.members || [];
        const currentSoldierIds = currentMembers.map(m => m.id);
        
        const content = `
            <form id="departmentEditForm">
                <div class="form-group">
                    <label class="form-label">שם מחלקה *</label>
                    <input type="text" class="form-input" name="name" value="${department.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">מפקד מחלקה *</label>
                    <select class="form-select" name="commanderId" required>
                        <option value="">בחר מפקד</option>
                        ${personnel.map(person => `
                            <option value="${person.id}" ${person.id === department.commander_id ? 'selected' : ''}>
                                ${person.full_name} (${person.rank})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">חברי מחלקה *</label>
                    <div class="personnel-selector">
                        <div class="selected-personnel">
                            <h4>חברים נבחרים:</h4>
                            <div id="selectedPersonnel" class="selected-list">
                                ${currentMembers.map(member => `
                                    <div class="selected-item" data-person-id="${member.id}">
                                        <span>${member.full_name} (${member.rank})</span>
                                        <button type="button" class="remove-btn" onclick="app.removeFromDepartment(${member.id})">×</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="available-personnel">
                            <h4>הוסף חברים:</h4>
                            <select id="personnelToAdd" class="form-select">
                                <option value="">בחר לשהוספה</option>
                                ${personnel.filter(p => !currentSoldierIds.includes(p.id)).map(person => `
                                    <option value="${person.id}">${person.full_name} (${person.rank})</option>
                                `).join('')}
                            </select>
                            <button type="button" class="btn btn-secondary" onclick="app.addToDepartment()">הוסף</button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">הערות</label>
                    <textarea class="form-input" name="notes" rows="3">${department.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">עדכן מחלקה</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">ביטול</button>
                </div>
            </form>
        `;
        
        this.showModal(`עריכת מחלקה: ${department.name}`, content);
        
        // Store current department data for form submission
        this.currentEditingDepartment = { 
            id: department.id, 
            selectedPersonnelIds: currentSoldierIds 
        };
        
        // Setup form handler
        document.getElementById('departmentEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDepartmentSubmit();
        });
    }
    
    addToDepartment() {
        const selectElement = document.getElementById('personnelToAdd');
        const selectedPersonId = selectElement.value;
        const selectedOption = selectElement.selectedOptions[0];
        
        if (!selectedPersonId) return;
        
        // Add to selected list
        const selectedList = document.getElementById('selectedPersonnel');
        const newItem = document.createElement('div');
        newItem.className = 'selected-item';
        newItem.setAttribute('data-person-id', selectedPersonId);
        newItem.innerHTML = `
            <span>${selectedOption.textContent}</span>
            <button type="button" class="remove-btn" onclick="app.removeFromDepartment(${selectedPersonId})">×</button>
        `;
        selectedList.appendChild(newItem);
        
        // Remove from available list
        selectedOption.remove();
        selectElement.value = '';
        
        // Update stored personnel IDs
        if (!this.currentEditingDepartment.selectedPersonnelIds.includes(parseInt(selectedPersonId))) {
            this.currentEditingDepartment.selectedPersonnelIds.push(parseInt(selectedPersonId));
        }
    }
    
    removeFromDepartment(personId) {
        // Remove from selected list
        const selectedItem = document.querySelector(`[data-person-id="${personId}"]`);
        const personName = selectedItem.querySelector('span').textContent;
        selectedItem.remove();
        
        // Add back to available list
        const selectElement = document.getElementById('personnelToAdd');
        const option = document.createElement('option');
        option.value = personId;
        option.textContent = personName;
        selectElement.appendChild(option);
        
        // Update stored personnel IDs
        this.currentEditingDepartment.selectedPersonnelIds = 
            this.currentEditingDepartment.selectedPersonnelIds.filter(id => id !== parseInt(personId));
    }
    
    async handleDepartmentSubmit() {
        const form = document.getElementById('departmentEditForm');
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            commanderId: parseInt(formData.get('commanderId')),
            soldierIds: this.currentEditingDepartment.selectedPersonnelIds,
            notes: formData.get('notes')
        };
        
        try {
            await this.apiCall(`/departments/${this.currentEditingDepartment.id}`, 'PUT', data);
            this.showToast('מחלקה עודכנה בהצלחה', 'success');
            this.closeModal();
            this.loadDepartmentsData();
        } catch (error) {
            console.error('Failed to update department:', error);
            this.showToast('שגיאה בעדכון המחלקה: ' + error.message, 'error');
        }
    }
    
    async editDepartment(id) {
        try {
            const [department, personnel] = await Promise.all([
                this.apiCall(`/departments/${id}`),
                this.apiCall('/personnel')
            ]);
            this.showDepartmentEditModal(department, personnel);
        } catch (error) {
            console.error('Failed to load department for editing:', error);
            this.showToast('שגיאה בטעינת נתוני המחלקה', 'error');
        }
    }
    async deleteDepartment(id) { console.log('Delete department', id); }
    async editPosition(id) { console.log('Edit position', id); }
    async deletePosition(id) { 
        if (confirm('האם אתה בטוח שברצונך למחוק עמדה זו? פעולה זו תמחק גם את כל התפקידנים הקשורים אליה.')) {
            try {
                await this.apiCall(`/positions/${id}`, 'DELETE');
                this.showToast('עמדה נמחקה בהצלחה', 'success');
                this.loadPositionsData();
            } catch (error) {
                console.error('Failed to delete position:', error);
                this.showToast('שגיאה במחיקת העמדה: ' + error.message, 'error');
            }
        }
    }
    async editSkill(id) { console.log('Edit skill', id); }
    async deleteSkill(id) { console.log('Delete skill', id); }
    async editAssignment(id) { console.log('Edit assignment', id); }
    async deleteAssignment(id) { console.log('Delete assignment', id); }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KahadiaApp();
});

// Make some methods globally available for onclick handlers
window.showSection = (section) => window.app?.showSection(section);