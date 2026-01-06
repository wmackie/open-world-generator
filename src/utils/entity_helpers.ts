/**
 * Shared utility functions for working with entities across the engine
 */

/**
 * Safely extracts display name from an entity with flexible name format.
 * Handles both string names (objects) and structured names (NPCs).
 * 
 * @param entity - Any entity with a name property
 * @returns The display name as a string, or "Unknown" if not found
 */
export function getEntityName(entity: any): string {
    if (!entity) return "Unknown";

    // Handle string names (objects, some legacy entities)
    if (typeof entity.name === 'string') {
        return entity.name;
    }

    // Handle structured names (NPCs, players)
    if (entity.name && typeof entity.name === 'object') {
        return entity.name.display || entity.name.first || "Unknown";
    }

    return "Unknown";
}

/**
 * Gets multiple entity names as a comma-separated string
 * 
 * @param entities - Array of entities
 * @returns Comma-separated list of names
 */
export function getEntityNames(entities: any[]): string {
    if (!entities || entities.length === 0) return "None";
    return entities.map(getEntityName).join(", ");
}

/**
 * Type guard to check if an entity has a structured name
 * 
 * @param entity - Entity to check
 * @returns True if entity has structured name format
 */
export function hasStructuredName(entity: any): boolean {
    return entity?.name && typeof entity.name === 'object' && 'display' in entity.name;
}
