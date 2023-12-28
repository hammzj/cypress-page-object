import {isEqual} from "lodash";
import ElementCollection from "./element.collection";

/**
 * A component object is useful when building websites using components.
 * A component can represent a collection of individual element selectors, or even contain
 * other nested component objects themselves.
 */
export default class ComponentObject extends ElementCollection {
    constructor(baseContainerFn) {
        super(baseContainerFn);
    }

    //TODO: should there be specific methods for ComponentObjects?

    __assertExists(expectation = true) {
        this.container.should(isEqual(expectation, false) ? 'not.exist' : 'exist');
    }

}
