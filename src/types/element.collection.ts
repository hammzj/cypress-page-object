import ComponentObject from "../component.object";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ElementSelectorFunction<TElement extends Node = HTMLElement> = (
    ...params: any
) => Cypress.Chainable<JQuery<TElement>>;
export type BaseContainerFunction<TElement extends Node = HTMLElement> = ElementSelectorFunction<TElement>;

export type Elements = {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    [key: string]: ElementSelectorFunction<any>;
};

export type ComponentObjectFunction<TComponentObject extends ComponentObject> = (instance: TComponentObject) => void;

export interface NestedComponents {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    [key: string]: (fn: ComponentObjectFunction<any>, ...params: any) => void;
}

export interface IMetadata {
    [key: string]: any;
}
