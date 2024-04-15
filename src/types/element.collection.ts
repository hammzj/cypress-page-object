import ElementCollection from "../element.collection";

export type ElementSelectorFunction = (...params: any) => Cypress.Chainable<Cypress.JQueryWithSelector>;

export type BaseContainerFunction = ElementSelectorFunction;

export type Elements = {
    [key: string]: (...params: any) => ElementSelectorFunction;
};

export type ComponentObjectFunction = (instance: ElementCollection | any) => void;

export type NestedComponents = {
    [key: string]: (fn: ComponentObjectFunction, ...params: any) => void;
};

export interface IMetadata {
    [key: string]: any;
}
