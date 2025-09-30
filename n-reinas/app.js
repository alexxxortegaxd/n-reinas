/**
 * Aplicación principal para la visualización del problema de las N-Reinas
 * Gestiona la interfaz de usuario y coordina el algoritmo evolutivo
 */

class NQueensApp {
    constructor() {
        this.solver = new NQueensSolver();
        this.isAnimating = false;
        this.animationQueue = [];
        this.startTime = 0;

        this.initializeElements();
        this.setupEventListeners();
        this.initializeSolver();
        this.renderBoard();
    }

    /**
     * Inicializa referencias a elementos del DOM
     */
    initializeElements() {
        // Controles
        this.boardSizeInput = document.getElementById('boardSize');
        this.maxIterationsInput = document.getElementById('maxIterations');
        this.populationSizeInput = document.getElementById('populationSize');
        this.mutationRateInput = document.getElementById('mutationRate');
        this.animationSpeedSelect = document.getElementById('animationSpeed');

        // Botones
        this.solveBtn = document.getElementById('solveBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');

        // Tablero
        this.chessboard = document.getElementById('chessboard');

        // Información
        this.statusElement = document.getElementById('status');
        this.conflictsElement = document.getElementById('conflicts');
        this.iterationsElement = document.getElementById('iterations');
        this.fitnessElement = document.getElementById('fitness');
        this.mutationRateDisplayElement = document.getElementById('mutationRateDisplay');

        // Estadísticas
        this.totalTimeElement = document.getElementById('totalTime');
        this.avgTimePerIterElement = document.getElementById('avgTimePerIter');
        this.solutionFoundElement = document.getElementById('solutionFound');
        this.efficiencyElement = document.getElementById('efficiency');
        this.bestFitnessElement = document.getElementById('bestFitness');
        this.avgFitnessElement = document.getElementById('avgFitness');

        // Log
        this.logElement = document.getElementById('log');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        this.solveBtn.addEventListener('click', () => {
            if (this.solver.isExecuting()) {
                this.solver.stop();
                this.updateButtonStates();
            } else {
                this.startSolving();
            }
        });

        this.resetBtn.addEventListener('click', () => {
            this.solver.reset();
            this.updateButtonStates();
            this.clearLog();
            this.updateStats();
        });

        this.stepBtn.addEventListener('click', () => {
            if (this.solver.isExecuting()) {
                this.solver.step();
            } else {
                this.startStepMode();
            }
        });

        const controls = [
            this.boardSizeInput,
            this.maxIterationsInput,
            this.populationSizeInput,
            this.mutationRateInput,
            this.animationSpeedSelect
        ];

        controls.forEach(control => {
            control.addEventListener('change', () => {
                this.updateSolverParameters();
            });
        });
    }

    /**
     * Inicializa el solver con parámetros por defecto
     */
    initializeSolver() {
        this.updateSolverParameters();
        this.solver.setCallbacks({
            onUpdate: (payload) => {
                this.onSolverUpdate(payload);
            },
            onComplete: (success, generations) => {
                this.onSolverComplete(success, generations);
            },
            onLog: (message) => {
                this.addLogEntry(message);
            }
        });
    }

    /**
     * Normaliza y obtiene la tasa de mutación
     */
    getNormalizedMutationRate() {
        let value = parseFloat(this.mutationRateInput.value);
        if (Number.isNaN(value)) {
            value = 0.1;
        }
        value = Math.max(0, Math.min(1, value));
        this.mutationRateInput.value = value;
        return value;
    }

    /**
     * Actualiza el display de la tasa de mutación
     */
    updateMutationDisplay(rate) {
        const percentage = (rate * 100).toFixed(1).replace(/\.0$/, '');
        this.mutationRateDisplayElement.textContent = `${percentage}%`;
    }

    /**
     * Actualiza los parámetros del solver basado en los controles
     */
    updateSolverParameters() {
        const N = parseInt(this.boardSizeInput.value, 10);
        const maxGenerations = parseInt(this.maxIterationsInput.value, 10);
        const animationSpeed = parseInt(this.animationSpeedSelect.value, 10);
        const populationSize = Math.max(10, Math.min(500, parseInt(this.populationSizeInput.value, 10) || 100));
        const mutationRate = this.getNormalizedMutationRate();

        this.populationSizeInput.value = populationSize;
        this.updateMutationDisplay(mutationRate);

        this.solver.initialize({
            N,
            maxGenerations,
            animationSpeed,
            populationSize,
            mutationRate
        });

        this.renderBoard();
        const initialConflicts = this.solver.getConflicts();
        const initialFitness = this.solver.getCurrentFitness();
        this.updateInfo(initialConflicts, 0, initialFitness);
        this.updateStats();
    }

    /**
     * Inicia la resolución automática
     */
    async startSolving() {
        this.startTime = performance.now();
        this.updateButtonStates();
        this.clearLog();
        this.addLogEntry('Iniciando algoritmo evolutivo...');

        await this.solver.solve();
    }

    /**
     * Inicia el modo paso a paso
     */
    startStepMode() {
        this.startTime = performance.now();
        this.updateButtonStates();
        this.clearLog();
        this.addLogEntry('Modo paso a paso activado (algoritmo evolutivo)');

        this.solver.step();
    }

    /**
     * Maneja las actualizaciones del solver
     */
    onSolverUpdate({
        board,
        conflicts,
        generation,
        fitness,
        bestFitness,
        avgFitness,
        mutationRate,
        movedRow = null,
        movedCol = null
    }) {
        this.renderBoard(board, movedRow, movedCol);
        this.updateInfo(conflicts, generation, fitness);
        this.updateStats({
            generations: generation,
            bestFitness,
            avgFitness,
            mutationRate,
            conflicts,
            solutionFound: conflicts === 0,
            efficiency: this.solver.getEfficiency()
        });
    }

    /**
     * Maneja la finalización del solver
     */
    onSolverComplete(success, generations) {
        const endTime = performance.now();
        const totalTime = endTime - this.startTime;

        if (success) {
            this.addLogEntry(`✅ Solución encontrada en ${generations} generaciones`);
            this.addLogEntry(`⏱️ Tiempo total: ${totalTime.toFixed(2)}ms`);
        } else {
            this.addLogEntry(`❌ No se encontró solución en ${generations} generaciones`);
        }

        this.updateButtonStates();
        this.updateStats();
    }

    /**
     * Renderiza el tablero de ajedrez
     */
    renderBoard(X = null, movedRow = null, movedCol = null) {
        const currentX = X || this.solver.getBoard();
        const N = currentX.length;

        if (currentX.length !== N) {
            console.error(`ERROR: Vector X tiene ${currentX.length} elementos, esperaba ${N}`);
            return;
        }

        this.chessboard.innerHTML = '';
        this.chessboard.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
        this.chessboard.style.gridTemplateRows = `repeat(${N}, 1fr)`;

        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if ((row + col) % 2 === 0) {
                    cell.style.backgroundColor = '#f0d9b5';
                } else {
                    cell.style.backgroundColor = '#b58863';
                }

                if (currentX[row] === col) {
                    cell.classList.add('queen');
                    cell.innerHTML = this.createQueenIcon();
                    cell.title = `Reina en fila ${row}, columna ${col}`;
                }

                if (movedRow !== null && movedCol !== null && row === movedRow && col === movedCol) {
                    cell.classList.add('highlight');
                    setTimeout(() => {
                        cell.classList.remove('highlight');
                    }, 1000);
                }

                this.chessboard.appendChild(cell);
            }
        }

        this.highlightConflicts(currentX);
    }

    /**
     * Crea un icono de reina
     */
    createQueenIcon() {
        return `
            <div class="queen-icon">
                <div class="queen-crown">
                    <div class="crown-point"></div>
                    <div class="crown-point"></div>
                    <div class="crown-point"></div>
                </div>
                <div class="queen-body"></div>
            </div>
        `;
    }

    /**
     * Resalta las reinas en conflicto
     */
    highlightConflicts(X) {
        const cells = this.chessboard.querySelectorAll('.cell');
        const N = X.length;

        cells.forEach(cell => cell.classList.remove('conflict'));

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (Math.abs(X[i] - X[j]) === Math.abs(i - j)) {
                    const cell1 = this.chessboard.querySelector(`[data-row="${i}"][data-col="${X[i]}"]`);
                    const cell2 = this.chessboard.querySelector(`[data-row="${j}"][data-col="${X[j]}"]`);

                    if (cell1) cell1.classList.add('conflict');
                    if (cell2) cell2.classList.add('conflict');
                }
            }
        }
    }

    /**
     * Actualiza la información del tablero
     */
    updateInfo(conflicts, generation, fitness) {
        this.conflictsElement.textContent = conflicts;
        this.iterationsElement.textContent = generation;

        if (typeof fitness === 'number') {
            this.fitnessElement.textContent = fitness.toFixed(2);
        } else {
            this.fitnessElement.textContent = '-';
        }

        if (conflicts === 0) {
            this.statusElement.textContent = 'Solución encontrada';
            this.statusElement.style.color = '#28a745';
        } else if (this.solver.isExecuting()) {
            this.statusElement.textContent = 'Evolucionando población...';
            this.statusElement.style.color = '#ffc107';
        } else {
            this.statusElement.textContent = 'Listo';
            this.statusElement.style.color = '#6c757d';
        }
    }

    /**
     * Actualiza las estadísticas
     */
    updateStats(externalStats = null) {
        const stats = externalStats || this.solver.getPerformanceStats();
        const generations = stats.generations ?? stats.iterations ?? 0;
        const conflicts = stats.conflicts ?? this.solver.getConflicts();
        const endTime = performance.now();
        const totalTime = this.startTime > 0 ? endTime - this.startTime : 0;

        this.totalTimeElement.textContent = `${totalTime.toFixed(0)}ms`;
        this.avgTimePerIterElement.textContent = generations > 0 ?
            `${(totalTime / generations).toFixed(1)}ms` : '0ms';
        this.solutionFoundElement.textContent = conflicts === 0 ? 'Sí' : 'No';
        this.efficiencyElement.textContent = stats.efficiency ?? '-';

        if (typeof stats.bestFitness === 'number') {
            this.bestFitnessElement.textContent = stats.bestFitness.toFixed(2);
        } else {
            this.bestFitnessElement.textContent = '-';
        }

        if (typeof stats.avgFitness === 'number') {
            this.avgFitnessElement.textContent = stats.avgFitness.toFixed(2);
        } else {
            this.avgFitnessElement.textContent = '-';
        }

        if (typeof stats.mutationRate === 'number') {
            this.updateMutationDisplay(stats.mutationRate);
        }
    }

    /**
     * Actualiza el estado de los botones
     */
    updateButtonStates() {
        const isExecuting = this.solver.isExecuting();

        if (isExecuting) {
            this.solveBtn.innerHTML = '<i class="fas fa-stop"></i> Detener';
            this.solveBtn.classList.remove('btn-primary');
            this.solveBtn.classList.add('btn-secondary');
            this.stepBtn.disabled = true;
        } else {
            this.solveBtn.innerHTML = '<i class="fas fa-play"></i> Resolver';
            this.solveBtn.classList.remove('btn-secondary');
            this.solveBtn.classList.add('btn-primary');
            this.stepBtn.disabled = false;
        }

        this.resetBtn.disabled = isExecuting;
        this.boardSizeInput.disabled = isExecuting;
        this.maxIterationsInput.disabled = isExecuting;
        this.populationSizeInput.disabled = isExecuting;
        this.mutationRateInput.disabled = isExecuting;
        this.animationSpeedSelect.disabled = isExecuting;
    }

    /**
     * Agrega una entrada al log
     */
    addLogEntry(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${message}`;

        this.logElement.appendChild(logEntry);
        this.logElement.scrollTop = this.logElement.scrollHeight;

        const entries = this.logElement.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    /**
     * Limpia el log
     */
    clearLog() {
        this.logElement.innerHTML = '';
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.addLogEntry('Aplicación inicializada correctamente');
        this.addLogEntry('Algoritmo: Evolutivo (Genético) con selección por torneo');
        this.addLogEntry('Listo para resolver el problema de las N-Reinas');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new NQueensApp();
    app.init();
    window.nQueensApp = app;
});
