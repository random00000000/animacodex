import {
  creaturePortraitByFormName,
  creaturePortraitBySpeciesId,
  creaturePortraitManifest,
  type CreaturePortraitKey,
} from "./assets";
import { moveDex } from "./moves";
import { itemDex } from "./items";
import { sceneDex } from "./scenes";
import { speciesDex } from "./species";
import type { ElementType, FormTransition, MoveDefinition, SpeciesDefinition } from "../state/types";

export interface AdminCreatureAppearance {
  label: string;
  detail: string;
}

export interface AdminCreatureFormAudit {
  name: string;
  element: ElementType;
  portraitUrl?: string;
  artStatus: "ready" | "missing";
  awakenMoveName?: string;
  issues: string[];
}

export interface AdminCreatureAudit {
  speciesId: string;
  name: string;
  registryName: string;
  element: ElementType;
  portraitUrl?: string;
  artStatus: "ready" | "missing";
  moveStatus: "ready" | "review";
  usageStatus: "used" | "unused";
  statusTags: string[];
  trait: string;
  statLine: string;
  learnset: Array<{
    level: number;
    move?: MoveDefinition;
    moveId: string;
  }>;
  forms: AdminCreatureFormAudit[];
  appearances: AdminCreatureAppearance[];
  issues: string[];
  recommendations: string[];
}

export const getAdminItemAudits = () =>
  Object.values(itemDex)
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      status: item.battleUse ? "Battle-ready data" : "Catalog only",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const getPortraitUrl = (portraitKey?: CreaturePortraitKey) =>
  portraitKey ? creaturePortraitManifest[portraitKey] : undefined;

const formatElement = (element: ElementType) =>
  `${element.charAt(0).toUpperCase()}${element.slice(1)}`;

const formatMove = (move?: MoveDefinition) => {
  if (!move) {
    return "Missing move";
  }
  const kind = move.kind === "support" ? "support" : `${move.power} power`;
  return `${move.name} (${formatElement(move.element)} ${kind})`;
};

const getFormAudit = (form: FormTransition): AdminCreatureFormAudit => {
  const portraitUrl = getPortraitUrl(creaturePortraitByFormName[form.name]);
  const awakenMove = form.awakenMoveId ? moveDex[form.awakenMoveId] : undefined;
  const issues: string[] = [];

  if (!portraitUrl) {
    issues.push("Missing form portrait.");
  }
  if (form.awakenMoveId && !awakenMove) {
    issues.push(`Awaken move '${form.awakenMoveId}' is not defined.`);
  }

  return {
    name: form.name,
    element: form.newElement,
    portraitUrl,
    artStatus: portraitUrl ? "ready" : "missing",
    awakenMoveName: awakenMove?.name,
    issues,
  };
};

const getAppearances = (speciesId: string, speciesName: string): AdminCreatureAppearance[] => {
  const appearances: AdminCreatureAppearance[] = [];

  for (const scene of Object.values(sceneDex)) {
    for (const zone of scene.encounterZones) {
      const entry = zone.encounterTable.find((candidate) => candidate.speciesId === speciesId);
      if (entry) {
        appearances.push({
          label: `${scene.name} wild`,
          detail: `${zone.biome}, weight ${entry.weight}, Lv. ${zone.levelRange[0]}-${zone.levelRange[1]}`,
        });
      }
    }

    for (const trainer of scene.trainers) {
      const rosterEntries = trainer.team.filter((entry) => entry.speciesId === speciesId);
      for (const entry of rosterEntries) {
        appearances.push({
          label: `${scene.name} trainer`,
          detail: `${trainer.name}, Lv. ${entry.level}${entry.formName ? ` (${entry.formName})` : ""}`,
        });
      }

      if (trainer.rewardVivo?.speciesId === speciesId) {
        appearances.push({
          label: `${scene.name} reward`,
          detail: `${trainer.name} releases ${trainer.rewardVivo.nickname ?? speciesName}`,
        });
      }
    }

    for (const interactable of scene.interactables) {
      if (interactable.scriptedEncounter?.speciesId === speciesId) {
        appearances.push({
          label: `${scene.name} rescue`,
          detail: `${interactable.label}, Lv. ${interactable.scriptedEncounter.level}`,
        });
      }
    }
  }

  return appearances;
};

const getMoveRecommendations = (species: SpeciesDefinition, learnset: AdminCreatureAudit["learnset"]) => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const knownMoves = learnset.map((entry) => entry.move).filter((move): move is MoveDefinition => Boolean(move));
  const attackMoves = knownMoves.filter((move) => move.kind === "attack");
  const supportMoves = knownMoves.filter((move) => move.kind === "support");
  const nativeAttackMoves = attackMoves.filter((move) => move.element === species.element);
  const bestAttackPower = Math.max(0, ...attackMoves.map((move) => move.power));

  for (const entry of learnset) {
    if (!entry.move) {
      issues.push(`Learnset references missing move '${entry.moveId}'.`);
    }
  }

  if (attackMoves.length === 0) {
    issues.push("No attack moves in learnset.");
    recommendations.push("Add at least one reliable attack before this Vivo appears in battle.");
  }
  if (supportMoves.length === 0) {
    recommendations.push("Consider one support/setup move so this Vivo has a tactical identity beyond damage.");
  }
  if (nativeAttackMoves.length === 0) {
    recommendations.push(`Add a ${formatElement(species.element)} attack so its element matters in battle.`);
  }
  if (bestAttackPower > 0 && bestAttackPower < 15) {
    recommendations.push("Add or unlock a stronger mid-level attack; current damage ceiling may feel flat.");
  }

  return { issues, recommendations };
};

export const buildAdminCreatureAudits = (): AdminCreatureAudit[] =>
  Object.values(speciesDex)
    .map((species) => {
      const portraitUrl = getPortraitUrl(creaturePortraitBySpeciesId[species.id]);
      const learnset = species.learnset.map((entry) => ({
        ...entry,
        move: moveDex[entry.moveId],
      }));
      const forms = species.formTransitions?.map(getFormAudit) ?? [];
      const appearances = getAppearances(species.id, species.name);
      const { issues: moveIssues, recommendations } = getMoveRecommendations(species, learnset);
      const issues = [...moveIssues];

      if (!portraitUrl) {
        issues.push("Missing base portrait.");
      }
      for (const form of forms) {
        issues.push(...form.issues.map((issue) => `${form.name}: ${issue}`));
      }
      if (appearances.length === 0) {
        recommendations.push("Not currently used in encounters, trainers, rescues, or rewards.");
      }

      const artStatus: AdminCreatureAudit["artStatus"] =
        portraitUrl && forms.every((form) => form.artStatus === "ready") ? "ready" : "missing";
      const moveStatus: AdminCreatureAudit["moveStatus"] =
        moveIssues.length === 0 && recommendations.length === 0 ? "ready" : "review";
      const usageStatus: AdminCreatureAudit["usageStatus"] = appearances.length > 0 ? "used" : "unused";
      const statusTags = [
        artStatus === "ready" ? "Art ready" : "Needs art",
        moveStatus === "ready" ? "Moves ready" : "Move review",
        usageStatus === "used" ? "In game" : "Unused",
      ];

      return {
        speciesId: species.id,
        name: species.name,
        registryName: species.registryName,
        element: species.element,
        portraitUrl,
        artStatus,
        moveStatus,
        usageStatus,
        statusTags,
        trait: `${species.battleTrait.name}: ${species.battleTrait.summary}`,
        statLine: `HP ${species.statBias.hp} / Atk ${species.statBias.attack} / Def ${species.statBias.defense} / Focus ${species.statBias.focus} / Speed ${species.statBias.speed}`,
        learnset,
        forms,
        appearances,
        issues,
        recommendations,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

export const describeAdminMove = formatMove;
