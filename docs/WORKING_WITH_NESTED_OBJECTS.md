# Nested component objects

Web components can be made up of individual elements, or other components, themselves. The same goes for page objects:
using components makes it easier to build a website, so defining a page object as a collection of component objects
underneath allows for a more thorough representation of what can exist within the webpage code itself.

However, components may exist in multiple places on a page at once, and therefore, selecting them outright may lead to
Cypress incorrectly selecting the wrong instance. Therefore, nested components _need_ to be also be chained from an
element selector existing inside of the parent object. Luckily, that's able to happen in an `ElementCollection`.

## Nesting component objects with the `_nestedComponent` utility function

A utility function exists in any `ElementCollection` instance named `_nestedComponent`. This allows you to add a nested
component object/element collection to exist inside of your parent component/page object. Nested Objects should always
be written in **SentenceCase**.

`this._nestedComponent(baseElement, nestedComponent, fn)`

It accepts the following parameters:

-   `baseElement`: an element selector existing on `this`
    -   Examples:
        -   `this.container`
        -   any static element selector
-   `nestedComponent`: a new instance of the nested object class, containing any needed parameters in the constructor
    -   Examples:
        -   a new instance of an `ElementCollection` or `ComponentObject`
        -   `new AccountFormObject()`
        -   `new AlertDialogObject('An error occurred')`: parameterized object
-   fn: this function must take the nestedComponent as its parameter, and then it can perform Cypress commands
    -   Examples:

```js
function fn(nestedComponent) {
    //Add cypress commands using the nestedComponent here
}

//or
(nestedComponent) => {
    //Add cypress commands using the nestedComponent here
};
```

### Example 1: A simple nested component object

```js
//"pages/new.account.page.js"
import AccountFormObject from "../components/account.form.object";

class CreateAccountPage extends PageObject {
    contructor() {
        super(`/create-account`);
    }

    AccountFormObject(fn) {
        this._nestedComponent(this.container, new AccountFormObject(), fn);
    }
}
```

```js
//new.account.page.cy.js
//Using in a test:

//...
const userDetails = { username: "coolusername", pasword: "abcd1234" };
const createAccountPage = new CreateAccountPage();
describe("Create Account Page", function () {
    it("can submit a form with user details", function () {
        cy.visit(createAccountPage.url());

        //This will submit the form with the given user details
        createAccountPage.AccountFormObject(function (accountFormObject) {
            accountFormObject.__fillInDetails(userDetails);
            accountFormObject.submitButton.click();
        });

        cy.url().should("contain.text", "/success");
    });
});
```

### Example 2: Passing parameters to the nested object

```js
//Example: Selecting a parameterized ComponentObject that exists as a toggle with text
class ToggleButton extends ComponentObject {
    constructor(buttonText) {
        super(() => cy.contains("button.toggleButton", buttonText));
    }
}

class SettingsObject extends ComponentObject {
    constructor() {
        super(() => cy.get('div[id="settings"]'));
    }

    get displaySettingsForm() {
        return this.container.find(`form#mode-selectors`);
    }

    ToggleButton(fn, buttonText) {
        this._nestedComponent(this.displaySettingsForm, new ToggleButton(buttonText), fn);
    }
}
```

```js
//component test file
describe("test", function () {
    specify("clicking a toggle button", function () {
        //Mount is a custom command for mounting a React component for component testing
        cy.mount(<Settings />);

        const settingsObject = new SettingsObject();
        settingsObject.ToggleButton(function (toggleButton) {
            toggleButton.click();
        }, "Dark Mode");
        settingsObject.ToggleButton(function (toggleButton) {
            toggleButton.click();
        }, "24 Hour Clock");

        //Assume that a message displays whether a button is turned on
        cy.contains(`div`, "Dark mode enabled").should("exist");
        cy.contains(`div`, "24 hour clock mode enabled").should("exist");
    });
});
```

### Example 3: Passing parameters to both a parameterized base element AND nested object

In the case that both the base element and nested object need to be parameterized, consider turning the base element
into its own `ComponentObject`, and nest the nested object inside of it.

## Nesting component objects using `cy.within()`

The `_nestedComponent` utility function does not need to be used to nest components. Instead, using Cypress' `within()` on
the base element command will work just the same!

```js
//"pages/new.account.page.js"
import AccountFormObject from "../components/account.form.object";

class CreateAccountPage extends PageObject {
    constructor() {
        super(`/create-account`);
    }

    AccountFormObject(fn) {
        this.container.within(() => fn(new AccountFormObject()));
    }
}
```

```js
//Example: Selecting a parameterized ComponentObject that exists as a toggle with text
class ToggleButton extends ComponentObject {
    constructor(buttonText) {
        super(() => cy.contains("button.toggleButton", buttonText));
    }
}

class SettingsObject extends ComponentObject {
    constructor() {
        super(() => cy.get('div[id="settings"]'));
    }

    get displaySettingsForm() {
        return this.container.find(`form#mode-selectors`);
    }

    ToggleButton(fn, buttonText) {
        this.displaySettingsForm.within(() => fn(new ToggleButton(buttonText)));
    }
}
```

Then, you can use them in your test functions as you did before:

```js
const createAccountPage = new CreateAccountPage();
//This will submit the form with the given user details
createAccountPage.AccountFormObject((accountFormObject) => {
    accountFormObject.__fillInDetails(userDetails);
    accountFormObject.submitButton.click();
});
```

## Additional notes

### Nested objects can also have their own nested objects

```js
settingsPage.SettingsObject((settingsObject) => {
    settingsPage.ToggleButton((toggleButton) => {
        toggleButton.click();
    }, "Dark Mode");
});
```

### Do not nest page objects under another page object

Nesting other component objects is supported, but it is highly advised to not nest another page object inside of a page
object. This breaks flow and logically does not make sense to do.
