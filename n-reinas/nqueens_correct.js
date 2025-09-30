/**
 * Algoritmo evolutivo (genético) para resolver el problema de las N-Reinas.
 * Cada individuo representa una permutación de tamaño N donde el índice es la columna
 * y el valor es la fila donde se coloca una reina. De esta forma se garantizan
 * cero conflictos por filas y columnas; únicamente se penalizan conflictos diagonales.
 */

class NQueensSolver {
    constructor() {
        this.N = 8;
        this.maxGenerations = 1000;
        this.populationSize = 100;
        this.mutationRate = 0.1;
        this.animationSpeed = 500;

        this.population = [];
        this.fitnessInfo = [];
        this.currentGeneration = 0;
        this.maxFitness = 0;

        this.bestIndividual = [];
        this.bestFitness = 0;
        this.bestConflicts = Infinity;
        this.avgFitness = 0;

        this.isRunning = false;
        this.isStepMode = false;

        this.callbacks = {
            onUpdate: null,
            onComplete: null,
            onLog: null
        };

        this.config = {
            N: this.N,
            maxGenerations: this.maxGenerations,
            populationSize: this.populationSize,
            mutationRate: this.mutationRate,
            animationSpeed: this.animationSpeed
        };
    }

    /**
     * Inicializa el algoritmo con los parámetros proporcionados
     */
    initialize(paramsOrN, maybeMaxGenerations, maybeAnimationSpeed) {
        let config;

        if (typeof paramsOrN === 'object') {
            const params = paramsOrN;
            config = {
                N: params.N ?? this.N,
                maxGenerations: params.maxGenerations ?? params.MAX_ITER ?? this.maxGenerations,
                animationSpeed: params.animationSpeed ?? this.animationSpeed,
                populationSize: params.populationSize ?? this.populationSize,
                mutationRate: params.mutationRate ?? this.mutationRate
            };
        } else {
            config = {
                N: paramsOrN ?? this.N,
                maxGenerations: maybeMaxGenerations ?? this.maxGenerations,
                animationSpeed: maybeAnimationSpeed ?? this.animationSpeed,
                populationSize: this.populationSize,
                mutationRate: this.mutationRate
            };
        }

        this.N = config.N;
        this.maxGenerations = config.maxGenerations;
        this.animationSpeed = config.animationSpeed;
        this.populationSize = config.populationSize;
        this.mutationRate = config.mutationRate;

        this.config = { ...config };

        this.maxFitness = this.calculateMaxFitness(this.N);
        this.currentGeneration = 0;
        this.isRunning = false;
        this.isStepMode = false;

        this.population = this.generateInitialPopulation(this.populationSize, this.N);
        this.evaluatePopulation();
        this.dispatchUpdate();

        this.log(`Inicialización completada -> N=${this.N}, población=${this.populationSize}, mutación=${(this.mutationRate * 100).toFixed(1)}%`);
        this.log(`Fitness máximo posible: ${this.maxFitness}`);
        this.log(`Mejor individuo inicial: [${this.bestIndividual.join(', ')}] (conflictos: ${this.bestConflicts})`);
    }

    /**
     * Genera la población inicial de manera aleatoria
     */
    generateInitialPopulation(populationSize, N) {
        const population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.generateRandomPermutation(N));
        }
        return population;
    }

    /**
     * Genera una permutación aleatoria válida para un tablero de tamaño N
     */
    generateRandomPermutation(N) {
        const permutation = Array.from({ length: N }, (_, idx) => idx);

        for (let i = N - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }

        return permutation;
    }

    /**
     * Calcula el número de pares de reinas en conflicto (solo diagonales)
     */
    calculateConflicts(board) {
        let conflicts = 0;
        const N = board.length;

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (Math.abs(board[i] - board[j]) === Math.abs(i - j)) {
                    conflicts++;
                }
            }
        }

        return conflicts;
    }

    /**
     * Fitness máximo (todas las parejas de reinas no atacándose)
     */
    calculateMaxFitness(N) {
        return (N * (N - 1)) / 2;
    }

    /**
     * Evalúa toda la población y actualiza métricas agregadas
     */
    evaluatePopulation() {
        if (!this.population.length) {
            this.bestIndividual = [];
            this.bestFitness = 0;
            this.bestConflicts = Infinity;
            this.avgFitness = 0;
            return;
        }

        let bestIndex = 0;
        let bestFitness = -Infinity;
        let bestConflicts = Infinity;
        let sumFitness = 0;

        this.fitnessInfo = this.population.map(individual => {
            const conflicts = this.calculateConflicts(individual);
            const fitness = this.maxFitness - conflicts;
            return { fitness, conflicts };
        });

        for (let i = 0; i < this.fitnessInfo.length; i++) {
            const { fitness, conflicts } = this.fitnessInfo[i];
            sumFitness += fitness;

            if (fitness > bestFitness) {
                bestFitness = fitness;
                bestConflicts = conflicts;
                bestIndex = i;
            }
        }

        this.bestIndividual = [...this.population[bestIndex]];
        this.bestFitness = bestFitness;
        this.bestConflicts = bestConflicts;
        this.avgFitness = sumFitness / this.fitnessInfo.length;
    }

    /**
     * Selección por torneo binario
     */
    selectParent() {
        const tournamentSize = Math.min(3, this.population.length);
        let bestCandidateIndex = Math.floor(Math.random() * this.population.length);

        for (let i = 1; i < tournamentSize; i++) {
            const challengerIndex = Math.floor(Math.random() * this.population.length);
            if (this.fitnessInfo[challengerIndex].fitness > this.fitnessInfo[bestCandidateIndex].fitness) {
                bestCandidateIndex = challengerIndex;
            }
        }

        return [...this.population[bestCandidateIndex]];
    }

    /**
     * Order Crossover (OX) para permutaciones
     */
    orderCrossover(parent1, parent2) {
        const length = parent1.length;
        const child = Array(length).fill(null);

        let start = Math.floor(Math.random() * length);
        let end = Math.floor(Math.random() * length);

        if (start === end) {
            end = (start + 1) % length;
        }
        if (start > end) {
            [start, end] = [end, start];
        }

        for (let i = start; i <= end; i++) {
            child[i] = parent1[i];
        }

        let childIndex = (end + 1) % length;
        for (let i = 0; i < length; i++) {
            const candidate = parent2[(end + 1 + i) % length];
            if (!child.includes(candidate)) {
                child[childIndex] = candidate;
                childIndex = (childIndex + 1) % length;
            }
        }

        return child;
    }

    /**
     * Mutación por intercambio de dos columnas
     */
    mutate(individual) {
        if (individual.length < 2) {
            return;
        }

        const idx1 = Math.floor(Math.random() * individual.length);
        let idx2 = Math.floor(Math.random() * individual.length);
        while (idx1 === idx2) {
            idx2 = Math.floor(Math.random() * individual.length);
        }

        [individual[idx1], individual[idx2]] = [individual[idx2], individual[idx1]];
    }

    /**
     * Ejecuta una generación completa (selección, cruce, mutación y evaluación)
     */
    async runGeneration() {
        if (!this.population.length) {
            return false;
        }

        const newPopulation = [];
        newPopulation.push([...this.bestIndividual]);

        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selectParent();
            const parent2 = this.selectParent();
            const child = this.orderCrossover(parent1, parent2);

            if (Math.random() < this.mutationRate) {
                this.mutate(child);
            }

            newPopulation.push(child);
        }

        this.population = newPopulation;
        this.currentGeneration += 1;
        this.evaluatePopulation();

        const solved = this.bestConflicts === 0;
        this.dispatchUpdate();

        if (this.currentGeneration % 10 === 0 || solved) {
            this.log(`Generación ${this.currentGeneration}: fitness=${this.bestFitness.toFixed(2)} (avg=${this.avgFitness.toFixed(2)}), conflictos=${this.bestConflicts}`);
        }

        if (this.animationSpeed > 0 && !this.isStepMode) {
            await this.sleep(this.animationSpeed);
        }

        return solved;
    }

    /**
     * Ejecuta el algoritmo en modo automático
     */
    async solve() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.isStepMode = false;
        this.currentGeneration = 0;

        this.evaluatePopulation();
        this.dispatchUpdate();

        this.log('Ejecución del algoritmo evolutivo iniciada');
        this.log(`Población: ${this.populationSize}, mutación: ${(this.mutationRate * 100).toFixed(1)}%`);

        while (this.isRunning && this.currentGeneration < this.maxGenerations) {
            const solved = await this.runGeneration();
            if (solved) {
                this.isRunning = false;
                this.finish(true);
                return;
            }
        }

        if (!this.isRunning) {
            return;
        }

        if (this.currentGeneration >= this.maxGenerations) {
            this.log(`Máximo de generaciones alcanzado (${this.maxGenerations}).`);
            this.finish(false);
        }
    }

    /**
     * Ejecuta una única generación en modo paso a paso
     */
    async step() {
        if (this.isRunning && !this.isStepMode) {
            return;
        }

        this.isStepMode = true;
        this.isRunning = true;

        const solved = await this.runGeneration();
        this.isRunning = false;

        if (solved) {
            this.finish(true);
        }
    }

    /**
     * Detiene la ejecución en curso
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.isStepMode = false;
        this.log('Ejecución detenida por el usuario');
    }

    /**
     * Reinicia el solver con nuevos individuos aleatorios
     */
    reset() {
        this.stop();
        this.initialize(this.config);
        this.log('Población reiniciada');
    }

    /**
     * Devuelve el mejor tablero conocido
     */
    getBoard() {
        return [...this.bestIndividual];
    }

    /**
     * Conflictos del mejor individuo
     */
    getConflicts() {
        return this.bestConflicts;
    }

    /**
     * Fitness del mejor individuo
     */
    getCurrentFitness() {
        return this.bestFitness;
    }

    /**
     * Iteraciones/generaciones acumuladas
     */
    getIterations() {
        return this.currentGeneration;
    }

    /**
     * Determina si el algoritmo está ejecutándose
     */
    isExecuting() {
        return this.isRunning;
    }

    /**
     * Eficiencia relativa al máximo de generaciones permitido
     */
    getEfficiency() {
        if (!this.maxGenerations) {
            return '-';
        }
        const remaining = Math.max(0, this.maxGenerations - this.currentGeneration);
        return `${((remaining / this.maxGenerations) * 100).toFixed(1)}%`;
    }

    /**
     * Estadísticas en formato amigable para la UI
     */
    getPerformanceStats() {
        return {
            conflicts: this.bestConflicts,
            generations: this.currentGeneration,
            iterations: this.currentGeneration,
            bestFitness: this.bestFitness,
            avgFitness: this.avgFitness,
            mutationRate: this.mutationRate,
            efficiency: this.getEfficiency(),
            solutionFound: this.bestConflicts === 0,
            board: [...this.bestIndividual]
        };
    }

    /**
     * Registra callbacks externos
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Envía una actualización al exterior
     */
    dispatchUpdate() {
        if (!this.callbacks.onUpdate) {
            return;
        }

        this.callbacks.onUpdate({
            board: [...this.bestIndividual],
            conflicts: this.bestConflicts,
            generation: this.currentGeneration,
            fitness: this.bestFitness,
            bestFitness: this.bestFitness,
            avgFitness: this.avgFitness,
            mutationRate: this.mutationRate
        });
    }

    /**
     * Finaliza la ejecución y notifica resultado
     */
    finish(success) {
        this.isRunning = false;
        this.isStepMode = false;
        if (this.callbacks.onComplete) {
            this.callbacks.onComplete(success, this.currentGeneration);
        }
    }

    /**
     * Utilidad para dormir asincrónicamente
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Escribe mensajes en el log externo si existe
     */
    log(message) {
        if (this.callbacks.onLog) {
            this.callbacks.onLog(message);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NQueensSolver;
}
