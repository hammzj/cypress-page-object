import { isNil } from "lodash";
import { clone } from "./utils";

export type BaseContainerFunction = () => Cypress.Chainable<Cypress.JQueryWithSelector<HTMLElement>>;

export type Elements = {
    [key: string]: (...params: never) => Cypress.Chainable<Cypress.JQueryWithSelector<HTMLElement>>;
};

/**
 * Base class for describing page objects and components, which have a collection of element selectors
 */
export default class ElementCollection {
    protected _baseContainerFn: BaseContainerFunction;
    protected _scopedIndex?: number;
    public elements: Elements = {
        container: () => this.container(),
    };
    public components: Elements = {};

    /**
     * @param baseContainerFn {function} The base container function returns the container of the element.
     * Each instance of an ElementCollection class should be selectable by a selector that defines the container of the component/page.
     * From this container, all page elements can be assigned individually that chain from either the base container
     * or another element selector within the class. Nested objects are also allowed as long as they chain from another element selector in this class.
     */
    constructor(baseContainerFn: BaseContainerFunction = () => cy.root()) {
        this._baseContainerFn = baseContainerFn;
    }

    /**
     * When an instance of this ElementCollection is scoped within another ElementCollection,
     * and multiples components of this type exist with that scope,
     * testing on any elements or even scoped ElementCollections; also using `.within()` chained onto the child element
     * is not possible without supplying an index, or else it will select all instances of those found elements,
     * and can therefore produce a Cypress error when trying to interact as if it were only a single element.
     *
     * To fix this, when needing to test a given instance of this scoped ElementCollection, set its `_scopedIndex` first.
     *
     * @param i {number}
     *
     * @example <summary>Multiple returned instances from a single parent</summary>
     const genericEC = new GenericElementCollection();
     //Assume the page has four buttons with the following text in "buttonLabels".
     //There is a nested object on "GenericElementCollection" as "ListButtonObject".
     //This nested object can produce more than one found instance of a button, so scoping by index is necessary.
     const buttonLabels = ['foo', 'bar', 'baz', 'x'];
     buttonLabels.forEach((text, i) => {
     genericEC.ListButtonObject(listButtonObject => {
     listButtonObject.index = i; //Individually iterate over each button
     listButtonObject.should('have.text', text); //Checks each button to have the correct text
     });
     cy.wait(50);
     });
     */
    set scopedIndex(i: number) {
        this._scopedIndex = i;
    }

    /**
     * @alias this.scopedIndex
     * @param i {number}
     */
    set index(i: number) {
        this.scopedIndex = i;
    }

    /**
     * This allows the `_baseContainerFn` to be chained, allowing to scope the instances of the base containers returned to a smaller set
     * of instances or even just an individual element. Useful for finding a single element from a larger collection of repeating elements, like a button in a list using its text or radio choices
     *
     * @param newBaseContainerFn {function} `function(origBaseContainerFn)` Chain off of the originalBaseContainerFn in the method body
     *
     * @example <summary>Conditionally updating the base container function based on an optional constructor parameter</summary>
     *     //Select only the button(s) with the specified button text
     *     #BASE_CONTAINER_ID = '#a-static-id-for-the-button';
     *     constructor(buttonText) {
     *     super(() => cy.get(this.#BASE_CONTAINER_ID));
     *     if (buttonText) {
     *         this.#buttonText = buttonText;
     *         this.updateBaseContainerFunction = (origFn) => {
     *          return origFn.contains('span', this.#buttonText).parents(this.#BASE_CONTAINER_ID);
     *              }
     *            }
     *     }
     * @example <summary>The container function can also be updated conditionally without calling this method in the constructor</summary>
     *     #BASE_CONTAINER_ID = '#a-static-id-for-the-button';
     *     constructor(buttonText) {
     *     let containerFn = () => cy.get(this.#BASE_CONTAINER_ID);
     *     if(buttonText != null) {
     *        this.#buttonText = buttonText;
     *        containerFn =  () => containerFn().contains('span', this.#buttonText).parents(this.#BASE_CONTAINER_ID);
     *     }
     *     super(containerFn);
     */
    set updateBaseContainerFunction(
        newBaseContainerFn: (b: BaseContainerFunction) => Cypress.Chainable<Cypress.JQueryWithSelector<HTMLElement>>
    ) {
        const origBaseContainerFn = this._baseContainerFn;
        // @ts-ignore
        delete this._baseContainerFn;
        this._baseContainerFn = () => newBaseContainerFn(origBaseContainerFn);
    }

    /**
     * Returns the first base container of the component/element.
     * When `_scopedIndex` is set, then it will only return the "i"-indexed container,
     * when expecting multiple elements to be located.
     * @return baseContainerElement {Chainable<JQuery<E>>}
     */
    container(): Cypress.Chainable<Cypress.JQueryWithSelector<HTMLElement>> {
        return !isNil(this._scopedIndex) ?
                this._baseContainerFn().eq(this._scopedIndex)
            :   this._baseContainerFn().first();
    }

    /**
     * If there is more than one instance of the container found, this method will return all located instances
     * @return {*}
     */
    getAllContainers(): Cypress.Chainable<Cypress.JQueryWithSelector<HTMLElement>> {
        return this._baseContainerFn();
    }

    /**
     * A nested object is one that exists within the container of the parent/base object.
     * A nestedObject can also contain its own nestedObjects.
     * @param baseElement {any} an element selector existing on `this`
     * @param nestedObject {ElementCollection|ComponentObject} a `new` instance of the nested object, containing any parameters necessary
     * @param fn {function} this function must take the nestedObject as its parameter, and then it can perform Cypress commands
     * @returns {void}
     * on that nested object.
     *
     * @example <summary>Submitting a form with data that exists within a PageObject</summary>
     *  const newAccountPage = new NewAccountPage();
     *  newAccountPage.components.AccountFormObject(accountFormObject => {
     *    accountFormObject.fillInDetails(userDetails);
     *    accountFormObject.elements.submitButton().click();
     *  });
     *
     * @example <summary>Selecting a parameterized ComponentObject that exists as a radio button with text </summary>
     * //RadioSelectionFormObject
     * RadioButtonObject(fn, buttonText) {
     *     this._nestedObject(this.elements.form(), new RadioButtonObject(buttonText), fn);
     * }
     *
     * //...
     *  const radioSelectionFormObject = new RadioSelectionFormObject();
     *
     *  //Select radio with "foo"
     *  radioSelectionFormObject.components.RadioButtonObject(rbo => {
     *    rbo.container().click();
     *  }, 'foo');
     *
     *
     * //Select radio with "bar"
     *  radioSelectionFormObject.RadioButtonObject(rbo => {
     *    rrbo.container().click();
     *  }, 'bar');
     *
     * @example <summary>Nesting an element without using this function</summary>
     * //RadioSelectionFormObject
     * RadioButtonObject(fn, buttonText) {
     *   this.elements.form().within(() => fn(new RadioButtonObject(buttonText)));
     * }
     */
    _nestedObject(baseElement, nestedObject, fn) {
        //TODO: test this warning
        //if(PageObject.prototype.isPrototypeOf(nestedObject)){
        //    throw Error('Cannot nest a PageObject inside of another base ElementCollection instance')
        //}

        baseElement.within(() => fn(nestedObject));
    }

    /**
     * Useful for when we need to test multiple scoped or indexed ElementCollection instances by setting `_scopedIndex`.
     * for creating element chains. "Cloning" the original allows us to avoid circular dependencies.
     * @return clonedSelf {ElementCollection}
     * @example <summary>Testing two different ElementCollection instances of a Material UI Accordion</summary>
     *      scopedObject.components.AccordionObject(accordionObj => {
     const firstAccordion = clone(accordionObj);
     firstAccordion._scopedIndex = 0;
     const secondAccordion = clone(accordionObj);
     secondAccordion._scopedIndex = 1;
     firstAccordion.container().click();
     firstAccordion.container().should('have.class', 'Mui-expanded');
     secondAccordion.should('have.not.class', 'Mui-expanded');
     });
     * @private
     */
    _clone(): ElementCollection {
        return clone(this);
    }
}
