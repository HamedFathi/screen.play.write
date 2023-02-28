![playwright](https://user-images.githubusercontent.com/8418700/220898294-ec067d4d-c65c-43ab-96d7-8fdf52d0a6a7.png)

## What is Screenplay Pattern?

The Screenplay Pattern is a user-centric approach to writing workflow-level automated acceptance tests. This helps automation testers to write test cases in terms of Business language.

## The Design

![the-screenplay-pattern](https://user-images.githubusercontent.com/8418700/221844273-163cbfa5-f964-413b-9055-08771e248200.png)

The Screenplay Pattern can be summarized in one line: 

```
Actors use Abilities to perform Interactions.
```

* Actors initiate Interactions.
* Abilities enable Actors to initiate Interactions.
* Interactions are procedures that exercise the behaviors under test.
    * Tasks execute procedures on the features under test.
    * Questions return state about the features under test.
    * Interactions may use Locators, Requests, and other Models.
    
## The Principles

The Screenplay Pattern adheres to **SOLID** design principles:

| SOLID Principle                 | Explanation    |
|---------------------------------|----------------|
| Single-Responsibility Principle | Actors, Abilities, and Interactions are treated as separate concerns. |
| Open-Closed Principle           | Each new Interaction must be a new class, rather than a modification of an existing class. |
| Liskov Substitution Principle   | Actors can call all Abilities and Interactions the same way. |
| Interface Segregation Principle | Actors, Abilities, and Interactions each have distinct, separate interfaces. |
| Dependency Inversion Principle  | Interactions use Abilities via dependency injection from the Actor. |


## Example

Here's an example scenario for adding a new item to a todo list:

![image](https://user-images.githubusercontent.com/8418700/221852171-59d0f5f3-6d9e-4af4-86d1-017a17de69cf.png)

* A user navigates to the to-do list page. (An interaction like VisitPage)
* A user sees the "Add Item" button (+) and clicks it. (An interaction like ClickOnAddButton)
* A user enters the title (My todo) of the new item into the input field and presses enter from the keyboard. (An interaction like AddTodoItem)
* A user sees the last item on the to-do list which is the newly added one. (A question like GetLastTodoItem)

```typescript
// Ability
// Abilities to work with Playwright: UsePlaywrightPage, UsePlaywrightBrowser, or UsePlaywrightBrowserContext.
// Defined inside library but you can define what you want.

/*
// For example:
export class UseSqlDatabase extends Ability<DbConnection> {
    constructor(private connectionString: string) {
        super();
    }
    can(): DbConnection {
        return new SqlDatabase(connectionString);
    }
}
*/

// Interactions
export class VisitPage extends Interaction {
  async attemptAs(actor: Actor): Promise<void> {
    let page = await actor.useAbility(UsePlaywrightPage); // Use an abilitiy to interact with the thing.
    await page.goto("http://...");
  }
}
export class ClickOnAddButton extends Interaction {
  async attemptAs(actor: Actor): Promise<void> {
    let page = await actor.useAbility(UsePlaywrightPage);
    await page.locator("i.fa-plus").click();
  }
}

export class AddTodoItem extends Interaction {
  async attemptAs(actor: Actor) {
    let page = await actor.useAbility(UsePlaywrightPage);
    await page.getByTestId('value').type('My first todo');
    await page.keyboard.press('Enter');
  }
}

// Task
// Executing all interactions in order. (less control but automatically)
export class AddTodoAuto extends TaskAuto {
  constructor() {
    super([new VisitPage(), new ClickOnAddButton(), new AddTodoItem()]);
  }
}

// Executing all interactions based on QA/Developer idea. (more control but manually)
export class AddTodo extends Task {
  public async performAs(actor: Actor): Promise<void> {
    await this.attemptInteractionAs(actor, VisitPage); // You can get a return value and assert on that.
    await this.attemptInteractionAs(actor, ClickOnAddButton);
    await this.attemptInteractionAs(actor, AddTodoItem);
  }
  constructor() {
    super([new VisitPage(), new ClickOnAddButton(), new AddTodoItem()]);
  }
}

// Question
export class GetLastTodoItem extends Question {
  async askAs(actor: Actor): Promise<string> {
    let page = await actor.useAbility(UsePlaywrightPage);
    return await page.getByTestId('todo').last().innerText();
  }
}

// Test
test('add a new item to todo list', async ({ page }) => {
  const pw = new UsePlaywrightPage(page);
  // const sqlDb = new UseSqlDatabase("...");

  // Pass abilities to the ctor
  let user = new Actor([pw /*, sqlDb*/]); // Our user

  await user.performs(new AddTodoAuto()); // Executes a task, an interaction, or an interactions.
  // await user.performs(new AddTodo());

  // Question & Assertion separately.
  let theAnswer = await user.asksAbout(new GetLastTodoItem()) as string; // What is the value of last todo item? (system state)
  expect(theAnswer).toBe("My first todo"); // Making sure about the answer/state.
  
  // Question & Assertion together.
  await user.asserts(new GetLastTodoItem(), (answer: string) => {
    expect(answer).toBe("My first todo");
  });
});
```

## References

https://q2ebanking.github.io/boa-constrictor/getting-started/screenplay/

