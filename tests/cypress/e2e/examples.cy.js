import { PageObject, ComponentObject } from "../../../src";

class FooterObject extends ComponentObject {
    constructor() {
        super(() => cy.get(`footer`));
    }

    get copyright() {
        return this.container.find(`p.MuiTypography-root`);
    }
}

class ExamplePageObject extends PageObject {
    constructor() {
        super();
    }

    get appBar() {
        return cy.get(`.MuiAppBar-root`);
    }

    appLink(label) {
        return this.appBar.contains("a.MuiLink-root", label);
    }

    FooterObject(fn) {
        this._nestedObject(this.container, new FooterObject(), fn);
    }
}

const examplePageObject = new ExamplePageObject();
examplePageObject.appLink("Features").should("exist");
examplePageObject.FooterObject((footerObject) => {
    footerObject.copyright.should("have.text", "Copyright @2024");
});
