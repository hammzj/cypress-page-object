# cypress-page-object

A set of template classes and guides to help with developing page objects in Cypress.

## The base class: `ElementCollection`

An "element collection" is what the name implies: it is a collection of element selectors, class properties, utility
functions, and application actions, that define how Cypress can interact with a component or page in an application.

### Each instance is located by its base container

Every element collection should be referenced by a base container function that is totally unique. This means that it
should only find a single _type_ of component on the page, so the base container function should be as strong as
possible to limit it to what you want!

```js
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

### Find basic element selectors with a "getter"

Base elements are locators for HTML elements on the webpage. They should exist as chained from the base container, or
another element selector in the collection.

"Getters" represent a static element, or array of elements, that can be returned. They should be written as **camelCase**:

```js
class AddressForm extends ElementCollection {
    constructor() {
        //This is the base container function for the address form
        super(() => cy.get("form#address"));
    }

    get nameDiv() {
        //An element selector chained from the base container
        //In nearly ALL cases, you should be chaining off of the container!
        return this.container.find(`div.nameContainer`);
    }

    get firstNameField() {
        //An element selector chained from another element selector -- selects the first found "input"
        return this.nameDiv().find(`input`).first();
    }

    get lastNameField() {
        return this.firstNameField.next();
    }

    get cityField() {
        return this.container.find(`input#city`);
    }

    get stateField() {
        return this.container.find(`input#state`);
    }

    get postalCodeField() {
        return this.container.contains(`input#postalCode`);
    }

    get submitButton() {
        return this.container.find(`button[type="submit"}`);
    }

    //Getters can return many elements at once!
    get fieldErrors() {
        //Assumes that multiple field errors can be present on submission, so it has the possiblity to return many elements!
        //For example, you can use this.fieldErrors.eq(i) to find a single instance of the error.
        //@see https://docs.cypress.io/api/commands/eq
        return this.container.find(`div.error`);
    }
}
```

### Find specific element selectors with a parameterized function

If multiple element selectors exist, you can limit the scope using parameters.

For example, finding a radio button in a list of selections:

```js
class SelectAnShippingOptionObject extends ElementCollection {
    constructor() {
        super(() => cy.get(`form#select-a-shipping-partner`));
    }

    radioButton(text) {
        //Finds the button based on its text
        return this.container.contains(`button[type="radio"]`, text);
    }
}
```

### Specify scope to exist within the base object using nested component objects

Nested components that have their own element selectors and app actions can exist on a parent component. There is a
special function notation that allows us to work with it, either using a utility function or Cypress' `.within` command
chained off of a base element.

_See more here: [WORKING_WITH_NESTED_OBJECTS.md](docs/WORKING_WITH_NESTED_OBJECTS.md)_.

### Perform application actions as functions written with double underscores

Element collections reserve utility methods to be provided with single underscores, like `_clone`.

**When adding an app action, use double underscores, like `__fillInForm(props)`**.

```js
class SearchForm extends ComponentObject {
    constructor() {
        super(() => cy.get(`form#location-search-form`));
    }

    get inputField() {
        return this.container.find('input[type="text"]');
    }

    get submitButton() {
        return this.container.find(`button[type="submit"]`);
    }

    //An app action to search for text using the form
    __search(text, submit = true) {
        this.inputField.type(text);
        if (submit === true) {
            this.submitButton.click();
        }
    }
}

//...
const searchForm = new SearchForm();
searchForm.__search("events happening in New York City");
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
//Select only the button with the specified label text
class PaymentTypeButton extends ComponentObject {
    #BASE_CONTAINER_SELECTOR = 'button[id="payment-type"]';

    constructor(buttonText) {
        super(() => cy.get(this.#BASE_CONTAINER_SELECTOR));
        //Conditionally update the base container function to find the button based on its text
        if (buttonText) {
            this.updateBaseContainerFunction = (origFn) => {
                //Make sure the base container function references the base container again!
                return origFn
                    .contains("span", buttonText)
                    .parents(this.#BASE_CONTAINER_SELECTOR)
                    .first();
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
//Select only the button with the specified label text
class PaymentTypeButton extends ComponentObject {
    #BASE_CONTAINER_SELECTOR = 'button[id="payment-type"]';

    constructor(buttonText) {
        let baseContainerFn = () => cy.get(this.#BASE_CONTAINER_SELECTOR);
        //Only change the function if the constructor has a parameter
        if (buttonText != null) {
            //Make sure the base container function references the base container again!
            baseContainerFn = () => {
                return baseContainerFn()
                    .contains("span", buttonText)
                    .parents(this.#BASE_CONTAINER_SELECTOR);
            };
        }

        //Then pass it to super
        super(baseContainerFn);
    }
}
```

</details>

## The `PageObject` class

Nesting other component objects is supported, but it is highly advised to not nest another page object inside of a page
object!

---

## Notes

Cypress advises
using [App Actions](https://www.cypress.io/blog/2019/01/03/stop-using-page-objects-and-start-using-app-actions), but in
my time working with Cypress, I've found app actions can actually be used _within_ page objects! Actions that occur
within a page can be contained in the `PageObject` class, and actions that navigate through multiple `PageObject`
or `ComponentObject` instances can exist as organized helper functions within your application. However, the codestyle
and preference is up to you!
