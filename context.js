/**
 * Shared agent context used across the system.
 */
export class AgentContext {
    constructor() {
        this.goal_id = null;
        this.hasNewGoal = false;
        this.readyToPlan = false;
        this.planReady = false;
        this.step_cnt = 0;
        this.goalDone = false;
        this.needReplan = false;
        this.inventory = {};
    }

    /**
     * Factory to create a context from an initial goal payload.
     * @param {object} goal_payload
     * @returns {AgentContext}
     */
    static fromInitialGoal(goal_payload) {
        const ctx = new AgentContext();
        if (goal_payload) {
            ctx.goal_id = goal_payload.goal_id ?? null;
            if (goal_payload.inventory) {
                ctx.inventory = { ...goal_payload.inventory };
            }
        }
        ctx.hasNewGoal = true;
        return ctx;
    }
}
