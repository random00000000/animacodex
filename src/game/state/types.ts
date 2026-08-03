export type ElementType =
  | "neutral"
  | "electric"
  | "fire"
  | "grass"
  | "ice"
  | "light"
  | "shadow"
  | "steel"
  | "stone"
  | "water";

export interface MoveDefinition {
  id: string;
  name: string;
  element: ElementType;
  kind: "attack" | "support";
  attackStyle?: "impact" | "focus";
  power: number;
  accuracy: number;
  description: string;
  priority?: number;
  supportEffect?: SupportEffect;
  attackEffects?: AttackFollowUpEffect[];
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: "healing" | "capture" | "battle" | "key";
  description: string;
  battleUse?:
    | {
        type: "heal";
        hp: number;
      }
    | {
        type: "capture";
        captureModifier: number;
      }
    | {
        type: "calm";
        calmModifier: number;
      };
}

export type AttackFollowUpEffect =
  | {
      type: "shatterFocus";
      exposeMultiplier?: number;
    }
  | {
      type: "crackGuard";
      exposeMultiplier?: number;
    }
  | {
      type: "selfGuardOnExposedHit";
      guardMultiplier: number;
    }
  | {
      type: "selfFocusOnHit";
      powerMultiplier: number;
    };

export type SupportEffect =
  | {
      type: "guard";
      target: "self";
      shieldMultiplier: number;
    }
  | {
      type: "focus";
      target: "self";
      powerMultiplier: number;
    }
  | {
      type: "expose";
      target: "foe";
      damageMultiplier: number;
    };

export type BattlefieldEffect =
  | {
      type: "switchGuard";
      guardMultiplier: number;
    }
  | {
      type: "captureCalm";
      captureChanceBonus: number;
      retreatChancePenalty: number;
    }
  | {
      type: "focusSurge";
      attackMultiplier: number;
      focusMultiplierBonus: number;
      element?: ElementType;
    }
  | {
      type: "elementBoost";
      element: ElementType;
      attackMultiplier: number;
    };

export interface BattlefieldCondition {
  id: string;
  name: string;
  summary: string;
  detail: string;
  effect: BattlefieldEffect;
}

export interface LearnsetEntry {
  level: number;
  moveId: string;
}

export interface StatBias {
  hp: number;
  attack: number;
  defense: number;
  focus: number;
  speed: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface FormTransition {
  formId: string;
  name: string;
  requiredLevel: number;
  requiredWinsInElement: ElementType;
  requiredAttunementInElement?: ElementType;
  requiredAttunement?: number;
  newElement: ElementType;
  statBonuses?: Partial<StatBias>;
  awakenMoveId?: string;
}

export type BattleTraitId =
  | "sanctuaryHeart"
  | "rootedShelter"
  | "prismEcho"
  | "cutlineRush"
  | "stillwaterLungs"
  | "ironDefiance";

export interface BattleTraitDefinition {
  id: BattleTraitId;
  name: string;
  summary: string;
}

export interface PendingMoveChoice {
  moveId: string;
  sourceLevel: number;
}

export interface SpeciesDefinition {
  id: string;
  name: string;
  registryName: string;
  element: ElementType;
  wildDisposition?: "steadfast" | "wary" | "flighty";
  battleTrait: BattleTraitDefinition;
  palette: {
    primary: number;
    secondary: number;
    glow: number;
  };
  statBias: StatBias;
  learnset: LearnsetEntry[];
  formTransitions?: FormTransition[];
}

export interface VivoInstance {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  xp: number;
  currentHp: number;
  element: ElementType;
  knownMoveIds: string[];
  formName?: string;
  winsByElement: Partial<Record<ElementType, number>>;
  attunementByElement: Partial<Record<ElementType, number>>;
  habitatStrideByElement: Partial<Record<ElementType, number>>;
  pendingMoveChoices: PendingMoveChoice[];
  rescueMemory?: {
    source: string;
    method: "starter" | "wildCapture" | "scriptedRescue" | "trainerRelease" | "debug";
    note: string;
    bondElement?: ElementType;
    bondAmount?: number;
  };
}

export interface EncounterEntry {
  speciesId: string;
  weight: number;
}

export interface EncounterZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  biome: string;
  attunementElement?: ElementType;
  encounterRate: number;
  stepRange: [number, number];
  levelRange: [number, number];
  encounterTable: EncounterEntry[];
  battlefieldCondition?: BattlefieldCondition;
}

export interface SceneRequirement {
  defeatedTrainerId?: string;
  defeatedTrainerIdsAll?: string[];
  defeatedTrainerIdsAny?: string[];
  badgeCountAtLeast?: number;
  partyFormCountAtLeast?: number;
  usedInteractableIdsAll?: string[];
}

export interface SceneObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  clearsWhen?: SceneRequirement;
}

export interface SceneExit {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetSceneId: string;
  targetX: number;
  targetY: number;
  label: string;
  requirement?: SceneRequirement;
  blockedLabel?: string;
  blockedText?: string;
  adminTestState?: "open" | "closed" | "authored";
}

export interface Interactable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  text: string;
  action?: "manageReserve" | "healParty";
  dialogue?: DialogueLine[];
  requirement?: SceneRequirement;
  attunement?: {
    element: ElementType;
    amount: number;
  };
  recoveryPoint?: {
    label: string;
    spawnX: number;
    spawnY: number;
    healParty?: boolean;
  };
  scriptedEncounter?: ScriptedEncounterDefinition;
}

export interface ScriptedEncounterDefinition {
  speciesId: string;
  level: number;
  formName?: string;
  label: string;
  battleGoals?: BattleGoalDefinition[];
  rescueBond?: {
    element: ElementType;
    amount: number;
    trustPulseBonus?: number;
  };
  rewardText: string;
  rewardDialogue?: DialogueLine[];
  retryText?: string;
  retryDialogue?: DialogueLine[];
  hideAfterResolution?: boolean;
}

export interface BattleRosterEntry {
  speciesId: string;
  level: number;
  nickname?: string;
  formName?: string;
}

export interface TrainerDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  intro: string;
  rewardText: string;
  introDialogue?: DialogueLine[];
  rewardDialogue?: DialogueLine[];
  blockedText?: string;
  blockedDialogue?: DialogueLine[];
  rewardVivo?: TrainerRewardVivo;
  requirement?: SceneRequirement;
  battleRequirement?: SceneRequirement;
  tactics?: TrainerTactics;
  battleGoals?: BattleGoalDefinition[];
  team: BattleRosterEntry[];
}

export interface TrainerTactics {
  style: "steady" | "opportunist" | "adaptive";
  switchOnDisadvantage?: boolean;
  preferredFinisherSpeciesId?: string;
  avoidConsecutiveMove?: boolean;
}

export interface TrainerRewardVivo {
  speciesId: string;
  level: number;
  nickname?: string;
  formName?: string;
  rescueMemorySource?: string;
  rescueBond?: {
    element: ElementType;
    amount: number;
  };
}

export type BattleGoalDefinition =
  | {
      type: "useGuard";
      count: number;
      label: string;
      hint: string;
    }
  | {
      type: "useFocus";
      count: number;
      label: string;
      hint: string;
    }
  | {
      type: "switchParty";
      count: number;
      label: string;
      hint: string;
    }
  | {
      type: "finishExposedTarget";
      count: number;
      label: string;
      hint: string;
    }
  | {
      type: "landAttackStyle";
      attackStyle: "impact" | "focus";
      count: number;
      label: string;
      hint: string;
    }
  | {
      type: "landElementAttack";
      element: ElementType;
      count: number;
      label: string;
      hint: string;
    };

export interface SceneDefinition {
  id: string;
  name: string;
  description: string;
  backgroundArtKey?: string;
  battlefieldCondition?: BattlefieldCondition;
  background: {
    sky: number;
    ground: number;
    accent: number;
    detail: number;
  };
  playerSpawn: {
    x: number;
    y: number;
  };
  obstacles: SceneObstacle[];
  exits: SceneExit[];
  encounterZones: EncounterZone[];
  interactables: Interactable[];
  trainers: TrainerDefinition[];
}

export interface BattleActionResult {
  log: string[];
  finished: boolean;
  winner?: "player" | "enemy";
}

export interface RescueEncounterState {
  interactableId: string;
  speciesId: string;
  level: number;
  formName?: string;
  battleGoals?: BattleGoalDefinition[];
  rescueBond?: {
    element: ElementType;
    amount: number;
    trustPulseBonus?: number;
  };
  rewardText: string;
  rewardDialogue?: DialogueLine[];
  retryText?: string;
  retryDialogue?: DialogueLine[];
  hideAfterResolution?: boolean;
}

export interface TrainerBattleDebriefGoal {
  label: string;
  hint: string;
  current: number;
  target: number;
  complete: boolean;
}

export interface TrainerBattleDebrief {
  trainerId: string;
  trainerName: string;
  sceneName: string;
  result: "full" | "practice" | "defeat";
  battlefieldConditionName?: string;
  summary: string;
  nextStep: string;
  goals: TrainerBattleDebriefGoal[];
}

export interface WildEncounterDebrief {
  sceneName: string;
  zoneName?: string;
  targetName?: string;
  outcome: "capture" | "calmedRetreat" | "wildRetreat" | "wildDefeat" | "partyBreak";
  resultLabel: string;
  summary: string;
  nextStep: string;
  moodLabel: "steady" | "settled" | "spooked" | "scattered";
  moodSummary: string;
  bondNote?: string;
  rescueRead?: string;
  openingNote?: string;
  promiseNote?: string;
}
