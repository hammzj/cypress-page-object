import { IMetadata } from "@src/types/element.collection";

export interface IPageMetadata extends IMetadata {
    title?: string;
    baseUrl?: string; //If not provided, the baseUrl from the Cypress config is used
    path: string | "";
}
