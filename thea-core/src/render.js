'use strict';

/**
 * THEA Renderer Wrapper
 * 
 * Expresses the output of the Central Brain, Mathematical Brain, and Atom Router
 * into natural language. No decisions, no reasoning, no synthesis beyond what is routed.
 *
 * @module render
 */

const { inspect } = require('util');

/**
 * @typedef {Object} RenderedOutput
 * @property {string} text - The final natural language response
 * @property {string[]} citations - IDs of atoms, missions, PS resolutions, nudges used
 * @property {number} timestamp - Unix ms when rendered
 * @property {boolean} fromBrain - true if Central Brain routed
 */

/**
 * Render a response from routed intelligence.
 *
 * @param {Object} route - The full routed payload from Central Brain
 * @param {string} route.intelligence - The decided text from CB
 * @param {string[]} [route.atoms=[]] - Atom IDs to cite
 * @param {string[]} [route.missions=[]] - Mission IDs to cite
 * @param {string[]} [route.psResolutions=[]] - PS resolution IDs to cite
 * @param {string[]} [route.nudges=[]] - Nudge IDs to cite
 * @param {Object} [route.mbRoute={}] - Mathematical Brain fog/operator state
 * @returns {RenderedOutput}
 */
function render(route) {
  if (!route || typeof route !== 'object') {
    throw new TypeError('render: route must be a non-null object');
  }

  const intelligence = route.intelligence;
  if (typeof intelligence !== 'string' || intelligence.length === 0) {
    throw new Error('render: route.intelligence must be a non-empty string');
  }

  const citations = [
    ...(route.atoms || []).map(id => `SM-${id}`),
    ...(route.missions || []).map(id => `M-${id}`),
    ...(route.psResolutions || []).map(id => `PS-${id}`),
    ...(route.nudges || []).map(id => `NUDGE-${id}`)
  ];

  // Ensure citations are unique and sorted
  const uniqueCitations = [...new Set(citations)].sort();

  // Build a clean text with inline citation markers if present
  let text = intelligence;

  // If MB route provides fog states or operators, append a technical note (only if present)
  const mb = route.mbRoute || {};
  const mbFog = mb.fogStates || [];
  const mbOps = mb.operators || [];
  if (mbFog.length > 0 || mbOps.length > 0) {
    // No additional text — MB state is metadata, not part of THEA's spoken response
    // But we store it for debugging
  }

  return {
    text,
    citations: uniqueCitations,
    timestamp: Date.now(),
    fromBrain: true
  };
}

/**
 * Render a response from the Atom Router (no CB decision — pure atom match).
 *
 * @param {Object} atomRoute - Atom-matched payload
 * @param {string} atomRoute.intelligence - The matched atom text
 * @param {string[]} [atomRoute.atomIds=[]] - Atom IDs
 * @returns {RenderedOutput}
 */
function renderAtom(atomRoute) {
  if (!atomRoute || typeof atomRoute !== 'object') {
    throw new TypeError('renderAtom: atomRoute must be a non-null object');
  }

  const intelligence = atomRoute.intelligence;
  if (typeof intelligence !== 'string' || intelligence.length === 0) {
    throw new Error('renderAtom: atomRoute.intelligence must be a non-empty string');
  }

  const citations = (atomRoute.atomIds || []).map(id => `SM-${id}`);

  return {
    text: intelligence,
    citations: [...new Set(citations)].sort(),
    timestamp: Date.now(),
    fromBrain: false
  };
}

/**
 * Render a response from a nudge-only route (no CB, no atoms).
 *
 * @param {Object} nudgeRoute
 * @param {string} nudgeRoute.intelligence
 * @param {string[]} [nudgeRoute.nudgeIds=[]]
 * @returns {RenderedOutput}
 */
function renderNudge(nudgeRoute) {
  if (!nudgeRoute || typeof nudgeRoute !== 'object') {
    throw new TypeError('renderNudge: nudgeRoute must be a non-null object');
  }

  const intelligence = nudgeRoute.intelligence;
  if (typeof intelligence !== 'string' || intelligence.length === 0) {
    throw new Error('renderNudge: nudgeRoute.intelligence must be a non-empty string');
  }

  const citations = (nudgeRoute.nudgeIds || []).map(id => `NUDGE-${id}`);

  return {
    text: intelligence,
    citations: [...new Set(citations)].sort(),
    timestamp: Date.now(),
    fromBrain: false
  };
}

/**
 * Render an error response — only when CB explicitly routes an error.
 *
 * @param {Object} errorRoute
 * @param {string} errorRoute.intelligence
 * @param {string} [errorRoute.errorCode='ERR-000']
 * @returns {RenderedOutput}
 */
function renderError(errorRoute) {
  if (!errorRoute || typeof errorRoute !== 'object') {
    throw new TypeError('renderError: errorRoute must be a non-null object');
  }

  const intelligence = errorRoute.intelligence;
  if (typeof intelligence !== 'string' || intelligence.length === 0) {
    throw new Error('renderError: errorRoute.intelligence must be a non-empty string');
  }

  return {
    text: intelligence,
    citations: [errorRoute.errorCode || 'ERR-000'],
    timestamp: Date.now(),
    fromBrain: true
  };
}

module.exports = { render, renderAtom, renderNudge, renderError };