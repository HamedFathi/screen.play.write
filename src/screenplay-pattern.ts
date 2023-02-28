export function toPromise<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export abstract class Ability<T> {
  public abstract can(): T;
}

export abstract class Interaction {
  public abstract attemptAs(actor: Actor): Promise<unknown>;
}

export abstract class TaskAuto {
  constructor(private readonly interactions: Interaction[]) {}

  public async performAs(actor: Actor): Promise<void> {
    for (const interaction of this.interactions) {
      await interaction.attemptAs(actor);
    }
  }
}

export abstract class Task {
  constructor(private readonly interactions: Interaction[]) {}

  public getInteractions(): Interaction[] {
    return this.interactions;
  }

  public async attemptInteractionsAs(actor: Actor): Promise<void> {
    for (const interaction of this.getInteractions()) {
      await interaction.attemptAs(actor);
    }
  }

  public async attemptInteractionAs(
    actor: Actor,
    interactionClass: new (...args: never[]) => Interaction
  ): Promise<unknown> {
    const matchingInteractions = this.interactions?.filter(
      (a) => a instanceof interactionClass
    ) as Interaction[];
    if (matchingInteractions.length === 0) {
      throw new Error(
        `Interaction with name of '${interactionClass.name}' not found.`
      );
    }
    return await matchingInteractions[0].attemptAs(actor);
  }

  public abstract performAs(actor: Actor): Promise<void>;
}

export abstract class Question {
  public abstract askAs(actor: Actor): Promise<unknown>;
}

export class Actor {
  constructor(private readonly abilities?: Ability<unknown>[]) {}

  public async useAbility<T>(
    abilityClass: new (...args: never[]) => Ability<T>
  ): Promise<T> {
    const matchingAbilities = this.abilities?.filter(
      (a) => a instanceof abilityClass
    ) as Ability<T>[];
    if (matchingAbilities.length === 0) {
      throw new Error(
        `Actor does not have ability with name of '${abilityClass.name}'.`
      );
    }
    return await matchingAbilities[0].can();
  }

  public async performs(
    taskOrInteraction: Task | TaskAuto | Interaction | Interaction[]
  ): Promise<void> {
    if (taskOrInteraction instanceof Task) {
      await taskOrInteraction.performAs(this);
      return;
    }
    if (taskOrInteraction instanceof TaskAuto) {
      await taskOrInteraction.performAs(this);
      return;
    }
    if (taskOrInteraction instanceof Interaction) {
      await taskOrInteraction.attemptAs(this);
      return;
    }
    if (Array.isArray(taskOrInteraction)) {
      for (const interaction of taskOrInteraction) {
        await interaction.attemptAs(this);
      }
      return;
    }
  }

  public async asserts<T>(
    question: Question,
    assert: (answer: T) => void
  ): Promise<void> {
    await toPromise(assert((await question.askAs(this)) as T));
  }

  public async asksAbout<T>(question: Question): Promise<T> {
    return (await question.askAs(this)) as T;
  }
}
