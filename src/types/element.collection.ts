import ElementCollection from "../element.collection";

export type BaseContainerFunction = () => Cypress.Chainable<Cypress.JQueryWithSelector>;

export type Elements = {
    [key: string]: (...params: any) => Cypress.Chainable<Cypress.JQueryWithSelector>;
};

export type ComponentObjectFunction = (instance: ElementCollection | any) => void;

export type NestedComponents = {
    [key: string]: (fn: ComponentObjectFunction, ...params: any) => void;
};

export interface IMetadata {
    [key: string]: any;
}
