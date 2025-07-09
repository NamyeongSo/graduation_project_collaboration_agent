/* eslint-env node, commonjs */
/* global module */ 

class State {
  /**
   * Called when entering the state.
   * @param {Object} ctx - context object shared across states.
   */
  enter(ctx) {}

  /**
   * Called periodically while in the state.
   * @param {Object} ctx - context object shared across states.
   */
  execute(ctx) {}

  /**
   * Called when exiting the state.
   * @param {Object} ctx - context object shared across states.
   */
  exit(ctx) {}
}

class WaitState extends State {
  enter(ctx) {
    console.log('Entering WaitState');
  }

  execute(ctx) {
    console.log('Executing WaitState');
    if (ctx.hasNewGoal) {
      ctx.state_machine.changeState(new CommunicationState(), ctx);
    }
  }

  exit(ctx) {
    console.log('Exiting WaitState');
  }
}

class CommunicationState extends State {
  enter(ctx) {
    console.log('Entering CommunicationState');
  }

  execute(ctx) {
    console.log('Executing CommunicationState');
    if (ctx.readyToPlan) {
      ctx.state_machine.changeState(new PlanningState(), ctx);
    }
  }

  exit(ctx) {
    console.log('Exiting CommunicationState');
  }
}

class PlanningState extends State {
  enter(ctx) {
    console.log('Entering PlanningState');
  }

  execute(ctx) {
    console.log('Executing PlanningState');
    ctx.planReady = true;
    ctx.state_machine.changeState(new ActionState(), ctx);
  }

  exit(ctx) {
    console.log('Exiting PlanningState');
  }
}

class ActionState extends State {
  enter(ctx) {
    console.log('Entering ActionState');
  }

  execute(ctx) {
    console.log('Executing ActionState');
    if (!ctx.step_cnt) {
      ctx.step_cnt = 0;
    }
    ctx.step_cnt += 1;
    if (ctx.step_cnt % 20 === 0) {
      ctx.state_machine.changeState(new ReflectionState(), ctx);
    } else if (ctx.goalDone) {
      ctx.state_machine.changeState(new CommunicationState(), ctx);
    }
  }

  exit(ctx) {
    console.log('Exiting ActionState');
  }
}

class ReflectionState extends State {
  enter(ctx) {
    console.log('Entering ReflectionState');
  }

  execute(ctx) {
    console.log('Executing ReflectionState');
    ctx.needReplan = !ctx.needReplan;
    if (ctx.needReplan) {
      ctx.state_machine.changeState(new PlanningState(), ctx);
    } else {
      ctx.state_machine.changeState(new ActionState(), ctx);
    }
  }

  exit(ctx) {
    console.log('Exiting ReflectionState');
  }
}

class StateMachine {
  /**
   * @param {State} initial_state - starting state for the machine.
   */
  constructor(initial_state) {
    this.current_state = initial_state;
    if (this.current_state) {
      this.current_state.enter({});
    }
  }

  /**
   * Change to a new state.
   * @param {State} new_state - next state instance.
   * @param {Object} ctx - shared context for states.
   */
  changeState(new_state, ctx) {
    if (this.current_state) {
      this.current_state.exit(ctx);
    }
    this.current_state = new_state;
    if (this.current_state) {
      this.current_state.enter(ctx);
    }
  }

  /**
   * Execute one tick of the state machine.
   * @param {Object} ctx - shared context for states.
   */
  tick(ctx) {
    ctx.state_machine = this;
    if (this.current_state) {
      this.current_state.execute(ctx);
    }
  }
}

module.exports = {
  State,
  WaitState,
  CommunicationState,
  PlanningState,
  ActionState,
  ReflectionState,
  StateMachine
};
