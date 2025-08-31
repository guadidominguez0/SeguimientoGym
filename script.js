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
let allWeekWorkouts = {};
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

function getCurrentWeekWorkouts() {
    const { monday } = getWeekDates(currentWeekOffset);
    const weekId = getWeekId(monday);
    return allWeekWorkouts[weekId] || [];
}

function setCurrentWeekWorkouts(workouts) {
    const { monday } = getWeekDates(currentWeekOffset);
    const weekId = getWeekId(monday);
    allWeekWorkouts[weekId] = workouts;
}

function isCurrentWeek() {
    return currentWeekOffset === 0;
}

function isEndOfWeek(date) {
    return date.getDay() === 0;
}

// Función modificada: Ahora permite edición en semanas anteriores
function canEditWeek() {
    return true; // Ahora siempre se puede editar
}

// Función modificada: Solo auto-guarda semanas que ya terminaron (domingo pasó)
function autoSaveWeekIfNeeded() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    Object.keys(allWeekWorkouts).forEach(weekId => {
        const weekDate = new Date(weekId);
        const weekSunday = new Date(weekDate);
        weekSunday.setDate(weekDate.getDate() + 6);
        weekSunday.setHours(23, 59, 59, 999); // End of Sunday
        
        // Si el domingo de esa semana ya pasó completamente
        if (weekSunday < today) {
            const existingInHistory = weekHistory.find(w => w.id === weekId);
            if (!existingInHistory && allWeekWorkouts[weekId].length > 0) {
                saveWeekToHistory(weekId);
            } else if (existingInHistory) {
                // Actualizar semana existente si hay cambios
                updateWeekInHistory(weekId);
            }
        }
    });
}

function saveWeekToHistory(weekId) {
    const weekWorkouts = allWeekWorkouts[weekId];
    if (!weekWorkouts || weekWorkouts.length === 0) return;
    
    const weekDate = new Date(weekId);
    const sunday = new Date(weekDate);
    sunday.setDate(weekDate.getDate() + 6);
    
    const weekData = {
        id: weekId,
        startDate: weekDate.toISOString(),
        endDate: sunday.toISOString(),
        workouts: [...weekWorkouts],
        savedAt: new Date().toISOString(),
        totalWorkouts: weekWorkouts.length,
        completedWorkouts: weekWorkouts.filter(w => w.completed).length
    };
    
    const existingIndex = weekHistory.findIndex(w => w.id === weekId);
    
    if (existingIndex >= 0) {
        weekHistory[existingIndex] = weekData;
    } else {
        weekHistory.unshift(weekData);
    }
    
    saveToLocalStorage();
}

// Nueva función: Actualizar semana existente en el historial
function updateWeekInHistory(weekId) {
    const existingIndex = weekHistory.findIndex(w => w.id === weekId);
    if (existingIndex >= 0) {
        const weekWorkouts = allWeekWorkouts[weekId];
        weekHistory[existingIndex].workouts = [...weekWorkouts];
        weekHistory[existingIndex].totalWorkouts = weekWorkouts.length;
        weekHistory[existingIndex].completedWorkouts = weekWorkouts.filter(w => w.completed).length;
        weekHistory[existingIndex].updatedAt = new Date().toISOString();
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('gymTrackerAllWeeks', JSON.stringify(allWeekWorkouts));
    localStorage.setItem('gymTrackerHistory', JSON.stringify(weekHistory));
    localStorage.setItem('gymTrackerWeekOffset', currentWeekOffset.toString());
}

function loadFromLocalStorage() {
    const storedAllWeeks = localStorage.getItem('gymTrackerAllWeeks');
    const storedHistory = localStorage.getItem('gymTrackerHistory');
    const storedOffset = localStorage.getItem('gymTrackerWeekOffset');

    if (storedAllWeeks) {
        allWeekWorkouts = JSON.parse(storedAllWeeks);
    }

    if (storedHistory) {
        weekHistory = JSON.parse(storedHistory);
    }

    if (storedOffset) {
        currentWeekOffset = parseInt(storedOffset);
    }

    const today = new Date();
    document.getElementById('workoutDate').value = today.toISOString().split('T')[0];
    updateDayFromDate();
    
    autoSaveWeekIfNeeded();
}

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
    
    autoSaveWeekIfNeeded();
    updateWeekIndicators();
    saveToLocalStorage();
}

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
        const dateParts = dateInput.value.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        daySelect.value = days[date.getDay()];
        formData.date = dateInput.value;
        formData.day = daySelect.value;
    }
}

function updateDateFromDay() {
    const dateInput = document.getElementById('workoutDate');
    const daySelect = document.getElementById('daySelect');
    
    if (daySelect.value) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const selectedDayIndex = days.indexOf(daySelect.value);
        
        if (selectedDayIndex !== -1) {
            const { monday } = getWeekDates(currentWeekOffset);
            
            const targetDate = new Date(monday);
            targetDate.setDate(monday.getDate() + selectedDayIndex - 1);
            
            if (selectedDayIndex === 0) {
                targetDate.setDate(monday.getDate() + 6);
            }
            
            const formattedDate = targetDate.toISOString().split('T')[0];
            dateInput.value = formattedDate;
            
            formData.date = formattedDate;
            formData.day = daySelect.value;
        }
    }
}

function getDayName(dateString) {
    const dateParts = dateString.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
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

function validateForm() {
    clearErrors();
    let isValid = true;

    if (!formData.date) {
        showError('date', 'Debe seleccionar una fecha');
        isValid = false;
    } else {
        const calculatedDay = getDayName(formData.date);

        if (formData.day && formData.day !== calculatedDay) {
            showError('day', `El día seleccionado no coincide con la fecha. Debería ser ${calculatedDay}`);
            isValid = false;
        } else {
            formData.day = calculatedDay;
        }
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

function saveWorkout() {
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

    let currentWeekWorkouts = getCurrentWeekWorkouts();

    if (isEditing) {
        const index = currentWeekWorkouts.findIndex(w => w.id === isEditing);
        if (index !== -1) {
            currentWeekWorkouts[index] = newWorkout;
        }
        isEditing = null;
    } else {
        currentWeekWorkouts.push(newWorkout);
    }

    setCurrentWeekWorkouts(currentWeekWorkouts);
    
    // Actualizar historial si la semana ya está guardada
    const { monday } = getWeekDates(currentWeekOffset);
    const weekId = getWeekId(monday);
    updateWeekInHistory(weekId);
    
    saveToLocalStorage();
    cancelAdd();
    renderWorkouts();
    updateStats();
}

function editWorkout(id) {
    const currentWeekWorkouts = getCurrentWeekWorkouts();
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
        let currentWeekWorkouts = getCurrentWeekWorkouts();
        currentWeekWorkouts = currentWeekWorkouts.filter(w => w.id !== id);
        setCurrentWeekWorkouts(currentWeekWorkouts);
        
        // Actualizar historial si la semana ya está guardada
        const { monday } = getWeekDates(currentWeekOffset);
        const weekId = getWeekId(monday);
        updateWeekInHistory(weekId);
        
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
    }
}

function toggleCompleted(id) {
    let currentWeekWorkouts = getCurrentWeekWorkouts();
    const workout = currentWeekWorkouts.find(w => w.id === id);
    if (workout) {
        workout.completed = !workout.completed;
        workout.completedAt = workout.completed ? new Date().toISOString() : null;
        setCurrentWeekWorkouts(currentWeekWorkouts);
        
        // Actualizar historial si la semana ya está guardada
        const { monday } = getWeekDates(currentWeekOffset);
        const weekId = getWeekId(monday);
        updateWeekInHistory(weekId);
        
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
        
        // Auto-guardar si se completa un entrenamiento en domingo
        if (workout.completed) {
            const workoutDate = new Date(workout.date);
            if (isEndOfWeek(workoutDate)) {
                saveWeekToHistory(weekId);
            }
        }
    }
}

function cancelAdd() {
    document.getElementById('addFormContent').classList.add('hidden');
    document.getElementById('addFormToggle').style.transform = 'rotate(0deg)';
    
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

function clearCurrentWeek() {
    const currentWeekWorkouts = getCurrentWeekWorkouts();
    if (currentWeekWorkouts.length === 0) {
        alert('No hay entrenamientos para eliminar.');
        return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar todos los entrenamientos de esta semana?')) {
        setCurrentWeekWorkouts([]);
        
        // Actualizar historial si la semana ya está guardada
        const { monday } = getWeekDates(currentWeekOffset);
        const weekId = getWeekId(monday);
        updateWeekInHistory(weekId);
        
        saveToLocalStorage();
        renderWorkouts();
        updateStats();
    }
}

function saveCurrentWeek() {
    const currentWeekWorkouts = getCurrentWeekWorkouts();
    if (currentWeekWorkouts.length === 0) {
        alert('No hay entrenamientos para guardar.');
        return;
    }

    const { monday } = getWeekDates(currentWeekOffset);
    const weekId = getWeekId(monday);
    saveWeekToHistory(weekId);
    alert('Semana guardada en el historial correctamente.');
}

// Función modificada: Ahora permite edición en todas las semanas
function renderWorkouts() {
    const container = document.getElementById('workoutsList');
    const emptyState = document.getElementById('emptyState');
    const currentWeekWorkouts = getCurrentWeekWorkouts();

    if (currentWeekWorkouts.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    const sortedWorkouts = [...currentWeekWorkouts].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    sortedWorkouts.forEach(workout => {
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-card';
        
        // Siempre mostrar checkbox - ahora es editable en todas las semanas
        const checkboxOrStatus = `<input type="checkbox" class="workout-checkbox" ${workout.completed ? 'checked' : ''}>`;
        
        // Siempre mostrar acciones de editar/eliminar
        const actions = `<div class="workout-actions">
            <button class="btn btn-secondary btn-small" onclick="editWorkout(${workout.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteWorkout(${workout.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
        
        // Agregar indicador visual si no es la semana actual
        const weekIndicator = !isCurrentWeek() ? 
            `<div class="week-indicator">
            </div>` : '';
        
        workoutCard.innerHTML = `
            ${weekIndicator}
            <div class="workout-header">
                <div class="workout-info">
                    ${checkboxOrStatus}
                    <div class="workout-details ${workout.completed ? 'completed' : ''}">
                        <h3>${workout.day} - ${formatFullDate(new Date(workout.date))}</h3>
                        <p>${workout.muscleGroup} • ${workout.exercises.length} ejercicios</p>
                    </div>
                </div>
                ${actions}
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

        // Siempre agregar evento de checkbox
        const checkbox = workoutCard.querySelector('.workout-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => toggleCompleted(workout.id));
        }

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
        
        // Indicador de última actualización
        const updateInfo = week.updatedAt ? 
            `Actualizado el ${formatFullDate(new Date(week.updatedAt))}` :
            `Guardado el ${formatFullDate(new Date(week.savedAt))}`;
        
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week-history-item';
        
        weekDiv.innerHTML = `
            <div class="history-header" onclick="toggleHistoryWeek('${week.id}')">
                <div class="history-info">
                    <h3>${formatDate(new Date(week.startDate))} - ${formatDate(new Date(week.endDate))}</h3>
                    <p>${updateInfo}</p>
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
                    <div class="week-summary-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Día</th>
                                    <th>Grupo Muscular</th>
                                    <th>Ejercicios</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${week.workouts.map(workout => `
                                    <tr class="${workout.completed ? 'completed' : 'pending'}">
                                        <td>${workout.day}</td>
                                        <td>${workout.muscleGroup}</td>
                                        <td>${workout.exercises.length}</td>
                                        <td>
                                            <span class="status-badge ${workout.completed ? 'completed' : 'pending'}">
                                                <i class="fas ${workout.completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                                                ${workout.completed ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="exercises-summary">
                        <h4>Detalle de Ejercicios:</h4>
                        ${week.workouts.map(workout => `
                            <div class="workout-summary ${workout.completed ? 'completed' : 'pending'}">
                                <h5>${workout.day} - ${workout.muscleGroup}</h5>
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
                    </div>
                    
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
    if (confirm('¿Estás seguro de que quieres eliminar esta semana del historial? Esto eliminará todos los entrenamientos de esa semana permanentemente.')) {
        // Eliminar del historial
        weekHistory = weekHistory.filter(w => w.id !== weekId);
        
        // Eliminar también de allWeekWorkouts
        delete allWeekWorkouts[weekId];
        
        saveToLocalStorage();
        renderHistory();
        
        // Si estamos viendo esa semana actualmente, actualizar la vista
        const { monday } = getWeekDates(currentWeekOffset);
        const currentWeekId = getWeekId(monday);
        if (currentWeekId === weekId) {
            renderWorkouts();
            updateStats();
        }
    }
}

function updateStats() {
    const currentWeekWorkouts = getCurrentWeekWorkouts();
    const totalDays = currentWeekWorkouts.length;
    const completedDays = currentWeekWorkouts.filter(w => w.completed).length;
    const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
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

// Función actualizada: Ahora indica que todas las semanas son editables
function updateWeekIndicators() {
    const weekIndicator = document.getElementById('weekTypeIndicator');
    const statusIndicator = document.getElementById('weekStatusIndicator');
    const clearBtn = document.getElementById('clearWeekBtn');
    
    if (weekIndicator) {
        if (isCurrentWeek()) {
            weekIndicator.textContent = '(Editable)';
            weekIndicator.style.color = '#10b981';
        } else {
            weekIndicator.textContent = '(Editable - Cambios se sincronizan)';
            weekIndicator.style.color = '#f59e0b';
        }
    }
    
    if (statusIndicator) {
        const { monday } = getWeekDates(currentWeekOffset);
        const weekId = getWeekId(monday);
        const isInHistory = weekHistory.find(w => w.id === weekId);
        
        if (isInHistory && !isCurrentWeek()) {
            statusIndicator.style.display = 'block';
            const indicator = statusIndicator.querySelector('.auto-saved-indicator');
            if (indicator) {
                indicator.innerHTML = `
                    <i class="fas fa-sync-alt"></i>
                    Cambios se sincronizan automáticamente
                `;
            }
        } else {
            statusIndicator.style.display = 'none';
        }
    }
    
    // Permitir limpiar cualquier semana
    if (clearBtn) {
        clearBtn.disabled = false;
        clearBtn.style.opacity = '1';
    }
}

// Event listeners
document.getElementById('workoutDate').addEventListener('change', updateDayFromDate);
document.getElementById('daySelect').addEventListener('change', updateDateFromDay);

// Initialize app
function init() {
    loadFromLocalStorage();
    updateWeekDisplay();
    updateWeekIndicators();
    renderWorkouts();
    updateStats();
    renderExercisesList();
}

// Start the app
init();