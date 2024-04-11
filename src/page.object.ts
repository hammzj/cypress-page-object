import ElementCollection from "./element.collection";
import { isNil } from "lodash";

export interface IPageMetadata {
    baseUrl: string;
    path: string | "";
    title?: string;
    [key: string]: any;
}

class InsufficientPathVariablesError extends Error {
    constructor() {
        super("Not enough path variables were supplied, so path cannot be substituted"); // (1)
        this.name = "InsufficientPathVariablesError"; // (2)
    }
}

/**
 * A page object is an extension of an ElementCollection that allows associating a URL with a custom path.
 * A page can represent a collection of nested ComponentObjects, individual element selectors without a component
 * object, or both.
 */
export default class PageObject extends ElementCollection {
    static #PATH_REPLACEMENT_REGEX = /(?<pathVariable>:\w+)/g;
    protected metadata: IPageMetadata;

    /**
     * @example new PageObject(); //Index page
     * @example new PageObject({endpoint: '/settings/privacy', title: 'Privacy Settings'}); //Page with a static path
     * @example new PageObject({endpoint: '/user/:userId/post/:postId'}); //Page with path variables
     * @example new PageObject({endpoint: '/guides/overview/why-cypress', baseUrl: 'http://www.docs.cypress.io', title: 'Comprehensive Cypress Test Automation Guide | Cypress Documentation'}); //External page
     */
    constructor(metadata: Partial<IPageMetadata> = {}) {
        super();
        this.metadata = {
            baseUrl: metadata.baseUrl || Cypress.config().baseUrl || "",
            path: metadata.path || "",
            title: metadata.title,
        };
    }

    /**
     * @param pathInputs {...string} used to replace path variables. This should equal the same amount of path variables found; additional inputs will not be used
     * @return customUrl {string}
     * @example <summary>Replacing path variables with inputs</summary>
     * //baseUrl = "http://localhost:3000"
     * //this.metadata.path = "/user/:userId/post/:postId"
     * this.#customPathUrl("1234", "post-9876") => "http://localhost:3000/user/1234/post/post-9876"
     * @example <summary>A path without path variables/summary>
     * //baseUrl = "http://localhost:3000"
     * //this.metadata.path = "/settings/privacy"
     * this.#customPathUrl("1234") => "http://localhost:3000/settings/privacy" //Works, but will log an error to the console
     * @private
     */
    #customPathUrl(...pathInputs: string[]) {
        const matches = this.metadata.path.match(PageObject.#PATH_REPLACEMENT_REGEX);
        if (isNil(matches)) {
            if (process.env.CYPRESS_PAGE_OBJECT_DEBUG)
                console.error("No path variables exist found for URL path: " + this.metadata.path);
            return this.#urlObject().toString();
        }
        //Deep copy the original path
        let replacedPath = this.metadata.path.repeat(1);
        for (const pathVar of matches) {
            const sub = pathInputs.shift();
            if (isNil(sub)) {
                throw new InsufficientPathVariablesError();
            }
            replacedPath = replacedPath.replace(pathVar, sub);
        }
        if (process.env.CYPRESS_PAGE_OBJECT_DEBUG) console.debug("replacedPath", replacedPath);
        return this.#urlObject(replacedPath).toString();
    }

    #urlObject(path = this.metadata.path) {
        return new URL(path, this.metadata.baseUrl);
    }

    /**
     * Returns the full URL associated with the page
     * @param pathInputs {...string} optional pathInputs for when the path contains path variables
     * @return pageURL {string}
     */
    url(...pathInputs: string[]): string {
        return pathInputs ? this.#customPathUrl(...pathInputs) : this.#urlObject().toString();
    }

    visit(...pathInputs: string[]): void {
        cy.visit(this.url(...pathInputs));
    }

    assertIsOnPage(...pathInputs: string[]): void {
        cy.url().should("eq", this.url(...pathInputs));
    }
}
