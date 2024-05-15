import ElementCollection from "../element.collection";

export type ElementSelectorFunction<Element extends Node = HTMLElement> = (
    ...params: any
) => Cypress.Chainable<JQuery<Element>>;
export type BaseContainerFunction<Element extends Node = HTMLElement> = ElementSelectorFunction<Element>;

export type Elements = {
    [key: string]: ElementSelectorFunction<any>;
};

export type ComponentObjectFunction = (instance: ElementCollection | any) => void;

export type NestedComponents = {
    [key: string]: (fn: ComponentObjectFunction, ...params: any) => void;
};

export interface IMetadata {
    [key: string]: any;
}
