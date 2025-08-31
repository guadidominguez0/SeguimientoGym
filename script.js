// Data structures
const muscleGroups = {
    'Pecho y Bíceps': [
        'Banco plano con mancuernas',
        'Curl biceps con barra',
        'Flexiones de brazos',
        'Biceps Hammer',
        'Pec Deck',
        'Banco inclinado con barra',
        'Press de banca', 
        'Aperturas con mancuernas',
        'Curl de bíceps con barra', 
        'Curl de bíceps con mancuernas'
    ],
    'Espalda y Tríceps': [
        'Dorsalera',
        'Remo con barra de pie',
        'Triceps polea con barra recta',
        'Fondos en paralelas',
        'Vuelos laterales',
        'Triceos trasnuca',
        'Remo sentado',
        'Dominadas', 
        'Remo con barra', 
        'Remo con mancuerna',
        'Peso muerto'
    ],
    'Piernas y Hombro': [
        'Peso muerto',
        'Gemelos parado',
        'Sentadilla convencional',
        'Bulgaea con mancuernas',
        'Gemelos sentado',
        'Prensa a 45°',
        'Curl femoral', 
        'Press militar', 
        'Remo al mentón', 
        'Zancadas'
    ],
    'Cardio': [
        'Correr en cinta',
        'Saltar la soga', 
        'Bicicleta estática', 
        'Elíptica', 
        'Remo', 
        'Burpees',
        'Jumping jacks', 
        'Mountain climbers', 
        'HIIT', 
        'Caminar inclinado'
    ]
};

// State
let currentWeekWorkouts = [];
let weekHistory = [];
let currentWeekOffset = 0;
let currentTab = 'current';
let isEditing = null;
let formData = {
    date: '',
    day: '',
    muscleGroup: '',
    exercises: [{ name: '', sets: '', reps: '', weight: '' }]
};

// Utility functions
function getWeekDates(offset = 0) {
    const now = new Date();
    const currentDay = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + 1 + (offset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { monday, sunday };
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long' 
    });
}

function formatFullDate(date) {
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
}

function getWeekId(date) {
    const monday = new Date(date);
    const currentDay = monday.getDay();
    monday.setDate(date.getDate() - currentDay + 1);
    return monday.toISOString().split('T')[0];
}

// Local Storage functions
function saveToLocalStorage() {
    localStorage.setItem('gymTrackerCurrentWeek', JSON.stringify(currentWeekWorkouts));
    localStorage.setItem('gymTrackerHistory', JSON.stringify(weekHistory));
    localStorage.setItem('gymTrackerWeekOffset', currentWeekOffset.toString());
}

function loadFromLocalStorage() {
    const storedCurrent = localStorage.getItem('gymTrackerCurrentWeek');
    const storedHistory = localStorage.getItem('gymTrackerHistory');
    const storedOffset = localStorage.getItem('gymTrackerWeekOffset');

    if (storedCurrent) {
        currentWeekWorkouts = JSON.parse(storedCurrent);
    }

    if (storedHistory) {
        weekHistory = JSON.parse(storedHistory);
    }

    if (storedOffset) {
        currentWeekOffset = parseInt(storedOffset);
    }

    // Set default date
    const today = new Date();
    document.getElementById('workoutDate').value = today.toISOString().split('T')[0];
    updateDayFromDate();
}

// Tab functions
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName === 'current' ? 'currentTab' : 'historyTab').classList.add('active');
    
    currentTab = tabName;
    
    if (tabName === 'history') {
        renderHistory();
    }
}

// Week navigation
function previousWeek() {
    currentWeekOffset--;
    updateWeekDisplay();
    renderWorkouts();
}

function nextWeek() {
    currentWeekOffset++;
    updateWeekDisplay();
    renderWorkouts();
}

function goToCurrentWeek() {
    currentWeekOffset = 0;
    updateWeekDisplay();
    renderWorkouts();
}

function updateWeekDisplay() {
    const { monday, sunday } = getWeekDates(currentWeekOffset);
    const title = currentWeekOffset === 0 ? 'Semana Actual' : 
                 currentWeekOffset < 0 ? `Hace ${Math.abs(currentWeekOffset)} semana${Math.abs(currentWeekOffset) > 1 ? 's' : ''}` :
                 `En ${currentWeekOffset} semana${currentWeekOffset > 1 ? 's' : ''}`;
    
    document.getElementById('currentWeekTitle').textContent = title;
    document.getElementById('currentWeekDates').textContent = 
        `${formatDate(monday)} - ${formatDate(sunday)}`;
    
    saveToLocalStorage();
}

// Form functions
function toggleAddForm() {
    const content = document.getElementById('addFormContent');
    const icon = document.getElementById('addFormToggle');
    
    content.classList.toggle('hidden');
    icon.style.transform = content.classList.contains('hidden') ? 
        'rotate(0deg)' : 'rotate(180deg)';
}

function updateDayFromDate() {
    const dateInput = document.getElementById('workoutDate');
    const daySelect = document.getElementById('daySelect');
    
    if (dateInput.value) {
        const date = new Date(dateInput.value);
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        daySelect.value = days[date.getDay()];
        formData.date = dateInput.value;
        formData.day = daySelect.value;
    }
}

function updateExerciseOptions() {
    formData.muscleGroup = document.getElementById('muscleGroupSelect').value;
    renderExercisesList();
}

function addExercise() {
    formData.exercises.push({ name: '', sets: '', reps: '', weight: '' });
    renderExercisesList();
}

function removeExercise(index) {
    if (formData.exercises.length > 1) {
        formData.exercises.splice(index, 1);
        renderExercisesList();
    }
}

function updateExercise(index, field, value) {
    formData.exercises[index][field] = value;
}

function renderExercisesList() {
    const container = document.getElementById('exercisesList');
    container.innerHTML = '';

    formData.exercises.forEach((exercise, index) => {
        const exerciseDiv = document.createElement('div');
        exerciseDiv.className = 'exercise-form-item';
        
        exerciseDiv.innerHTML = `
            <div class="exercise-form-grid">
                <div class="form-group">
                    <select class="form-select" onchange="updateExercise(${index}, 'name', this.value)">
                        <option value="">Seleccionar ejercicio</option>
                        ${formData.muscleGroup && muscleGroups[formData.muscleGroup] 
                            ? muscleGroups[formData.muscleGroup].map(ex => 
                                `<option value="${ex}" ${ex === exercise.name ? 'selected' : ''}>${ex}</option>`
                            ).join('')
                            : ''
                        }
                    </select>
                </div>
                <div class="form-group">
                    <input type="number" min="1" placeholder="Series" value="${exercise.sets}" 
                           class="form-input" onchange="updateExercise(${index}, 'sets', this.value)">
                </div>
                <div class="form-group">
                    <input type="number" min="1" placeholder="Reps" value="${exercise.reps}" 
                           class="form-input" onchange="updateExercise(${index}, 'reps', this.value)">
                </div>
                <div class="form-group">
                    <input type="text" placeholder="Peso (ej: 50kg)" value="${exercise.weight}" 
                           class="form-input" onchange="updateExercise(${index}, 'weight', this.value)">
                </div>
                <div>
                    ${formData.exercises.length > 1 ? 
                        `<button type="button" class="btn btn-danger btn-icon" onclick="removeExercise(${index})">
                            <i class="fas fa-trash"></i>
                        </button>` : ''
                    }
                </div>
            </div>
        `;

        container.appendChild(exerciseDiv);
    });
}

// Validation
function validateForm() {
    clearErrors();
    let isValid = true;

    if (!formData.date) {
        showError('date', 'Debe seleccionar una fecha');
        isValid = false;
    }

    if (!formData.day) {
        showError('day', 'Debe seleccionar un día');
        isValid = false;
    }

    if (!formData.muscleGroup) {
        showError('muscleGroup', 'Debe seleccionar un grupo muscular');
        isValid = false;
    }

    if (formData.exercises.length === 0 || !formData.exercises.some(ex => ex.name)) {
        showError('exercises', 'Debe agregar al menos un ejercicio');
        isValid = false;
    }

    return isValid;
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
        el.classList.remove('error');
    });
}

function showError(field, message) {
    const errorEl = document.getElementById(field + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

// CRUD operations
function saveWorkout() {
    // Update form data from inputs
    formData.date = document.getElementById('workoutDate').value;
    formData.day = document.getElementById('daySelect').value;
    formData.muscleGroup = document.getElementById('muscleGroupSelect').value;

    if (!validateForm()) return;

    const newWorkout = {
        id: isEditing || Date.now(),
        ...formData,
        exercises: formData.exercises.filter(ex => ex.name && ex.sets && ex.reps && ex.weight),
        completed: false,
        createdAt: new Date().toISOString()
    };

    if (isEditing) {
        const index = currentWeekWorkouts.findIndex(w => w.id === isEditing);
        if (index !== -1) {
            currentWeekWorkouts[index] = newWorkout;
        }
        isEditing = null;
    } else {
        currentWeekWorkouts.push(newWorkout);
    }

    saveToLocalStorage();
    cancelAdd();
    renderWorkouts();
    updateStats();
}

function editWorkout(id) {
    const workout = currentWeekWorkouts.find(w => w.id === id);
    if (workout) {
        isEditing = id;
        formData = { ...workout };
        
        document.getElementById('workoutDate').value = workout.date;
        document.getElementById('daySelect').value = workout.day;
        document.getElementById('muscleGroupSelect').value = workout.muscleGroup;
        
        renderExercisesList();
        
        if (document.getElementById('addFormContent').classList.contains('hidden')) {
            toggleAddForm();
        }
    }
}

function deleteWorkout(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
        currentWeekWorkouts = currentWeekWorkouts.filter(w => w.id !== id);
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
    }
}

function toggleCompleted(id) {
    const workout = currentWeekWorkouts.find(w => w.id === id);
    if (workout) {
        workout.completed = !workout.completed;
        workout.completedAt = workout.completed ? new Date().toISOString() : null;
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
    }
}

function cancelAdd() {
    document.getElementById('addFormContent').classList.add('hidden');
    document.getElementById('addFormToggle').style.transform = 'rotate(0deg)';
    
    // Reset form
    isEditing = null;
    formData = {
        date: document.getElementById('workoutDate').value,
        day: '',
        muscleGroup: '',
        exercises: [{ name: '', sets: '', reps: '', weight: '' }]
    };
    
    document.getElementById('daySelect').value = '';
    document.getElementById('muscleGroupSelect').value = '';
    renderExercisesList();
    clearErrors();
}

// Week management
function createTemplateWeek() {
    if (currentWeekWorkouts.length > 0) {
        if (!confirm('Ya tienes entrenamientos en esta semana. ¿Quieres reemplazarlos?')) {
            return;
        }
    }

    const { monday } = getWeekDates(currentWeekOffset);
    const templateWorkouts = [
        {
            id: Date.now() + 1,
            date: new Date(monday.getTime()).toISOString().split('T')[0],
            day: 'Lunes',
            muscleGroup: 'Pecho y Bíceps',
            exercises: [
                { name: 'Press de banca', sets: '4', reps: '8', weight: '80kg' },
                { name: 'Press inclinado', sets: '3', reps: '10', weight: '70kg' },
                { name: 'Curl de bíceps con barra', sets: '3', reps: '12', weight: '25kg' }
            ],
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            date: new Date(monday.getTime() + 86400000).toISOString().split('T')[0],
            day: 'Martes',
            muscleGroup: 'Espalda y Tríceps',
            exercises: [
                { name: 'Dominadas', sets: '4', reps: '6', weight: 'Peso corporal' },
                { name: 'Remo con barra', sets: '4', reps: '8', weight: '75kg' },
                { name: 'Extensiones de tríceps', sets: '3', reps: '12', weight: '20kg' }
            ],
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            date: new Date(monday.getTime() + 3 * 86400000).toISOString().split('T')[0],
            day: 'Jueves',
            muscleGroup: 'Piernas y Hombro',
            exercises: [
                { name: 'Sentadillas', sets: '4', reps: '10', weight: '100kg' },
                { name: 'Press militar', sets: '4', reps: '8', weight: '50kg' },
                { name: 'Elevaciones laterales', sets: '3', reps: '12', weight: '10kg' }
            ],
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];

    currentWeekWorkouts = templateWorkouts;
    saveToLocalStorage();
    renderWorkouts();
    updateStats();
}

function clearCurrentWeek() {
    if (currentWeekWorkouts.length === 0) {
        alert('No hay entrenamientos para eliminar.');
        return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar todos los entrenamientos de esta semana?')) {
        currentWeekWorkouts = [];
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
    }
}

function saveCurrentWeek() {
    if (currentWeekWorkouts.length === 0) {
        alert('No hay entrenamientos para guardar.');
        return;
    }

    const { monday, sunday } = getWeekDates(currentWeekOffset);
    const weekId = getWeekId(monday);
    
    // Check if week already exists in history
    const existingIndex = weekHistory.findIndex(w => w.id === weekId);
    
    const weekData = {
        id: weekId,
        startDate: monday.toISOString(),
        endDate: sunday.toISOString(),
        workouts: [...currentWeekWorkouts],
        savedAt: new Date().toISOString(),
        totalWorkouts: currentWeekWorkouts.length,
        completedWorkouts: currentWeekWorkouts.filter(w => w.completed).length
    };

    if (existingIndex >= 0) {
        if (confirm('Esta semana ya está guardada en el historial. ¿Quieres actualizarla?')) {
            weekHistory[existingIndex] = weekData;
        } else {
            return;
        }
    } else {
        weekHistory.unshift(weekData);
    }

    saveToLocalStorage();
    alert('Semana guardada en el historial correctamente.');
}

// Render functions
function renderWorkouts() {
    const container = document.getElementById('workoutsList');
    const emptyState = document.getElementById('emptyState');

    if (currentWeekWorkouts.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    // Sort workouts by date
    const sortedWorkouts = [...currentWeekWorkouts].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    sortedWorkouts.forEach(workout => {
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-card';
        
        workoutCard.innerHTML = `
            <div class="workout-header">
                <div class="workout-info">
                    <input type="checkbox" class="workout-checkbox" ${workout.completed ? 'checked' : ''}>
                    <div class="workout-details ${workout.completed ? 'completed' : ''}">
                        <h3>${workout.day} - ${formatFullDate(new Date(workout.date))}</h3>
                        <p>${workout.muscleGroup} • ${workout.exercises.length} ejercicios</p>
                    </div>
                </div>
                <div class="workout-actions">
                    <button class="btn btn-secondary btn-small" onclick="editWorkout(${workout.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteWorkout(${workout.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="exercises-grid">
                ${workout.exercises.map(exercise => `
                    <div class="exercise-item">
                        <div class="exercise-details">
                            <div class="exercise-detail">
                                <span>Ejercicio</span>
                                <p>${exercise.name}</p>
                            </div>
                            <div class="exercise-detail">
                                <span>Series</span>
                                <p>${exercise.sets}</p>
                            </div>
                            <div class="exercise-detail">
                                <span>Reps</span>
                                <p>${exercise.reps}</p>
                            </div>
                            <div class="exercise-detail">
                                <span>Peso</span>
                                <p>${exercise.weight}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const checkbox = workoutCard.querySelector('.workout-checkbox');
        checkbox.addEventListener('change', () => toggleCompleted(workout.id));

        container.appendChild(workoutCard);
    });
}

function renderHistory() {
    const container = document.getElementById('weekHistory');
    const emptyState = document.getElementById('historyEmptyState');

    if (weekHistory.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = '';

    weekHistory.forEach(week => {
        const progressPercentage = week.totalWorkouts > 0 ? 
            Math.round((week.completedWorkouts / week.totalWorkouts) * 100) : 0;
        
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week-history-item';
        
        weekDiv.innerHTML = `
            <div class="history-header" onclick="toggleHistoryWeek('${week.id}')">
                <div class="history-info">
                    <h3>${formatDate(new Date(week.startDate))} - ${formatDate(new Date(week.endDate))}</h3>
                    <p>Guardado el ${formatFullDate(new Date(week.savedAt))}</p>
                </div>
                <div class="history-stats">
                    <div style="text-align: center; margin-right: 1rem;">
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem;">
                            ${week.completedWorkouts}/${week.totalWorkouts}
                        </div>
                        <div style="font-size: 1.2rem; font-weight: 600;">
                            ${progressPercentage}%
                        </div>
                    </div>
                    <div class="progress-ring">
                        <svg width="48" height="48">
                            <circle class="bg" cx="24" cy="24" r="20"></circle>
                            <circle class="progress" cx="24" cy="24" r="20" 
                                    stroke-dasharray="${progressPercentage * 1.256} 125.6"></circle>
                        </svg>
                        <div class="progress-text">${progressPercentage}%</div>
                    </div>
                </div>
            </div>
            <div class="history-content" id="history-${week.id}">
                <div style="padding: 2rem;">
                    ${week.workouts.map(workout => `
                        <div class="exercise-item" style="margin-bottom: 1rem;">
                            <h4 style="margin-bottom: 0.5rem; color: ${workout.completed ? '#10b981' : '#e2e8f0'};">
                                ${workout.day} - ${workout.muscleGroup}
                                ${workout.completed ? '<i class="fas fa-check-circle" style="color: #10b981; margin-left: 0.5rem;"></i>' : ''}
                            </h4>
                            <div class="exercise-details">
                                ${workout.exercises.map(exercise => `
                                    <div class="exercise-detail">
                                        <span>${exercise.name}</span>
                                        <p>${exercise.sets}x${exercise.reps} - ${exercise.weight}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(71, 85, 105, 0.3);">
                        <button class="btn btn-danger btn-small" onclick="deleteWeekFromHistory('${week.id}')">
                            <i class="fas fa-trash"></i> Eliminar del Historial
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(weekDiv);
    });
}

function toggleHistoryWeek(weekId) {
    const content = document.getElementById(`history-${weekId}`);
    content.classList.toggle('expanded');
}

function deleteWeekFromHistory(weekId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta semana del historial?')) {
        weekHistory = weekHistory.filter(w => w.id !== weekId);
        saveToLocalStorage();
        renderHistory();
    }
}

function updateStats() {
    const totalDays = currentWeekWorkouts.length;
    const completedDays = currentWeekWorkouts.filter(w => w.completed).length;
    const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    // Calculate current streak
    const sortedHistory = [...weekHistory].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    let streak = 0;
    
    for (const week of sortedHistory) {
        if (week.completedWorkouts === week.totalWorkouts && week.totalWorkouts > 0) {
            streak++;
        } else {
            break;
        }
    }

    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('completedDays').textContent = completedDays;
    document.getElementById('progressPercentage').textContent = progress + '%';
    document.getElementById('currentStreak').textContent = streak;
}

// Event listeners
document.getElementById('workoutDate').addEventListener('change', updateDayFromDate);

// Initialize app
function init() {
    loadFromLocalStorage();
    updateWeekDisplay();
    renderWorkouts();
    updateStats();
    renderExercisesList();
}

// Start the app
init();