/**
 * The pipeline DAG, expressed as ordered waves.
 *
 * A wave is a set of steps with no dependency on each other, so every step in a
 * wave runs in parallel. The runner executes one wave per invocation and
 * persists after it, which is the resume granularity.
 *
 * Wave boundaries are inherited from axionia-app rather than recomputed —
 * profile feeds wave 2, and the original code sequenced 1a before 1b even
 * though both only need `validate`. Preserved so output stays comparable;
 * merging them would be a latency win and a behaviour change at once.
 */

import type { StepId, StepStates } from "./types";
import {
  runBenefitDesign,
  runBenefits,
  runFinancial,
  runLinkedin,
  runProfile,
  runRegulatory,
  runScoring,
  runSynthesis,
  runValidate,
  runWorkforce,
  type StepContext,
} from "./steps";

export const PIPELINE_VERSION = "4.0";

export interface StepDefinition {
  id: StepId;
  /** Shown in the admin progress UI. */
  label: string;
  emoji: string;
  dependsOn: StepId[];
  /** Rough model calls, for progress estimation. 0 = derived locally. */
  modelCalls: number;
  /**
   * When true, a failure degrades the report rather than failing the job.
   * The step is marked 'skipped' and downstream steps handle the absence.
   */
  optional: boolean;
  run(ctx: StepContext): Promise<unknown> | unknown;
}

export const STEPS: readonly StepDefinition[] = [
  {
    id: "validate",
    label: "Validate",
    emoji: "✅",
    dependsOn: [],
    modelCalls: 1,
    optional: false,
    run: runValidate,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    emoji: "🔗",
    dependsOn: ["validate"],
    modelCalls: 1,
    // Leadership/ownership intel is the most hallucination-prone step — wrong
    // CEO names in a pitch about rigour are self-defeating. Better to ship the
    // report without it than to fail the run or invent names.
    optional: true,
    run: runLinkedin,
  },
  {
    id: "profile",
    label: "Profile",
    emoji: "🏢",
    dependsOn: ["validate"],
    modelCalls: 1,
    // Everything in wave 2 reads profile. Not optional.
    optional: false,
    run: runProfile,
  },
  {
    id: "benefits",
    label: "Benefits",
    emoji: "🩺",
    dependsOn: ["validate"],
    modelCalls: 1,
    optional: false,
    run: runBenefits,
  },
  {
    id: "financial",
    label: "Financial",
    emoji: "📊",
    dependsOn: ["validate"],
    modelCalls: 1,
    optional: false,
    run: runFinancial,
  },
  {
    id: "regulatory",
    label: "Regulatory",
    emoji: "⚖️",
    dependsOn: ["profile", "financial"],
    modelCalls: 2,
    optional: true,
    run: runRegulatory,
  },
  {
    id: "workforce",
    label: "Workforce",
    emoji: "👥",
    dependsOn: ["profile"],
    modelCalls: 1,
    optional: false,
    run: runWorkforce,
  },
  {
    id: "benefitdesign",
    label: "Benefit Design",
    emoji: "💊",
    dependsOn: ["validate", "workforce"],
    modelCalls: 0,
    optional: false,
    run: runBenefitDesign,
  },
  {
    id: "scoring",
    label: "Scoring",
    emoji: "🕸",
    dependsOn: ["profile", "benefits", "financial", "regulatory", "workforce"],
    modelCalls: 1,
    optional: false,
    run: runScoring,
  },
  {
    id: "synthesis",
    label: "Brief",
    emoji: "✍️",
    dependsOn: ["scoring"],
    modelCalls: 1,
    optional: false,
    run: runSynthesis,
  },
] as const;

export const STEPS_BY_ID: ReadonlyMap<StepId, StepDefinition> = new Map(
  STEPS.map((s) => [s.id, s]),
);

/**
 * Waves, matching axionia-app's execution order.
 *
 * Total model calls: 10 across 7 waves.
 */
export const WAVES: readonly StepId[][] = [
  ["validate"],
  ["linkedin", "profile"],
  ["benefits", "financial"],
  ["regulatory", "workforce"],
  ["benefitdesign"],
  ["scoring"],
  ["synthesis"],
] as const;

export const TOTAL_MODEL_CALLS = STEPS.reduce((t, s) => t + s.modelCalls, 0);

/**
 * Verify at module load that the wave order actually satisfies the declared
 * dependencies. A hand-maintained wave list next to a hand-maintained
 * dependency list drifts; this makes the drift immediate rather than producing
 * a step that silently reads an undefined dependency.
 */
export function validatePlan(): string[] {
  const problems: string[] = [];
  const seen = new Set<StepId>();

  const declared = new Set(STEPS.map((s) => s.id));
  const inWaves = new Set(WAVES.flat());
  for (const id of declared) {
    if (!inWaves.has(id)) problems.push(`step "${id}" is not in any wave`);
  }
  for (const id of inWaves) {
    if (!declared.has(id)) problems.push(`wave references unknown step "${id}"`);
  }

  WAVES.forEach((wave, i) => {
    for (const id of wave) {
      const def = STEPS_BY_ID.get(id);
      if (!def) continue;
      for (const dep of def.dependsOn) {
        // Same-wave dependency: the two would run in parallel, so the dependent
        // would read undefined.
        if (wave.includes(dep)) {
          problems.push(`step "${id}" depends on "${dep}", which is in its own wave ${i}`);
        } else if (!seen.has(dep)) {
          problems.push(
            `step "${id}" in wave ${i} depends on "${dep}", which has not run yet`,
          );
        }
      }
    }
    wave.forEach((id) => seen.add(id));
  });

  return problems;
}

/**
 * Steps in this wave whose dependencies are all resolved.
 *
 * A dependency counts as resolved when it is `done` OR `skipped`. That matters:
 * `regulatory` is optional, and `scoring` depends on it. Keyed on outputs alone,
 * a skipped regulatory step would leave scoring permanently unrunnable and the
 * job would stall at 100% of nothing. Optional steps degrade the report; they
 * must not block it.
 */
export function runnableSteps(steps: StepStates, wave: StepId[]): StepId[] {
  return wave.filter((id) => {
    const def = STEPS_BY_ID.get(id);
    if (!def) return false;
    return def.dependsOn.every((dep) => {
      const st = steps[dep]?.status;
      return st === "done" || st === "skipped";
    });
  });
}

/** True when a required step failed or was skipped, so the job cannot complete. */
export function blockedBy(steps: StepStates): StepId[] {
  return STEPS.filter(
    (s) => !s.optional && (steps[s.id]?.status === "failed" || steps[s.id]?.status === "skipped"),
  ).map((s) => s.id);
}
