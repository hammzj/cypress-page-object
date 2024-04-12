# cypress-page-object

A set of template classes and guides to help with developing component and page objects in Cypress.

```js
import {
    ElementCollection, //The generic class for defining element selectors
    ComponentObject, //Represents individual components made of element selectors and nested component objects
    PageObject, //Represents a webpage and its collection of both element selectors and component objects
} from "@hammzj/cypress-page-object";

class FooterObject extends ComponentObject {
    constructor() {
        super(() => cy.get(`footer`));
    }

    elements = {
        ...this.elements,
        copyright: () => this.container().find(`p.MuiTypography-root`),
    };
}

class ExamplePageObject extends PageObject {
    constructor() {
        super();
    }

    elements = {
        ...this.elements,
        appBar: () => cy.get(`.MuiAppBar-root`),
        appLink: (label: title) => this.elements.appBar().contains("a.MuiLink-root", label),
    };

    components = {
        FooterObject: (fn) => this.performWithin(this.container(), new FooterObject(), fn),
    };

}

const examplePageObject = new ExamplePageObject();
examplePageObject.elements.appBar().should("exist");
examplePageObject.elements.appLink("Features").should("exist");
examplePageObject.components.FooterObject((footerObject) => {
    footerObject.elements.copyright().should("have.text", "Copyright @2024");
});
```

## Installation

This package is hosted on both the NPMJS registry and the GitHub NPM package repository.

If installing from GitHub, please add or update
your `.npmrc` file with the following:

```
@hammzj:registry=https://npm.pkg.github.com
```

Then, install as normal:

```
npm install @hammzj/cypress-page-object
#or
yarn add @hammzj/cypress-page-object
```

## The base class: `ElementCollection`

_Note: All examples below have selectors for [MaterialUI](https://mui.com/material-ui/) root classes._

An "element collection" is what the name implies: it is a collection of element selectors, class properties, utility
functions, and application actions, that define how Cypress can interact with a component or page in an application.

### Each instance is located by its base container

Every element collection should be referenced by a base container function that is totally unique. This means that it
should only find a single _type_ of component on the page, so the base container function should be as strong as
possible to limit it to what you want!

```js
const { ElementCollection } = require("@hammzj/cypress-page-object");

class AddressForm extends ElementCollection {
    constructor() {
        //This is the base container function for an "address" form
        super(() => cy.get("form#address"));
    }
}

class SearchForm extends ElementCollection {
    constructor() {
        //This is the base container function for a "search" form
        //It is different from the above because using just cy.get(`form`) would also return the address form! Not good!
        super(() => cy.get("form#search-for-location"));
    }
}
```

**Note: If a base container function is not supplied, the scope is rendered to the entire HTML document.**

### Place element selectors in an `elements` object

Base elements are locators for HTML elements on the webpage. They should exist as chained from the base container, or
another element selector in the collection.

These are defined in `this.elements`. You can either extend the original elements
with `this.elements = { ...this.elements, ... }`
or use `Object.assign(this.elements, { ... })` inside the class constructor.

<details>
<summary>Setting elements</summary>

```js
class NewUserForm extends ElementCollection {
    constructor() {
        //This is the base container function for the address form
        super(() => cy.get("form#new-user"));
    }

    public elements = {
        //An element selector chained from another element selector -- selects the first found "input"
        usernameField: () => this.container().find(`input`).first(),
        passwordField: () => this.elements.usernameField().next(),
        //Some selectors can return many elements at once!
        fieldErrors: () => {  //Assumes that multiple field errors can be present on submission, so it has the possiblity to return many elements!
            //For example, you can use this.fieldErrors.eq(i) to find a single instance of the error.
            //@see https://docs.cypress.io/api/commands/eq

            return this.container().find(`div.error`);
        }
    }
}
```

</details>

<details>
<summary>Alternate way of setting elements</summary>

```js
class NewUserForm extends ElementCollection {
    constructor() {
        //This is the base container function for the address form
        super(() => cy.get("form#new-user"));
        Object.assign(this.elements, {
            //An element selector chained from another element selector -- selects the first found "input"
            usernameField: () => this.container().find(`input`).first(),
            passwordField: () => this.elements.usernameField().next(),
            //Some selectors can return many elements at once!
            fieldErrors: () => {
                //Assumes that multiple field errors can be present on submission, so it has the possiblity to return many elements!
                //For example, you can use this.fieldErrors.eq(i) to find a single instance of the error.
                //@see https://docs.cypress.io/api/commands/eq

                return this.container().find(`div.error`);
            },
        });
    }
}
```

</details>

### Find specific element selectors with a parameterized function

If multiple element selectors exist, you can limit the scope using parameters.

For example, finding a radio button in a list of selections:

```js
class SelectAnShippingOptionObject extends ElementCollection {
    constructor() {
        super(() => cy.get(`form#select-a-shipping-partner`));
    }

    public elements = {
        //Finds the radio button based on its text
        radioButton: (text) => this.container().contains(`button[type="radio"]`, text),
    };
}
```

### Specify scope to exist within the base object using nested component objects

Nested components that have their own element selectors and app actions can exist on a parent component. There is a
special function notation that allows us to work with it, either using a utility function or Cypress' `.within` command
chained off of a base element.

_See more here: [WORKING_WITH_NESTED_OBJECTS.md](docs/WORKING_WITH_NESTED_OBJECTS.md)_.

### Perform application actions as functions

App action functions allow you to execute flows and perform validations.

```js
const { ComponentObject } = require("@hammzj/cypress-page-object");

class SearchForm extends ComponentObject {
    constructor() {
        super(() => cy.get(`form#location-search-form`));
    }

    public elements = {
        inputField: () => this.container().find(`input[type="text"]`),
        submitButton: () => this.container().find(`button[type="submit"]`),
    };

    //An app action to search for text using the form
    search(text, submit = true) {
        this.elements.inputField().type(text);
        if (submit === true) {
            this.elements.submitButton().click();
        }
    }
}

//...
const searchForm = new SearchForm();
searchForm.search("events happening in New York City");
```

## The `ComponentObject` class

This class is a basic extension of an `ElementCollection`. It defines a web component and the elements that exist within
it.

### Useful hints

#### Updating the base container function to use a parameterized component object

<details>
<summary>Option 1: using "updateBaseContainerFunction"</summary>

`this.updateBaseContainerFunction` allows you to conditionally update the base container function, either based on a
parameterized constructor, or elsewhere in your test framework:

```js
const { ComponentObject } = require("@hammzj/cypress-page-object");

class PaymentTypeButton extends ComponentObject {
    //Select only the button with the specified label text
    #BASE_CONTAINER_SELECTOR = 'button[id="payment-type"]';

    constructor(buttonText) {
        super(() => cy.get(this.#BASE_CONTAINER_SELECTOR));
        //Conditionally update the base container function to find the button based on its text
        if (buttonText) {
            this.updateBaseContainerFunction = (origFn) => {
                //Make sure the base container function references the base container again!
                return origFn.contains("span", buttonText).parents(this.#BASE_CONTAINER_SELECTOR).first();
            };
        }
    }
}
```

</details>

<details>
<summary>Option 2: conditionally setting it in the constructor</summary>

Before calling `super` in the constructor, you can set the contents of the base container function, and then pass it in
to `super`:

```js
const { ComponentObject } = require("@hammzj/cypress-page-object");

//Select only the button with the specified label text
class PaymentTypeButton extends ComponentObject {
    #BASE_CONTAINER_SELECTOR = 'button[id="payment-type"]';

    constructor(buttonText) {
        let baseContainerFn = () => cy.get(this.#BASE_CONTAINER_SELECTOR);
        //Only change the function if the constructor has a parameter
        if (buttonText != null) {
            //Make sure the base container function references the base container again!
            baseContainerFn = () => {
                return baseContainerFn().contains("span", buttonText).parents(this.#BASE_CONTAINER_SELECTOR);
            };
        }

        //Then pass it to super
        super(baseContainerFn);
    }
}
```

</details>

## The `PageObject` class

A page object represents an entire page of an application, which can consist of page metadata, element selectors, nested
components, and
their own app actions and assertions that can utilize multiple nested components at once. They also have their
own url paths that can be set and defined. URLs with replaceable path variables are also allowed, and functions exist to
assist with constructing them.

### Using a custom URL path

When supplying a URL path with variables to a `PageObject` constructor, make sure the path variables are written
as `/:STRING_TO_REPLACE`. Then, you can call `.url(...pathInputs)` to create a usable URL! However, make sure you supply
exactly every input that needs substitution.

#### Example 1: a path with variables to replace

```js
const { PageObject } = require("@hammzj/cypress-page-object");

class UserPostsPage extends PageObject {
    constructor() {
        super({ path: `/user/:userId/post/:postId`, baseUrl: `http://localhost:3000` });
    }
}

const userPostsPage = new UserPostsPage();
userPostsPage.url("1234", "post-9876"); //=> "http://localhost:3000/user/1234/post/post-9876"
```

#### Example 2: a path without variables

```js
const { PageObject } = require("@hammzj/cypress-page-object");

//Cypress.config().baseUrl = `http://localhost:3000`;

class PrivacySettingsPage extends PageObject {
    constructor() {
        super({ path: `/settings/privacy` });
    }
}

const privacySettingsPage = new PrivacySettingsPage();
//Works, but will log an error to the console since there are no variables, or not enough variables, to replace
privacySettingsPage.url("1234"); //=> "http://localhost:3000/settings/privacy"
```

---

## Development

### Installation

-   Run `npm install` or `yarn`
-   Run the script, `dev:postinstall` to install git hooks

### Example tests

Examples of using page objects and component objects can be found in `/tests/cypress/e2e`. The spec contains many
guidelines and different ways for how you can create meaningful test classes for `PageObject` and `ComponentObject`
types. It is directly run in Cypress to see how it works in action.

The tests use a bundled example website built with React, MaterialUI, and Gatsby, that must have its own dependencies
installed. To be able to run the example tests, do the following:

```shell
# Install Cypress
yarn dev:cypress:install

# Installs website dependencies under /tests/example_website
yarn dev:install-example-website

# Website is served at "http://localhost:8000/"
# This must stay active while testing is being performed!
yarn dev:start-example-website

# Opens Cypress: you can now view the tests in the testrunner!
yarn test:cypress:open:e2e

# After testing, end the server with "Ctrl + C"
```

### TypeScript support

All typings are included in `/src/types`, but class types are found in their corresponding source file
like `ElementCollection` in `/src/element.collection`.

## Notes

Cypress advises
using [App Actions](https://www.cypress.io/blog/2019/01/03/stop-using-page-objects-and-start-using-app-actions), but in
my time working with Cypress, I've found app actions can actually be used _within_ page objects! Actions that occur
within a page can be contained in the `PageObject` class, and actions that navigate through multiple `PageObject`
or `ComponentObject` instances can exist as organized helper functions within your application. However, the code
styling and preference is up to you!
