/* global process */
/* eslint-env node */
import { publish, subscribe, bus } from './messageBus.js';
import { AgentContext } from './context.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { StateMachine, WaitState } = require('./dst.js');

function createSimAgent(name) {
    const ctx = AgentContext.fromInitialGoal(null);
    const machine = new StateMachine(new WaitState());
    let lastState = machine.current_state.constructor.name;
    console.log(`[${name}] start in ${lastState}`);

    subscribe('goal', () => {
        ctx.hasNewGoal = true;
        ctx.readyToPlan = false;
        ctx.planReady = false;
        ctx.goalDone = false;
        ctx.step_cnt = 0;
        startTs = Date.now();
    });

    let startTs = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTs;
        if (ctx.hasNewGoal && elapsed > 500) {
            ctx.readyToPlan = true;
        }
        if (ctx.planReady && elapsed > 1000) {
            ctx.goalDone = true;
        }

        machine.tick(ctx);
        const stateName = machine.current_state.constructor.name;
        if (stateName !== lastState) {
            console.log(`[${name}] -> ${stateName}`);
            lastState = stateName;
        }
        if (ctx.goalDone) {
            publish('goal_done', { agent: name });
            clearInterval(interval);
        }
    }, 50);

    return interval;
}

const agent1 = createSimAgent('Agent1');
const agent2 = createSimAgent('Agent2');

setTimeout(() => {
    console.log('Publishing sample goal');
    publish('goal', { goal_id: 1 });
}, 2000);

bus.once('goal_done', (payload) => {
    console.log(`Goal completed by ${payload.agent}`);
    clearInterval(agent1);
    clearInterval(agent2);
    process.exit(0);
});
