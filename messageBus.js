import { EventEmitter } from 'events';

/**
 * Singleton event bus used for simple Pub/Sub communication.
 */
export const bus = new EventEmitter();

/**
 * Publish a payload on the given topic.
 * @param {string} topic
 * @param {any} payload
 */
export function publish(topic, payload) {
    bus.emit(topic, payload);
}

/**
 * Subscribe to a topic with the provided handler.
 * @param {string} topic
 * @param {(payload: any) => void} handler
 */
export function subscribe(topic, handler) {
    bus.on(topic, handler);
}
