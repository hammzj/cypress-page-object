import { BaseContainerFunction } from "./types";
import ElementCollection from "./element.collection";

/**
 * A component object is useful when building websites using components.
 * A component can represent a collection of individual element selectors, or even contain
 * other nested component objects themselves. It must provide a base container function.
 */
export default class ComponentObject extends ElementCollection {
    constructor(baseContainerFn: BaseContainerFunction) {
        super(baseContainerFn);
    }

    /**
     * Expects that there are no instances of the component found.
     * When calling this method, it is best to ensure that the baseContainerFn only uses a single Cypress command;
     * using multiple chained commands may cause this to fail if an earlier selector in the base container function cannot be found.
     */
    assertNoneExist(): void {
        this.getAllContainers().should("not.exist");
    }

    assertExists(expectation: boolean = true): void {
        if (!expectation) {
            //@ts-ignore
            if (this._scopedIndex > 0) {
                /*
                The scoped index is set above 0 (i.e., it is not the first-found instance).
                Make sure at least a base container exists first,
                then check that the specified instance does not exist
                 */
                cy.log(
                    "Checking that at least one instance exists, then will check scoped index at " + this._scopedIndex
                );
                this._baseContainerFn().should("exist"); //At least one instance exists
                this.container().should("not.exist"); //The specified instance does not exist
            } else {
                this._baseContainerFn().should("not.exist");
            }
        } else {
            this.container().should("exist");
        }
    }
}
