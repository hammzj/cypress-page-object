import { PageObject, ComponentObject } from "../../../src";

describe("Page objects", function () {
    beforeEach(function () {
        cy.visit(Cypress.config().baseUrl);
    });

    context("Getters", function () {
        specify("element selectors as getters", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get banner() {
                    return cy.get(`.banner`);
                }
            }

            const examplePageObject = new ExamplePageObject();

            //banner is a static element selector
            examplePageObject.banner.should("exist").and("contain.text", "Kitchen Sink");
        });

        specify("getters from another element selector", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get banner() {
                    return cy.get(`.banner`);
                }

                get bannerTitle() {
                    return this.banner.find("h1");
                }
            }

            const examplePageObject = new ExamplePageObject();

            //bannerTitle is chained from another static element selector
            examplePageObject.bannerTitle.should("exist").and("have.text", "Kitchen Sink");
        });

        specify("dynamic element selectors are parameterized", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get banner() {
                    return cy.get(`.banner`);
                }

                bannerLink(label) {
                    return this.banner.contains("a", label, { matchCase: true });
                }
            }

            const examplePageObject = new ExamplePageObject();

            //bannerLink is dynamic because it requires a parameter and can select different types of elements
            examplePageObject.bannerLink("Cypress.io").should("exist");
            examplePageObject.bannerLink("docs.cypress.io").should("exist");
        });

        specify("[ALTERNATIVE]: filtering getters instead of using dynamic element selectors", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get banner() {
                    return cy.get(`.banner`);
                }

                get bannerLink() {
                    return this.banner.contains("a");
                }
            }

            const examplePageObject = new ExamplePageObject();

            //filtering can also be used instead of dynamic element selectors
            examplePageObject.bannerLink.filter(`:contains("docs.cypress.io")`).should("exist");
        });
    });

    context("Nested component objects", function () {
        specify("component objects are located using a base container function", function () {
            class BannerObject extends ComponentObject {
                constructor() {
                    super(() => cy.get(".banner"));
                }
            }

            const bannerObject = new BannerObject();

            bannerObject.container.should("exist");
        });

        specify("component objects can have their own element selectors", function () {
            class BannerObject extends ComponentObject {
                constructor() {
                    super(() => cy.get(".banner"));
                }

                get title() {
                    return this.container.find("h1");
                }

                get subtitle() {
                    return this.container.find("p");
                }

                bannerLink(label) {
                    return this.subtitle.contains("a", label, { matchCase: true });
                }

                get genericBannerLink() {
                    return this.subtitle.find("a");
                }
            }

            const bannerObject = new BannerObject();

            bannerObject.container.should("exist");
            bannerObject.title.should("have.text", "Kitchen Sink");
            bannerObject.subtitle.should("contain.text", "This is an example app used to showcase Cypress.io testing");
            bannerObject.bannerLink("Cypress.io").should("exist");
            bannerObject.genericBannerLink.filter(`:contains("docs.cypress.io")`).should("exist");
        });

        specify("component objects can nested other component objects using _nestedObject", function () {
            class CommandsListObject extends ComponentObject {
                constructor(sectionTitle) {
                    super(() => {
                        this._sectionTitle = sectionTitle;
                        return cy.get(".home-list").contains("li", this._sectionTitle, { matchCase: true });
                    });
                }

                get sectionTitleLink() {
                    return this.container.contains("a", this._sectionTitle, {
                        matchCase: true,
                    });
                }

                commandLink(label) {
                    return this.container.find("ul > li").contains(`a`, label, { matchCase: true });
                }
            }

            class CommandsContainerObject extends ComponentObject {
                constructor() {
                    super(() => {
                        return cy.contains(`h2`, "Commands", { matchCase: true }).parents(".banner-alt").next();
                    });
                }

                get banner() {
                    return this.container.prev();
                }

                QueryingCommandsListObject(fn) {
                    this._nestedObject(this.container, new CommandsListObject("Querying"), fn);
                }
            }

            const commandsContainerObject = new CommandsContainerObject();

            commandsContainerObject.banner.should("contain.text", "Commands");

            commandsContainerObject.QueryingCommandsListObject((nestedObject) => {
                nestedObject.sectionTitleLink.should("have.text", "Querying");
                nestedObject.commandLink("get").should("exist");
                nestedObject.commandLink("contains").should("exist");
                nestedObject.commandLink("within").should("exist");
                nestedObject.commandLink("root").should("exist");
            });
        });

        specify("[ALTERNATIVE]: component objects can nested other component objects using cy.within()", function () {
            class CommandsListObject extends ComponentObject {
                constructor(sectionTitle) {
                    super(() => {
                        this._sectionTitle = sectionTitle;
                        return cy.get(".home-list").contains("li", this._sectionTitle, { matchCase: true });
                    });
                }

                get sectionTitleLink() {
                    return this.container.contains("a", this._sectionTitle, {
                        matchCase: true,
                    });
                }

                commandLink(label) {
                    return this.container.find("ul > li").contains(`a`, label, { matchCase: true });
                }
            }

            class CommandsContainerObject extends ComponentObject {
                constructor() {
                    super(() => {
                        return cy.contains(`h2`, "Commands", { matchCase: true }).parents(".banner-alt").next();
                    });
                }

                get banner() {
                    return this.container.prev();
                }

                QueryingCommandsListObject(fn) {
                    //functionally equivalent to using "this._nestedObject"
                    this.container.within(() => fn(new CommandsListObject("Querying")));
                }
            }

            const commandsContainerObject = new CommandsContainerObject();

            commandsContainerObject.banner.should("contain.text", "Commands");

            commandsContainerObject.QueryingCommandsListObject((nestedObject) => {
                nestedObject.sectionTitleLink.should("have.text", "Querying");
                nestedObject.commandLink("get").should("exist");
                nestedObject.commandLink("contains").should("exist");
                nestedObject.commandLink("within").should("exist");
                nestedObject.commandLink("root").should("exist");
            });
        });

        specify("nested component objects can be parameterized", function () {});

        //TODO
        specify(
            "different indices can change with which nested component is currently being interacted",
            function () {}
        );

        //TODO
        specify("page objects can have component objects", function () {});
    });
});
