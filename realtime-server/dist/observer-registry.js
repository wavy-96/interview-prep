/**
 * Registry for injecting observer insights into active voice sessions.
 * Worker calls register when a session connects; unregisters on disconnect.
 */
const registry = new Map();
export function registerObserverInject(sessionId, inject) {
    registry.set(sessionId, inject);
}
export function unregisterObserverInject(sessionId) {
    registry.delete(sessionId);
}
export function getObserverInject(sessionId) {
    return registry.get(sessionId);
}
