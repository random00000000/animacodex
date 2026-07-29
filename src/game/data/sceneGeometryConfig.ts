import { sceneDex } from "./scenes";
import type { EncounterZone, SceneDefinition, SceneExit, SceneObstacle } from "../state/types";

export const SCENE_GEOMETRY_CONFIG_URL = "/config/scene-geometry-overrides.json";
export const SCENE_GEOMETRY_SAVE_URL = "/__anima-admin/scene-geometry-overrides";

export interface SceneGeometryConfig {
  version: 1;
  updatedAt?: string;
  scenes: Record<string, SceneGeometryOverride>;
}

export interface SceneGeometryOverride {
  playerSpawn?: SceneDefinition["playerSpawn"];
  obstacles?: SceneObstacle[];
  exits?: SceneExit[];
  encounterZones?: EncounterZone[];
}

export const createSceneGeometryConfig = (): SceneGeometryConfig => {
  const scenes: Record<string, SceneGeometryOverride> = {};
  for (const [sceneId, scene] of Object.entries(sceneDex)) {
    scenes[sceneId] = {
      playerSpawn: { ...scene.playerSpawn },
      obstacles: scene.obstacles.map((obstacle) => ({ ...obstacle })),
      exits: scene.exits.map((exit) => ({ ...exit })),
      encounterZones: scene.encounterZones.map((zone) => ({ ...zone })),
    };
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    scenes,
  };
};

export const applySceneGeometryConfig = (config: SceneGeometryConfig) => {
  if (config.version !== 1) {
    throw new Error(`Unsupported scene geometry config version: ${config.version}`);
  }

  for (const [sceneId, override] of Object.entries(config.scenes)) {
    const scene = sceneDex[sceneId];
    if (!scene) {
      continue;
    }

    if (override.playerSpawn) {
      scene.playerSpawn = { ...override.playerSpawn };
    }

    if (override.obstacles) {
      scene.obstacles = override.obstacles.map((obstacle) => ({ ...obstacle }));
    }

    if (override.exits) {
      scene.exits = override.exits.map((exit) => ({ ...exit }));
    }

    if (override.encounterZones) {
      scene.encounterZones = override.encounterZones.map((zone) => ({ ...zone }));
    }
  }
};

export const loadSceneGeometryConfig = async () => {
  try {
    const response = await fetch(`${SCENE_GEOMETRY_CONFIG_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (response.status === 404) {
      return;
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const config = (await response.json()) as SceneGeometryConfig;
    applySceneGeometryConfig(config);
  } catch (error) {
    console.warn("Scene geometry config was not loaded.", error);
  }
};
