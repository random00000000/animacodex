import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const PLAYER_SIZE = 18;
const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const REACHABILITY_CELL = 16;

const source = fs.readFileSync(new URL("../src/game/data/scenes.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2020,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const scriptSource = transpiled.replace(/export const sceneDex =/, "const sceneDex =");

const context = {};
vm.createContext(context);
vm.runInContext(`${scriptSource}\nthis.sceneDex = sceneDex;`, context);

const sceneDex = context.sceneDex;
const configUrl = new URL("../public/config/scene-geometry-overrides.json", import.meta.url);
if (fs.existsSync(configUrl)) {
  const config = JSON.parse(fs.readFileSync(configUrl, "utf8"));
  if (config.version !== 1 || typeof config.scenes !== "object" || config.scenes === null) {
    console.error("Scene geometry config validation failed: unsupported config shape.");
    process.exit(1);
  }

  for (const [sceneId, override] of Object.entries(config.scenes)) {
    const scene = sceneDex[sceneId];
    if (!scene) {
      continue;
    }
    if (override.playerSpawn) scene.playerSpawn = override.playerSpawn;
    if (override.obstacles) scene.obstacles = override.obstacles;
    if (override.exits) scene.exits = override.exits;
    if (override.encounterZones) scene.encounterZones = override.encounterZones;
  }
}
const failures = [];

const collides = (scene, x, y) =>
  scene.obstacles.some(
    (obstacle) =>
      x > obstacle.x - PLAYER_SIZE &&
      x < obstacle.x + obstacle.width + PLAYER_SIZE &&
      y > obstacle.y - PLAYER_SIZE &&
      y < obstacle.y + obstacle.height + PLAYER_SIZE,
  );

const pointInside = (x, y, zone) =>
  x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;

const insideAnyExit = (scene, x, y) => scene.exits.some((exit) => pointInside(x, y, exit));

const isRequirementShaped = (requirement) =>
  !requirement ||
  typeof requirement.defeatedTrainerId === "string" ||
  Array.isArray(requirement.defeatedTrainerIdsAll) ||
  Array.isArray(requirement.defeatedTrainerIdsAny) ||
  typeof requirement.badgeCountAtLeast === "number" ||
  typeof requirement.partyFormCountAtLeast === "number";

const traversable = (scene, x, y) =>
  x >= 20 &&
  x <= GAME_WIDTH - 20 &&
  y >= 20 &&
  y <= GAME_HEIGHT - 20 &&
  (!collides(scene, x, y) || insideAnyExit(scene, x, y));

const gridKey = (gx, gy) => `${gx},${gy}`;

const worldToGrid = (value) =>
  Math.max(0, Math.min(Math.round((value - REACHABILITY_CELL / 2) / REACHABILITY_CELL), 999));

const gridToWorld = (grid) => grid * REACHABILITY_CELL + REACHABILITY_CELL / 2;

const sampleRect = (rect) => {
  const samples = [
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    { x: rect.x + 8, y: rect.y + 8 },
    { x: rect.x + rect.width - 8, y: rect.y + 8 },
    { x: rect.x + 8, y: rect.y + rect.height - 8 },
    { x: rect.x + rect.width - 8, y: rect.y + rect.height - 8 },
  ];
  for (
    let x = Math.ceil(rect.x / REACHABILITY_CELL) * REACHABILITY_CELL + REACHABILITY_CELL / 2;
    x <= rect.x + rect.width;
    x += REACHABILITY_CELL
  ) {
    for (
      let y = Math.ceil(rect.y / REACHABILITY_CELL) * REACHABILITY_CELL + REACHABILITY_CELL / 2;
      y <= rect.y + rect.height;
      y += REACHABILITY_CELL
    ) {
      samples.push({ x, y });
    }
  }
  return samples.filter(
    (sample) =>
      sample.x >= 20 &&
      sample.x <= GAME_WIDTH - 20 &&
      sample.y >= 20 &&
      sample.y <= GAME_HEIGHT - 20,
  );
};

const buildReachableSet = (scene, start) => {
  const startGrid = {
    x: worldToGrid(start.x),
    y: worldToGrid(start.y),
  };
  const queue = [startGrid];
  const reachable = new Set([gridKey(startGrid.x, startGrid.y)]);
  const maxGridX = Math.floor((GAME_WIDTH - REACHABILITY_CELL / 2) / REACHABILITY_CELL);
  const maxGridY = Math.floor((GAME_HEIGHT - REACHABILITY_CELL / 2) / REACHABILITY_CELL);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = {
        x: current.x + dx,
        y: current.y + dy,
      };
      if (next.x < 0 || next.y < 0 || next.x > maxGridX || next.y > maxGridY) {
        continue;
      }
      const key = gridKey(next.x, next.y);
      if (reachable.has(key)) {
        continue;
      }
      if (!traversable(scene, gridToWorld(next.x), gridToWorld(next.y))) {
        continue;
      }
      reachable.add(key);
      queue.push(next);
    }
  }

  return reachable;
};

const reachableContains = (reachable, sample) =>
  reachable.has(gridKey(worldToGrid(sample.x), worldToGrid(sample.y)));

const expandedReachableContains = (reachable, sample, radius = 74) => {
  for (let x = sample.x - radius; x <= sample.x + radius; x += REACHABILITY_CELL) {
    for (let y = sample.y - radius; y <= sample.y + radius; y += REACHABILITY_CELL) {
      if (Math.hypot(x - sample.x, y - sample.y) > radius) {
        continue;
      }
      if (reachableContains(reachable, { x, y })) {
        return true;
      }
    }
  }
  return false;
};

const sceneWithProgressionOpen = (scene) => ({
  ...scene,
  obstacles: scene.obstacles.filter((obstacle) => !obstacle.clearsWhen),
});

const validatePlaytestRouteGraph = () => {
  const startSceneId = "briarTown";
  const reachableSceneIds = new Set([startSceneId]);
  const queue = [startSceneId];

  while (queue.length > 0) {
    const sceneId = queue.shift();
    const scene = sceneDex[sceneId];
    if (!scene) {
      continue;
    }

    for (const exit of scene.exits) {
      if (!sceneDex[exit.targetSceneId] || reachableSceneIds.has(exit.targetSceneId)) {
        continue;
      }
      reachableSceneIds.add(exit.targetSceneId);
      queue.push(exit.targetSceneId);
    }
  }

  for (const sceneId of Object.keys(sceneDex)) {
    if (!reachableSceneIds.has(sceneId)) {
      failures.push(`${sceneId} is not reachable from ${startSceneId} through the authored playtest route graph`);
    }
  }
};

validatePlaytestRouteGraph();

for (const [sceneId, scene] of Object.entries(sceneDex)) {
  if (collides(scene, scene.playerSpawn.x, scene.playerSpawn.y)) {
    failures.push(
      `${sceneId} playerSpawn (${scene.playerSpawn.x}, ${scene.playerSpawn.y}) overlaps collision`,
    );
  }

  const reachable = buildReachableSet(scene, scene.playerSpawn);
  const progressedScene = sceneWithProgressionOpen(scene);
  const progressedReachable = buildReachableSet(progressedScene, scene.playerSpawn);

  for (const exit of scene.exits) {
    const targetScene = sceneDex[exit.targetSceneId];
    if (!targetScene) {
      failures.push(`${sceneId}.${exit.id} targets missing scene ${exit.targetSceneId}`);
      continue;
    }

    if (collides(targetScene, exit.targetX, exit.targetY)) {
      failures.push(
        `${sceneId}.${exit.id} target (${exit.targetX}, ${exit.targetY}) overlaps ${exit.targetSceneId} collision`,
      );
    }

    for (const targetExit of targetScene.exits) {
      if (pointInside(exit.targetX, exit.targetY, targetExit)) {
        failures.push(
          `${sceneId}.${exit.id} target (${exit.targetX}, ${exit.targetY}) arrives inside ${exit.targetSceneId}.${targetExit.id}`,
        );
      }
    }

    if (!sampleRect(exit).some((sample) => reachableContains(reachable, sample))) {
      failures.push(`${sceneId}.${exit.id} has no reachable trigger point from ${sceneId} spawn`);
    }
  }

  for (const zone of scene.encounterZones) {
    if (!sampleRect(zone).some((sample) => reachableContains(reachable, sample))) {
      failures.push(`${sceneId}.${zone.id} encounter zone has no reachable point from ${sceneId} spawn`);
    }
  }

  for (const trainer of scene.trainers) {
    if (!isRequirementShaped(trainer.requirement)) {
      failures.push(`${sceneId}.${trainer.id} has an unsupported trainer visibility requirement shape`);
    }
    if (!isRequirementShaped(trainer.battleRequirement)) {
      failures.push(`${sceneId}.${trainer.id} has an unsupported trainer battle requirement shape`);
    }

    const trainerCenter = {
      x: trainer.x + trainer.width / 2,
      y: trainer.y + trainer.height / 2,
    };
    const reachableForTrainer = trainer.requirement || trainer.battleRequirement ? progressedReachable : reachable;
    if (!expandedReachableContains(reachableForTrainer, trainerCenter)) {
      failures.push(`${sceneId}.${trainer.id} cannot be reached closely enough to start its fight`);
    }
  }
}

if (failures.length > 0) {
  console.error("Scene data validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Scene data validation passed for ${Object.keys(sceneDex).length} scenes.`);
