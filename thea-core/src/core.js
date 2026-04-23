```javascript
// thea-core/src/core.js
// SDCI Decision Engine - Pure JS, No LLM in Decision Path

class SDCIDecisionEngine {
  constructor(config = {}) {
    this.config = {
      minConfidence: config.minConfidence || 0.7,
      maxLatencyMs: config.maxLatencyMs || 100,
      decisionTimeoutMs: config.decisionTimeoutMs || 5000,
      ...config
    };
    this.decisionCache = new Map();
    this.metrics = { decisions: 0, cacheHits: 0, avgLatency: 0 };
  }

  // Core decision function
  decide(context, options = {}) {
    const startTime = performance.now();
    const cacheKey = this._generateCacheKey(context, options);

    // Check cache
    const cached = this.decisionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 60000) {
      this.metrics.cacheHits++;
      this._updateMetrics(startTime);
      return cached.decision;
    }

    // Decision pipeline
    const decision = this._pipeline(context, options);

    // Validate decision
    if (decision.confidence < this.config.minConfidence) {
      return this._fallbackDecision(context, options);
    }

    // Cache decision
    this.decisionCache.set(cacheKey, {
      decision,
      timestamp: Date.now()
    });

    this.metrics.decisions++;
    this._updateMetrics(startTime);
    return decision;
  }

  // Decision pipeline - pure logic, no LLM
  _pipeline(context, options) {
    const signals = this._extractSignals(context);
    const weightedSignals = this._applyWeights(signals, options.weights || {});
    const score = this._calculateScore(weightedSignals);
    const confidence = this._calculateConfidence(weightedSignals, score);
    const action = this._selectAction(score, confidence, options.thresholds || {});
    
    return {
      action,
      score,
      confidence,
      signals: weightedSignals,
      latency: 0 // Will be updated after pipeline
    };
  }

  // Extract decision signals from context
  _extractSignals(context) {
    const signals = {};
    
    // Signal 1: Priority level
    signals.priority = this._normalizeValue(
      context.priority || 0, 0, 10, 0, 1
    );

    // Signal 2: Urgency
    signals.urgency = this._normalizeValue(
      context.urgency || 0, 0, 100, 0, 1
    );

    // Signal 3: Resource availability
    signals.resources = this._normalizeValue(
      context.availableResources || 0, 0, 100, 0, 1
    );

    // Signal 4: Risk level
    signals.risk = this._normalizeValue(
      context.risk || 0, 0, 10, 0, 1
    );

    // Signal 5: Historical success rate
    signals.history = this._normalizeValue(
      context.historicalSuccess || 0.5, 0, 1, 0, 1
    );

    // Signal 6: Time sensitivity
    signals.timeSensitivity = this._normalizeValue(
      context.deadline ? Math.max(0, 1 - (Date.now() - context.deadline) / 86400000) : 0.5,
      0, 1, 0, 1
    );

    return signals;
  }

  // Apply weights to signals
  _applyWeights(signals, weights) {
    const defaultWeights = {
      priority: 0.25,
      urgency: 0.20,
      resources: 0.15,
      risk: 0.15,
      history: 0.15,
      timeSensitivity: 0.10
    };

    const finalWeights = { ...defaultWeights, ...weights };
    const weighted = {};

    for (const [key, value] of Object.entries(signals)) {
      weighted[key] = value * (finalWeights[key] || 0);
    }

    return weighted;
  }

  // Calculate weighted score
  _calculateScore(weightedSignals) {
    return Object.values(weightedSignals).reduce((sum, val) => sum + val, 0);
  }

  // Calculate confidence based on signal strength and consistency
  _calculateConfidence(weightedSignals, score) {
    const variance = this._calculateVariance(Object.values(weightedSignals));
    const strength = score / Math.max(...Object.values(weightedSignals), 0.01);
    const consistency = 1 - Math.min(variance, 1);
    
    return Math.min(1, Math.max(0, (strength * 0.6 + consistency * 0.4)));
  }

  // Select action based on score and thresholds
  _selectAction(score, confidence, thresholds) {
    const defaultThresholds = {
      high: 0.8,
      medium: 0.5,
      low: 0.2
    };

    const t = { ...defaultThresholds, ...thresholds };

    if (score >= t.high && confidence >= this.config.minConfidence) {
      return 'EXECUTE';
    } else if (score >= t.medium && confidence >= this.config.minConfidence) {
      return 'ANALYZE';
    } else if (score >= t.low) {
      return 'DEFER';
    } else {
      return 'REJECT';
    }
  }

  // Fallback decision when confidence is too low
  _fallbackDecision(context, options) {
    return {
      action: 'DEFER',
      score: 0,
      confidence: 0,
      signals: {},
      latency: 0,
      fallback: true
    };
  }

  // Utility: Normalize value to [0, 1] range
  _normalizeValue(value, min, max, newMin, newMax) {
    if (value < min) value = min;
    if (value > max) value = max;
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
  }

  // Utility: Calculate variance
  _calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  // Generate cache key from context and options
  _generateCacheKey(context, options) {
    const ctxStr = JSON.stringify(context, Object.keys(context).sort());
    const optStr = JSON.stringify(options, Object.keys(options).sort());
    return `${ctxStr}|${optStr}`;
  }

  // Update performance metrics
  _updateMetrics(startTime) {
    const latency = performance.now() - startTime;
    this.metrics.avgLatency = (this.metrics.avgLatency * (this.metrics.decisions - 1) + latency) / this.metrics.decisions;
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Clear decision cache
  clearCache() {
    this.decisionCache.clear();
  }
}

export default SDCIDecisionEngine;
```