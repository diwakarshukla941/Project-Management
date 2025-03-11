// Project data storage
let projects = JSON.parse(localStorage.getItem('projects')) || [];

// DOM Elements
const projectsList = document.getElementById('projectsList');
const addProjectBtn = document.getElementById('addProjectBtn');
const projectModal = document.getElementById('projectModal');
const projectForm = document.getElementById('projectForm');
const cancelBtn = document.getElementById('cancelBtn');
const statusFilter = document.getElementById('statusFilter');
const searchProject = document.getElementById('searchProject');

// Chart initialization
let progressChart;

// Initialize the application
function init() {
    updateDashboardStats();
    renderProjects();
    initializeChart();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    addProjectBtn.addEventListener('click', () => showModal());
    cancelBtn.addEventListener('click', () => hideModal());
    projectForm.addEventListener('submit', handleProjectSubmit);
    statusFilter.addEventListener('change', renderProjects);
    searchProject.addEventListener('input', renderProjects);
}

// Show modal for adding/editing projects
function showModal(projectId = null) {
    projectModal.style.display = 'block';
    if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('modalTitle').textContent = 'Edit Project';
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDescription').value = project.description;
            document.getElementById('projectDeadline').value = project.deadline;
            document.getElementById('projectType').value = project.type;
            projectForm.dataset.editId = projectId;
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Project';
        projectForm.reset();
        delete projectForm.dataset.editId;
    }
}

// Hide modal
function hideModal() {
    projectModal.style.display = 'none';
    projectForm.reset();
}

// Handle project form submission
function handleProjectSubmit(e) {
    e.preventDefault();
    
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        deadline: document.getElementById('projectDeadline').value,
        type: document.getElementById('projectType').value,
        status: 'active',
        progress: 0,
        createdAt: new Date().toISOString()
    };

    if (projectForm.dataset.editId) {
        // Update existing project
        const index = projects.findIndex(p => p.id === projectForm.dataset.editId);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...projectData };
        }
    } else {
        // Add new project
        projectData.id = Date.now().toString();
        projects.push(projectData);
    }

    localStorage.setItem('projects', JSON.stringify(projects));
    hideModal();
    updateDashboardStats();
    renderProjects();
    updateChart();
}

// Render projects list
function renderProjects() {
    const filterValue = statusFilter.value;
    const searchValue = searchProject.value.toLowerCase();

    const filteredProjects = projects.filter(project => {
        const matchesFilter = filterValue === 'all' || project.status === filterValue;
        const matchesSearch = project.name.toLowerCase().includes(searchValue) ||
                            project.description.toLowerCase().includes(searchValue);
        return matchesFilter && matchesSearch;
    });

    projectsList.innerHTML = filteredProjects.map(project => `
        <div class="project-card">
            <h3>${project.name}</h3>
            <div class="description">${project.description}</div>
            <div class="meta">
                <span>${project.type}</span>
                <span>Deadline: ${new Date(project.deadline).toLocaleDateString()}</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${project.progress}%"></div>
            </div>
            <div class="project-actions" style="margin-top: 1rem;">
                <button onclick="updateProgress('${project.id}')" class="btn-secondary">
                    Update Progress
                </button>
                <button onclick="toggleProjectStatus('${project.id}')" class="btn-secondary">
                    ${project.status === 'active' ? 'Mark Complete' : 'Reactivate'}
                </button>
            </div>
        </div>
    `).join('');
}

// Update project progress
window.updateProgress = function(projectId) {
    const progress = prompt('Enter progress percentage (0-100):');
    if (progress !== null && !isNaN(progress) && progress >= 0 && progress <= 100) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.progress = parseInt(progress);
            localStorage.setItem('projects', JSON.stringify(projects));
            renderProjects();
            updateChart();
        }
    }
};

// Toggle project status
window.toggleProjectStatus = function(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.status = project.status === 'active' ? 'completed' : 'active';
        project.progress = project.status === 'completed' ? 100 : project.progress;
        localStorage.setItem('projects', JSON.stringify(projects));
        updateDashboardStats();
        renderProjects();
        updateChart();
    }
};

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('activeProjects').textContent = 
        projects.filter(p => p.status === 'active').length;
    document.getElementById('completedProjects').textContent = 
        projects.filter(p => p.status === 'completed').length;
    document.getElementById('upcomingDeadlines').textContent = 
        projects.filter(p => {
            const deadline = new Date(p.deadline);
            const today = new Date();
            const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && p.status === 'active';
        }).length;
}

// Initialize and update chart
function initializeChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
            datasets: [{
                label: 'Project Progress Distribution',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#3b82f6',
                    '#60a5fa',
                    '#93c5fd',
                    '#bfdbfe'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    updateChart();
}

// Update chart data
function updateChart() {
    const progressRanges = [0, 0, 0, 0];
    projects.forEach(project => {
        if (project.status === 'active') {
            if (project.progress <= 25) progressRanges[0]++;
            else if (project.progress <= 50) progressRanges[1]++;
            else if (project.progress <= 75) progressRanges[2]++;
            else progressRanges[3]++;
        }
    });
    
    progressChart.data.datasets[0].data = progressRanges;
    progressChart.update();
}

// Initialize the application
init();