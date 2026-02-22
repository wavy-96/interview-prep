/**
 * Registry for injecting observer insights into active voice sessions.
 * Worker calls register when a session connects; unregisters on disconnect.
 */

type InjectFn = (insights: string) => void;

const registry = new Map<string, InjectFn>();

export function registerObserverInject(sessionId: string, inject: InjectFn): void {
  registry.set(sessionId, inject);
}

export function unregisterObserverInject(sessionId: string): void {
  registry.delete(sessionId);
}

export function getObserverInject(sessionId: string): InjectFn | undefined {
  return registry.get(sessionId);
}
