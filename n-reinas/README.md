# Taller 1 Inteligencia Artificial – Algoritmo Evolutivo para N-Reinas

Esta práctica implementa un algoritmo evolutivo (genético) para resolver el problema clásico de las N-Reinas. La aplicación web permite ajustar parámetros clave, visualizar el tablero en tiempo real y analizar métricas como fitness, tasa de mutación y eficiencia del proceso.

## Parte 1 · Conceptos clave

1. **¿Qué es el problema de las N-Reinas?**
   Colocar N reinas en un tablero de ajedrez de N×N de forma que ninguna se ataque. Las restricciones indispensables son: una reina por fila, una por columna (se logra con representaciones por permutación) y ninguna pareja en la misma diagonal (|X[i] - X[j]| ≠ |i - j|).

2. **Componentes de un algoritmo evolutivo**
   - **Población**: conjunto de soluciones candidatas.
   - **Evaluación**: función de aptitud (fitness) que puntúa cada individuo.
   - **Selección**: operador que elige padres favoreciendo a los de mejor fitness.
   - **Cruzamiento**: recombina la información genética de los padres para generar hijos.
   - **Mutación**: introduce variabilidad aleatoria para explorar el espacio de búsqueda.
   - **Criterio de parada**: solución óptima encontrada o límite de generaciones.

3. **Importancia de la función de aptitud**
   Guía al algoritmo hacia soluciones óptimas. Para N-Reinas se define como el número de pares de reinas que *no* se atacan. Equivalente: `fitness = maxPairs - conflictos`, donde `maxPairs = N(N-1)/2`.

4. **Métodos de selección**
   - **Torneo**: se eligen k individuos al azar y gana el de mayor fitness (usamos k=3).
   - **Ruleta (proporcional)**: la probabilidad de selección es proporcional al fitness relativo de cada individuo.
   El torneo ofrece control fácil sobre la presión selectiva y evita la normalización de fitness.

5. **Mutación en N-Reinas**
   Las representaciones por permutación se benefician de mutaciones tipo *swap* (intercambio de posiciones) o *scramble*. Se eligió **swap** porque mantiene la propiedad de permutación y altera poco la configuración, permitiendo exploración controlada.

6. **Impacto del tamaño de población**
   Poblaciones pequeñas convergen rápido pero pueden quedar atrapadas en óptimos locales. Poblaciones grandes exploran más y suelen requerir menos generaciones, aunque cada generación es más costosa. Hay que balancear diversidad vs. costo computacional.

## Parte 2 · Implementación

### Representación del individuo
Cada solución es un vector `X` de tamaño `N` donde `X[columna] = fila`. Así eliminamos conflictos de filas y columnas y solo evaluamos diagonales.

### Función de aptitud
```javascript
const maxFitness = (N * (N - 1)) / 2;
const conflicts = calculateConflicts(board); // cuenta pares en diagonal
const fitness = maxFitness - conflicts;
```
El máximo fitness (`maxFitness`) corresponde a cero conflictos.

### Operadores evolutivos
- **Inicialización**: población aleatoria mediante permutaciones Fisher-Yates.
- **Seleccion**: torneo binario, favorece a los individuos de mayor aptitud.
- **Cruzamiento**: *Order Crossover (OX)*, que respeta la estructura de permutación.
- **Mutación**: intercambio de dos columnas con probabilidad igual a la tasa indicada.
- **Elitismo**: el mejor individuo pasa directamente a la siguiente generación.

### Flujo del algoritmo
1. Inicializar población y calcular fitness.
2. Repetir hasta solución o alcanzar el número máximo de generaciones:
   - Seleccionar padres y generar hijos (cruce + posible mutación).
   - Evaluar nueva población.
   - Registrar métricas y actualizar la mejor solución global.
3. Reportar éxito (conflictos 0) o fracaso y métricas finales.

### Interfaz y métricas expuestas
- **Parámetros ajustables**: tamaño `N`, número máximo de generaciones, tamaño de población, tasa de mutación, velocidad de animación.
- **Indicadores en vivo**: conflictos, generación actual, fitness del mejor individuo, tasa de mutación efectiva, fitness máximo y promedio, eficiencia (porcentaje de generaciones no utilizadas) y estado final.
- **Log** detallado de eventos clave (inicialización, generación, convergencia).

## Parte 3 · Experimentos y análisis

Los resultados se obtuvieron ejecutando el solver en Node.js (sin animación) 5 veces por configuración.

### 1. Generaciones necesarias para N = 6 y N = 8

| N | Población | Mutación | Éxito | Generaciones promedio |
|---|-----------|----------|-------|------------------------|
| 6 | 50        | 0.10     | 5/5   | 15.2                   |
| 6 | 100       | 0.10     | 5/5   | 1.6                    |
| 6 | 200       | 0.10     | 5/5   | 1.0                    |
| 8 | 50        | 0.10     | 5/5   | 5.2                    |
| 8 | 100       | 0.10     | 5/5   | 1.8                    |
| 8 | 200       | 0.10     | 5/5   | 1.2                    |

**Conclusión:** aumentar el tamaño de población reduce dramáticamente las generaciones necesarias porque se explora más diversidad en paralelo.

### 2. Influencia de la tasa de mutación (N = 8, población 120)

| Mutación | Éxito | Generaciones promedio |
|----------|-------|------------------------|
| 0.05     | 5/5   | 2.2                    |
| 0.10     | 5/5   | 2.8                    |
| 0.20     | 5/5   | 2.6                    |

**Conclusión:** valores muy bajos pueden ralentizar la exploración, pero tasas excesivas añaden ruido. En pruebas la diferencia es leve porque el operador de cruce mantiene buenas soluciones; tasas entre 5% y 15% equilibran explotación y exploración.

### 3. Evolutivo vs. búsqueda aleatoria
La búsqueda aleatoria no reutiliza información: cada intento ignora mejoras previas, lo que provoca un crecimiento exponencial del tiempo. El algoritmo evolutivo mantiene presión selectiva sobre las configuraciones más prometedoras y aprende patrones de tablero, por lo que converge en pocas generaciones.

### 4. Posibles mejoras sin aumentar generaciones
- Ajustar dinámicamente la tasa de mutación según la estagnación.
- Incrementar el elitismo o incorporar reinicios controlados cuando el fitness promedio se estabiliza.
- Paralelizar la evaluación de la población (Web Workers / GPU) para acortar el tiempo real.
- Introducir heurísticas híbridas: por ejemplo, aplicar *local search* a los mejores individuos antes de evaluarlos.

## Puesta en marcha

1. Clonar o descargar el proyecto.
2. Abrir `index.html` directamente en el navegador **o** servirlo con un servidor local:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx http-server
   ```
3. Ajustar parámetros, pulsar "Resolver" y observar la evolución.

## Estructura del proyecto

```
n-reinas/
├── index.html          # Interfaz principal y controles
├── styles.css          # Estilos y diseño
├── app.js              # Lógica de UI y visualización
└── nqueens_correct.js  # Algoritmo evolutivo (solver)
```

---

📌 **Dato clave:** la aplicación ahora muestra en tiempo real el fitness y la tasa de mutación efectivamente usada, permitiendo documentar el taller completo sin modificar la experiencia original.
