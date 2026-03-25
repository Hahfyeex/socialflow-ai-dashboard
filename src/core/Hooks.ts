/**
 * Hooks.ts - Lightweight Plugin System / Event Hook Mechanism
 * 
 * Provides a custom registry for lifecycle events with non-blocking execution.
 * Allows the application to trigger custom logic during lifecycle events.
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

/** Hook payload interface for type-safe event data */
export interface HookPayload<T = unknown> {
  /** Unique identifier for the event instance */
  eventId: string;
  /** Timestamp when the hook was triggered */
  timestamp: number;
  /** The event name/type */
  event: string;
  /** Payload data specific to the event */
  data: T;
  /** Additional metadata about the event */
  metadata?: Record<string, unknown>;
}

/** Plugin interface that can be registered with the hook system */
export interface Plugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Human-readable name */
  name: string;
  /** Plugin version */
  version: string;
  /** Optional description */
  description?: string;
  /** Priority for execution order (lower = earlier) */
  priority?: number;
  /** Lifecycle hooks the plugin responds to */
  hooks: string[];
  /** Handler function for the plugin */
  handler: (payload: HookPayload) => void | Promise<void>;
  /** Optional cleanup function */
  cleanup?: () => void | Promise<void>;
}

/** Registered plugin with metadata */
export interface RegisteredPlugin extends Plugin {
  /** Whether the plugin is currently active */
  isActive: boolean;
  /** When the plugin was registered */
  registeredAt: number;
}

/** Hook event type definitions */
export type HookEventType =
  | 'afterUserCreated'
  | 'afterUserUpdated'
  | 'afterUserDeleted'
  | 'beforePostCreated'
  | 'afterPostCreated'
  | 'afterPostPublished'
  | 'afterPostFailed'
  | 'onAppInitialized'
  | 'onAppShutdown'
  | 'onError'
  | 'onAnalyticsUpdate'
  | 'onSettingsChanged';

// ============================================================================
// Hook System Implementation
// ============================================================================

/**
 * HookRegistry - Custom registry for managing lifecycle events
 * 
 * Features:
 * - Non-blocking execution for non-critical hooks
 * - Easy plugin registration and unregistration
 * - Priority-based execution order
 * - Type-safe event payloads
 */
export class HookRegistry extends EventEmitter {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private eventPlugins: Map<HookEventType, Set<string>> = new Map();
  private static instance: HookRegistry | null = null;

  /**
   * Get singleton instance of HookRegistry
   */
  public static getInstance(): HookRegistry {
    if (!HookRegistry.instance) {
      HookRegistry.instance = new HookRegistry();
    }
    return HookRegistry.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    if (HookRegistry.instance) {
      HookRegistry.instance.removeAllListeners();
      HookRegistry.instance.plugins.clear();
      HookRegistry.instance.eventPlugins.clear();
      HookRegistry.instance = null;
    }
  }

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Register a plugin with the hook system
   * @param plugin The plugin to register
   * @returns The registered plugin with metadata
   */
  public registerPlugin(plugin: Plugin): RegisteredPlugin {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id "${plugin.id}" is already registered`);
    }

    const registeredPlugin: RegisteredPlugin = {
      ...plugin,
      priority: plugin.priority ?? 50,
      isActive: true,
      registeredAt: Date.now(),
    };

    this.plugins.set(plugin.id, registeredPlugin);

    // Register plugin for each hook it listens to
    for (const hookEvent of plugin.hooks) {
      if (!this.eventPlugins.has(hookEvent as HookEventType)) {
        this.eventPlugins.set(hookEvent as HookEventType, new Set());
      }
      this.eventPlugins.get(hookEvent as HookEventType)!.add(plugin.id);
    }

    // Emit event for debugging/logging
    this.emit('pluginRegistered', { pluginId: plugin.id, hooks: plugin.hooks });

    return registeredPlugin;
  }

  /**
   * Unregister a plugin from the hook system
   * @param pluginId The ID of the plugin to unregister
   * @returns True if plugin was found and removed
   */
  public unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    // Run cleanup if available
    if (plugin.cleanup) {
      try {
        const result = plugin.cleanup();
        if (result instanceof Promise) {
          result.catch(err => console.error(`Plugin cleanup error: ${err}`));
        }
      } catch (err) {
        console.error(`Plugin cleanup error: ${err}`);
      }
    }

    // Remove plugin from event mappings
    for (const hookEvent of plugin.hooks) {
      const eventSet = this.eventPlugins.get(hookEvent as HookEventType);
      if (eventSet) {
        eventSet.delete(pluginId);
        if (eventSet.size === 0) {
          this.eventPlugins.delete(hookEvent as HookEventType);
        }
      }
    }

    this.plugins.delete(pluginId);
    this.emit('pluginUnregistered', { pluginId });

    return true;
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  public getPlugin(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if a plugin is registered
   */
  public hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Enable or disable a plugin
   */
  public setPluginActive(pluginId: string, isActive: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }
    plugin.isActive = isActive;
    return true;
  }

  /**
   * Trigger a hook event with non-blocking execution
   * @param event The event type to trigger
   * @param data The data to pass to the hook handlers
   */
  public async emitHook<T = unknown>(
    event: HookEventType,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const payload: HookPayload<T> = {
      eventId: `${event}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      event,
      data,
      metadata,
    };

    const pluginIds = this.eventPlugins.get(event);
    if (!pluginIds || pluginIds.size === 0) {
      return;
    }

    // Get all registered plugins for this event and sort by priority
    const pluginsToExecute = Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is RegisteredPlugin => p !== undefined && p.isActive)
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    // Execute all handlers non-blocking (fire and forget)
    for (const plugin of pluginsToExecute) {
      this.executePluginHandler(plugin, payload).catch(err => {
        console.error(`Plugin "${plugin.id}" handler error:`, err);
        this.emit('pluginError', { pluginId: plugin.id, error: err, payload });
      });
    }
  }

  /**
   * Execute a plugin handler with error handling
   */
  private async executePluginHandler(
    plugin: RegisteredPlugin,
    payload: HookPayload
  ): Promise<void> {
    try {
      const result = plugin.handler(payload);
      if (result instanceof Promise) {
        await result;
      }
    } catch (err) {
      throw err; // Let the caller handle it
    }
  }

  /**
   * Trigger a hook and wait for all handlers to complete
   * Use this when you need to ensure all plugins have completed
   * @param event The event type to trigger
   * @param data The data to pass to the hook handlers
   */
  public async emitHookSync<T = unknown>(
    event: HookEventType,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const payload: HookPayload<T> = {
      eventId: `${event}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      event,
      data,
      metadata,
    };

    const pluginIds = this.eventPlugins.get(event);
    if (!pluginIds || pluginIds.size === 0) {
      return;
    }

    const pluginsToExecute = Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is RegisteredPlugin => p !== undefined && p.isActive)
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    // Execute all handlers and wait for completion
    await Promise.all(
      pluginsToExecute.map(plugin =>
        this.executePluginHandler(plugin, payload).catch(err => {
          console.error(`Plugin "${plugin.id}" handler error:`, err);
          this.emit('pluginError', { pluginId: plugin.id, error: err, payload });
        })
      )
    );
  }

  /**
   * Get list of events a plugin is registered for
   */
  public getPluginEvents(pluginId: string): HookEventType[] {
    const plugin = this.plugins.get(pluginId);
    return plugin ? (plugin.hooks as HookEventType[]) : [];
  }

  /**
   * Get all registered event types
   */
  public getRegisteredEvents(): HookEventType[] {
    return Array.from(this.eventPlugins.keys()) as HookEventType[];
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the global hook registry instance
 */
export const hooks = HookRegistry.getInstance();

/**
 * Register a plugin
 */
export const registerPlugin = (plugin: Plugin): RegisteredPlugin => {
  return hooks.registerPlugin(plugin);
};

/**
 * Unregister a plugin
 */
export const unregisterPlugin = (pluginId: string): boolean => {
  return hooks.unregisterPlugin(pluginId);
};

/**
 * Emit a hook event (non-blocking)
 */
export const emitHook = <T = unknown>(
  event: HookEventType,
  data: T,
  metadata?: Record<string, unknown>
): void => {
  hooks.emitHook(event, data, metadata);
};

/**
 * Emit a hook event and wait for completion
 */
export const emitHookSync = <T = unknown>(
  event: HookEventType,
  data: T,
  metadata?: Record<string, unknown>
): Promise<void> => {
  return hooks.emitHookSync(event, data, metadata);
};

// ============================================================================
// Sample Plugins
// ============================================================================

/**
 * Creates a logging plugin that logs all hook events
 */
export function createLoggingPlugin(): Plugin {
  return {
    id: 'builtin-logger',
    name: 'Built-in Logger',
    version: '1.0.0',
    description: 'Logs all hook events to console for debugging',
    priority: 100, // Run last to log after other plugins
    hooks: [
      'afterUserCreated',
      'afterUserUpdated',
      'afterUserDeleted',
      'beforePostCreated',
      'afterPostCreated',
      'afterPostPublished',
      'afterPostFailed',
      'onAppInitialized',
      'onAppShutdown',
      'onError',
      'onAnalyticsUpdate',
      'onSettingsChanged',
    ],
    handler: (payload: HookPayload) => {
      console.log(`[Hook:${payload.event}]`, {
        eventId: payload.eventId,
        timestamp: new Date(payload.timestamp).toISOString(),
        data: payload.data,
        metadata: payload.metadata,
      });
    },
  };
}

/**
 * Creates a notification plugin that sends notifications for important events
 */
export function createNotificationPlugin(): Plugin {
  return {
    id: 'builtin-notifications',
    name: 'Built-in Notifications',
    version: '1.0.0',
    description: 'Sends notifications for important lifecycle events',
    priority: 90,
    hooks: [
      'afterUserCreated',
      'afterPostPublished',
      'afterPostFailed',
      'onError',
    ],
    handler: (payload: HookPayload) => {
      const messages: Record<string, string> = {
        afterUserCreated: 'New user created successfully',
        afterPostPublished: 'Post published successfully',
        afterPostFailed: 'Post failed to publish',
        onError: 'An error occurred in the application',
      };

      const message = messages[payload.event];
      if (message) {
        // In a real application, this would trigger a toast/notification
        console.log(`[Notification] ${message}:`, payload.data);
      }
    },
  };
}

/**
 * Creates an analytics plugin that tracks events
 */
export function createAnalyticsPlugin(): Plugin {
  const analyticsData: Array<{ event: string; timestamp: number; data: unknown }> = [];

  return {
    id: 'builtin-analytics',
    name: 'Built-in Analytics',
    version: '1.0.0',
    description: 'Tracks analytics data for lifecycle events',
    priority: 10, // Run first to capture all events
    hooks: [
      'afterUserCreated',
      'afterUserUpdated',
      'afterUserDeleted',
      'afterPostCreated',
      'afterPostPublished',
      'afterPostFailed',
      'onAnalyticsUpdate',
    ],
    handler: (payload: HookPayload) => {
      analyticsData.push({
        event: payload.event,
        timestamp: payload.timestamp,
        data: payload.data,
      });
    },
    cleanup: () => {
      console.log('[Analytics] Collected events:', analyticsData.length);
    },
  };
}

// ============================================================================
// Plugin Registration Helper
// ============================================================================

/**
 * Initialize built-in plugins
 */
export function initializeBuiltInPlugins(): void {
  // Register logging plugin
  hooks.registerPlugin(createLoggingPlugin());

  // Register notification plugin
  hooks.registerPlugin(createNotificationPlugin());

  // Register analytics plugin
  hooks.registerPlugin(createAnalyticsPlugin());

  console.log('[Hooks] Built-in plugins initialized');
}

/**
 * Remove all built-in plugins
 */
export function removeBuiltInPlugins(): void {
  hooks.unregisterPlugin('builtin-logger');
  hooks.unregisterPlugin('builtin-notifications');
  hooks.unregisterPlugin('builtin-analytics');
  console.log('[Hooks] Built-in plugins removed');
}

// ============================================================================
// End of Hook System
// ============================================================================
