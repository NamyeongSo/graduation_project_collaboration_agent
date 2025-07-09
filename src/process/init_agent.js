/* global process */
/* eslint-env node */
import { Agent } from '../agent/agent.js';
import { serverProxy } from '../agent/mindserver_proxy.js';
import yargs from 'yargs';
import { bus, publish, subscribe } from '../../messageBus.js';
import { AgentContext } from '../../context.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { StateMachine, WaitState } = require('../../dst.cjs');

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node init_agent.js -n <agent_name> -p <port> -l <load_memory> -m <init_message> -c <count_id>');
    process.exit(1);
}

const argv = yargs(args)
    .option('name', {
        alias: 'n',
        type: 'string',
        description: 'name of agent'
    })
    .option('load_memory', {
        alias: 'l',
        type: 'boolean',
        description: 'load agent memory from file on startup'
    })
    .option('init_message', {
        alias: 'm',
        type: 'string',
        description: 'automatically prompt the agent on startup'
    })
    .option('count_id', {
        alias: 'c',
        type: 'number',
        default: 0,
        description: 'identifying count for multi-agent scenarios',
    })
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'port of mindserver'
    })
    .option('goal', {
        alias: 'g',
        type: 'string',
        description: 'initial goal payload as JSON'
    })
    .argv;

void (async () => {
    try {
        console.log('Connecting to MindServer');
        await serverProxy.connect(argv.name, argv.port);
        console.log('Starting agent');
        const agent = new Agent();
        serverProxy.setAgent(agent);
        await agent.start(argv.load_memory, argv.init_message, argv.count_id);

        const goalPayload = argv.goal ? JSON.parse(argv.goal) : null;
        const ctx = AgentContext.fromInitialGoal(goalPayload);
        const machine = new StateMachine(new WaitState());

        let startTs = Date.now();

        subscribe('goal', () => {
            ctx.hasNewGoal = true;
            ctx.readyToPlan = false;
            ctx.planReady = false;
            ctx.goalDone = false;
            ctx.step_cnt = 0;
            startTs = Date.now();
        });

        function loop() {
            const elapsed = Date.now() - startTs;
            if (ctx.hasNewGoal && elapsed > 500) {
                ctx.readyToPlan = true;
            }
            if (ctx.planReady && elapsed > 1000) {
                ctx.goalDone = true;
            }

            machine.tick(ctx);

            if (ctx.goalDone) {
                publish('goal_done');
                ctx.goalDone = false;
            }
        }

        setInterval(loop, 50);
    } catch (error) {
        console.error('Failed to start agent process:');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
