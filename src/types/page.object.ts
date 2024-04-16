import { IMetadata } from "./element.collection";

/**
 * [title=] {string} Page title
 * [title=] {string} If not provided, the baseUrl from the Cypress config is used from `Cypress.config().baseUrl
 * [path=""] {string} Path to append to baseUrl. Can use dynamic path replacements like `/token/:someId`
 */
export interface IPageMetadata extends IMetadata {
    title?: string;
    baseUrl?: string;
    path: string | "";
}
