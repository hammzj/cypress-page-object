import { BaseContainerFunction, ComponentObjectFunction, Elements, NestedComponents, IMetadata } from "./types";

/**
 * Base class for describing page objects and components, which have a collection of element selectors
 */
export default abstract class ElementCollection {
    protected _baseContainerFn: BaseContainerFunction;
    protected _scopedIndex?: number;
    protected metadata: Partial<IMetadata>;
    protected elements: Elements;
    protected components?: NestedComponents = {};

    /**
     * @param baseContainerFn {function} The base container function returns the container of the element.
     * Each instance of an ElementCollection class should be selectable by a selector that defines the container of the component/page.
     * From this container, all page elements can be assigned individually that chain from either the base container
     * or another element selector within the class. Nested objects are also allowed as long as they chain from another element selector in this class.
     */
    constructor(baseContainerFn: BaseContainerFunction = () => cy.root()) {
        this._baseContainerFn = baseContainerFn;
        this.metadata = {};
        this.elements = {
            container: () => this.container(),
        };
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
     * Adds new element selectors to the base group of existing elements
     * WARNING: you will set `elements` as public in order to access them outside of app action functions!
     * Just add `public elements: Elements` before your constructor.
     * @param elements
     * @private
     */
    protected set addElements(elements: Elements) {
        this.elements = Object.assign(this.elements || {}, elements);
    }

    /**
     * Adds new element selectors to the base group of existing elements
     * WARNING: you will set `components` as public in order to access them outside of app action functions!
     * Just add `public components: NestedComponentd` before your constructor.
     * @param components
     * @private
     */
    protected set addNestedComponents(components: NestedComponents) {
        this.components = Object.assign(this.components || {}, components);
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
    protected set updateBaseContainerFunction(
        newBaseContainerFn: (b: BaseContainerFunction) => Cypress.Chainable<Cypress.JQueryWithSelector>
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
     */
    container(): Cypress.Chainable<Cypress.JQueryWithSelector> {
        return this._scopedIndex != null ?
                this.getAllContainers().eq(this._scopedIndex)
            :   this.getAllContainers().first();
    }

    /**
     * If there is more than one instance of the container found, this method will return all located instances
     */
    getAllContainers(): Cypress.Chainable<Cypress.JQueryWithSelector> {
        return this._baseContainerFn();
    }

    /**
     * A nested component object is one that exists within the container of its parent/base object. It cannot be found outside of its parent's container.
     * A nestedComponent can also contain its own nestedComponents.
     * @param baseElement {Cypress.Chainable<JQueryWithSelector>} an element selector from `this.elements`
     * @param nestedComponent {ElementCollection|ComponentObject} a `new` instance of the nested object, containing any parameters necessary
     * @param fn {ComponentObjectFunction} this function must take the nestedComponent as its parameter, and then it can perform Cypress commands
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
     *     this.performWithin(this.elements.form(), new RadioButtonObject(buttonText), fn);
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
     *    rbo.container().click();
     *  }, 'bar');
     *
     * @example <summary>Nesting an element without using this function</summary>
     * //RadioSelectionFormObject
     * RadioButtonObject(fn, buttonText) {
     *   this.elements.form().within(() => fn(new RadioButtonObject(buttonText)));
     * }
     */
    //@ts-ignore
    performWithin(
        baseElement: Cypress.Chainable<Cypress.JQueryWithSelector>,
        nestedComponent: ElementCollection,
        fn: ComponentObjectFunction
    ): void {
        baseElement.within(() => fn(nestedComponent));
    }
}
