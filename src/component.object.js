import {isEqual} from "lodash";
import ElementCollection from "./element.collection";

export default class ComponentObject extends ElementCollection {
    constructor(baseContainerFn) {
        super(baseContainerFn);
    }

    //TODO: should there be specific methods for ComponentObjects?

    __assertExists(expectation = true) {
        this.container.should(isEqual(expectation, false) ? 'not.exist' : 'exist');
    }

}
