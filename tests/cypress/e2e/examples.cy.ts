import { PageObject, ComponentObject } from "../../../src";

describe("Element collections", function () {
    beforeEach(function () {
        cy.visit(Cypress.config().baseUrl);
    });

    context("Getters", function () {
        specify("element selectors in `this.elements`", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                elements = {
                    ...this.elements,
                    appBar: () => cy.get(`.MuiAppBar-root`),
                };
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appBar" is a static element selector`);
            examplePageObject.elements.appBar().should("exist").and("contain.text", "Company name");
        });

        specify("finding elements from a parent element selector", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                elements = {
                    ...this.elements,
                    appBar: () => cy.get(`.MuiAppBar-root`),
                    loginButton: () => this.elements.appBar().contains(".MuiButtonBase-root", "Login"),
                };
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"loginButton" is chained from the "appBar" static element selector`);
            examplePageObject.elements.loginButton().should("exist").and("have.class", "MuiButton-outlined");
        });

        specify("dynamic element selectors can be parameterized", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                elements = {
                    ...this.elements,
                    appBar: () => cy.get(`.MuiAppBar-root`),
                    appLink: (label?: string) =>
                        label ?
                            this.elements.appBar().contains("a.MuiLink-root", label, { matchCase: true })
                        :   this.elements.appBar().find("a.MuiLink-root"),
                };
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appLink" is dynamic because it requires a parameter and can select different types of elements`);
            examplePageObject.elements.appLink("Features").should("exist");
            examplePageObject.elements.appLink("Enterprise").should("exist");
            examplePageObject.elements.appLink("Support").should("exist");
        });

        specify("[ALTERNATIVE]: filtering getters instead of using dynamic element selectors", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                elements = {
                    ...this.elements,
                    appBar: () => cy.get(`.MuiAppBar-root`),
                    appLink: (label?: string) =>
                        label ?
                            this.elements.appBar().contains("a.MuiLink-root", label, { matchCase: true })
                        :   this.elements.appBar().find("a.MuiLink-root"),
                };
            }

            const examplePageObject = new ExamplePageObject();

            cy.log("the getter will find multiple elements because it is has a generic selector path");
            examplePageObject.elements.appLink().should("have.lengthOf", 3);

            cy.log(`To find distinct elements, filtering can be used instead of dynamic element selectors`);
            examplePageObject.elements.appLink().filter(`:contains("Features")`).should("exist");
            examplePageObject.elements.appLink().filter(`:contains("Enterprise")`).should("exist");
            examplePageObject.elements.appLink().filter(`:contains("Support")`).should("exist");
        });
    });

    describe("Component objects", function () {
        context("Nested component objects", function () {
            specify("component objects are located using a base container function", function () {
                class ProPricingCardObject extends ComponentObject {
                    constructor() {
                        super(() => cy.contains(".MuiCard-root", "Pro"));
                    }
                }

                const proPricingCardObject = new ProPricingCardObject();

                cy.log(
                    `Component objects use a base container function from which any other element selectors can be chained`
                );
                proPricingCardObject.elements.container().should("exist"); //Container is re-aliased inside of `this.elements`
                proPricingCardObject.container().should("exist");
                proPricingCardObject.container().should("have.lengthOf", 1);
            });

            specify("component objects can have their own element selectors", function () {
                class ProPricingCardObject extends ComponentObject {
                    constructor() {
                        super(() => cy.contains(".MuiCard-root", "Pro"));
                    }

                    elements = {
                        header: () => this.container().find(".MuiCardHeader-root"),
                        starIcon: () => this.elements.header().find('svg[data-testid="StarBorderIcon"]'),
                    };
                }

                const proPricingCardObject = new ProPricingCardObject();

                cy.log(`Component objects can contain element selectors`);
                proPricingCardObject.container().should("exist");
                proPricingCardObject.elements
                    .header()
                    .should("contain.text", "Pro")
                    .and("contain.text", "Most popular");
                proPricingCardObject.elements.starIcon().should("exist");
            });

            specify("nested component object base container functions can be parameterized", function () {
                class PricingCardObject extends ComponentObject {
                    constructor(title) {
                        super(() => {
                            return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                        });
                    }

                    elements = {
                        header: () => this.container().find(".MuiCardHeader-root"),
                        starIcon: () => this.elements.header().find('svg[data-testid="StarBorderIcon"]'),
                    };
                }

                const freePricingCardObject = new PricingCardObject("Free");
                const proPricingCardObject = new PricingCardObject("Pro");
                const enterprisePricingCardObject = new PricingCardObject("Enterprise");

                cy.log(`Component objects can made generic and then parameterized to select distinct components`);
                freePricingCardObject.container().should("exist").and("contain.text", "$0/mo");
                freePricingCardObject.elements.starIcon().should("not.exist");

                proPricingCardObject.container().should("exist").and("contain.text", "$15/mo");
                proPricingCardObject.elements.starIcon().should("exist");

                enterprisePricingCardObject.container().should("exist").and("contain.text", "30/mo");
                enterprisePricingCardObject.elements.starIcon().should("not.exist");
            });

            specify("[ALTERNATE]: base container functions can be updated after creation", function () {
                //This is useful when properties should be set on an object and saved.
                class PricingCardObject extends ComponentObject {
                    constructor(title) {
                        super();
                        this.metadata.title = title;
                        this.updateBaseContainerFunction = () => {
                            return cy.contains(".MuiCardHeader-content", this.metadata.title).parents(".MuiCard-root");
                        };
                    }

                    elements = {
                        ...this.elements,
                        header: () => this.container().find(".MuiCardHeader-root"),
                        starIcon: () => this.elements.header().find('svg[data-testid="StarBorderIcon"]'),
                    };
                }

                cy.log(
                    `Component objects can be parameterized.`,
                    `In this case, the distinct component is determined by its title`
                );
                const proPricingCardObject = new PricingCardObject("Pro");
                proPricingCardObject.container().should("exist").and("contain.text", "$15/mo");
                proPricingCardObject.elements.starIcon().should("exist");
            });

            specify("component objects can nested other component objects using _nestedComponent", function () {
                class PricingHeaderObject extends ComponentObject {
                    constructor() {
                        super(() => cy.get(".MuiCardHeader-root"));
                    }

                    elements = {
                        ...this.elements,
                        title: () => this.container().find(".MuiCardHeader-title"),
                        subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                        starIcon: () => this.container().find('svg[data-testid="StarBorderIcon"]'),
                    };
                }

                class PricingCardObject extends ComponentObject {
                    constructor(title) {
                        super(() => {
                            return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                        });
                    }

                    elements = {
                        ...this.elements,
                        contentContainer: () => this.container().find(".MuiCardContent-root"),
                        pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                        listItem: (label: string) => this.elements.contentContainer().contains("ul > li", label),
                        submitButton: () => this.container().find("button"),
                    };
                    components = {
                        PricingHeaderObject: (fn) =>
                            this._nestedComponent(this.container(), new PricingHeaderObject(), fn),
                    };
                }

                const proPricingCardObject = new PricingCardObject("Pro");

                cy.log("Basic element selectors");
                proPricingCardObject.elements.pricing().should("have.text", "$15/mo");
                proPricingCardObject.elements.listItem("20 users included").should("exist");
                proPricingCardObject.elements.submitButton().should("have.text", "Get started");

                cy.log(
                    `Nested component object named "PricingHeaderObject"`,
                    `Because it exists within the outer component object named "PricingCardObject", using cy.get will only be performed inside of the base container of the outer object`
                );
                proPricingCardObject.components.PricingHeaderObject((pricingHeaderObject: PricingHeaderObject) => {
                    pricingHeaderObject.elements.title().should("have.text", "Pro");
                    pricingHeaderObject.elements.subtitle().should("have.text", "Most popular");
                    pricingHeaderObject.elements.starIcon().should("exist");
                });
            });

            specify(
                "[ALTERNATIVE]: component objects can nested other component objects using cy.within()",
                function () {
                    class PricingHeaderObject extends ComponentObject {
                        constructor() {
                            super(() => cy.get(".MuiCardHeader-root"));
                        }

                        elements = {
                            ...this.elements,
                            title: () => this.container().find(".MuiCardHeader-title"),
                            subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                            starIcon: () => this.container().find('svg[data-testid="StarBorderIcon"]'),
                        };
                    }

                    class PricingCardObject extends ComponentObject {
                        constructor(title) {
                            super(() => {
                                return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                            });
                        }

                        elements = {
                            ...this.elements,
                            contentContainer: () => this.container().find(".MuiCardContent-root"),
                            pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                            listItem: (label: string) => this.elements.contentContainer().contains("ul > li", label),
                            submitButton: () => this.container().find("button"),
                        };
                        components = {
                            PricingHeaderObject: (fn) => this.container().within(() => fn(new PricingHeaderObject())),
                        };
                    }

                    const proPricingCardObject = new PricingCardObject("Pro");

                    cy.log(
                        `The function above for PricingHeaderObject is functionally equivalent to using "this._nestedComponent"`
                    );
                    proPricingCardObject.components.PricingHeaderObject((pricingHeaderObject: PricingHeaderObject) => {
                        pricingHeaderObject.elements.title().should("have.text", "Pro");
                        pricingHeaderObject.elements.subtitle().should("have.text", "Most popular");
                        pricingHeaderObject.elements.starIcon().should("exist");
                    });
                }
            );

            specify("nested component objects can be parameterized", function () {
                class LinkListObject extends ComponentObject {
                    constructor(title) {
                        super(() => {
                            return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                        });
                    }

                    elements = {
                        link: (label: string) => this.container().contains("a", label, { matchCase: true }),
                    };
                }

                class FooterObject extends ComponentObject {
                    constructor() {
                        super(() => cy.get(`footer`));
                    }

                    elements = {
                        gridLayout: () => this.container().find(`.MuiGrid-container`),
                        copyright: () => this.container().find(`p.MuiTypography-root`),
                    };
                    components = {
                        LinkListObject: (title, fn) => {
                            this._nestedComponent(this.elements.gridLayout(), new LinkListObject(title), fn);
                        },
                    };
                }

                const footerObject = new FooterObject();

                cy.log(
                    "Nested component objects can be parameterized to find distinct instances inside of a parent component object"
                );
                footerObject.components.LinkListObject("Company", (linkListObject) => {
                    ["Team", "History", "Contact us", "Locations"].forEach((i) => {
                        linkListObject.elements.link(i).should("exist");
                    });
                });

                footerObject.components.LinkListObject("Features", (linkListObject) => {
                    ["Cool stuff", "Random feature", "Team feature", "Developer stuff", "Another one"].forEach((i) => {
                        linkListObject.elements.link(i).should("exist");
                    });
                });
            });

            specify("component objects can utilize app actions", function () {
                class LinkListObject extends ComponentObject {
                    constructor(title) {
                        super(() => {
                            return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                        });
                    }

                    elements = {
                        link: () => this.container().find("ul > li"),
                    };

                    //app action to perform an assertion
                    assertLinksInOrder(...labels: string[]) {
                        cy.log("labels", labels);
                        console.log("labels", labels);
                        this.elements.link().each(($link) => {
                            cy.wrap($link).should("have.text", labels.shift());
                        });
                    }
                }

                class FooterObject extends ComponentObject {
                    constructor() {
                        super(() => cy.get(`footer`));
                    }

                    elements = {
                        gridLayout: () => this.container().find(`.MuiGrid-container`),
                        copyright: () => this.container().find(`p.MuiTypography-root`),
                    };
                    components = {
                        LinkListObject: (title, fn) => {
                            this._nestedComponent(this.elements.gridLayout(), new LinkListObject(title), fn);
                        },
                    };

                    //app action to perform a page action
                    visitCopyrightLink() {
                        this.elements.copyright().find("a").click();
                    }
                }

                const footerObject = new FooterObject();

                footerObject.components.LinkListObject("Company", (listLinkObject) => {
                    listLinkObject.container().should("exist");
                    cy.log(`app action to perform an assertion`);
                    listLinkObject.assertLinksInOrder("Team", "History", "Contact us", "Locations");
                });

                cy.log(`app action to perform a page action`);
                footerObject.visitCopyrightLink();
            });

            specify(
                "different indices can change with which nested component is currently being interacted",
                function () {
                    class LinkListObject extends ComponentObject {
                        //This time, the base container is going to be generically located
                        //So there is a chance for it to find more than one instance.
                        //Thus, setting the index is important
                        constructor() {
                            super(() => {
                                return cy.get(".MuiTypography-h6").parent(".MuiGrid-item");
                            });
                        }

                        elements = {
                            title: () => this.container().find(".MuiTypography-h6"),
                            link: () => this.container().find("ul > li"),
                        };

                        //app action to perform an assertion
                        assertLinksInOrder(...labels: string[]) {
                            cy.log("labels", labels);
                            console.log("labels", labels);
                            this.elements.link().each(($link) => {
                                cy.wrap($link).should("have.text", labels.shift());
                            });
                        }
                    }

                    class FooterObject extends ComponentObject {
                        constructor() {
                            super(() => cy.get(`footer`));
                        }

                        elements = {
                            gridLayout: () => this.container().find(`.MuiGrid-container`),
                        };

                        components = {
                            LinkListObject: (fn) =>
                                this._nestedComponent(this.elements.gridLayout(), new LinkListObject(), fn),
                        };
                    }

                    const footerObject = new FooterObject();

                    cy.log(
                        `The nested component object has a generic base container function, so we cannot perform actions on the entire set.`,
                        `This is checked with "this.getAllContainers" to see the number of instances returned from the base container function`
                    );
                    footerObject.components.LinkListObject((linkListObject) => {
                        linkListObject.getAllContainers().should("have.lengthOf", 4);
                    });

                    cy.log(
                        `By setting the scoped index of the nested component object, actions can be performed successfully on distinct components`
                    );
                    footerObject.components.LinkListObject((listLinkObject) => {
                        listLinkObject.scopedIndex = 0;
                        listLinkObject.elements.title().should("have.text", "Company");
                    });
                    footerObject.components.LinkListObject((listLinkObject) => {
                        listLinkObject.scopedIndex = 1;
                        listLinkObject.elements.title().should("have.text", "Features");
                    });
                    footerObject.components.LinkListObject((listLinkObject) => {
                        listLinkObject.scopedIndex = 2;
                        listLinkObject.elements.title().should("have.text", "Resources");
                    });
                    footerObject.components.LinkListObject((listLinkObject) => {
                        listLinkObject.scopedIndex = 3;
                        listLinkObject.elements.title().should("have.text", "Legal");
                    });
                }
            );

            specify.only("component objects can be cloned", function () {
                class LinkListObject extends ComponentObject {
                    //This time, the base container is going to be generically located
                    //So there is a chance for it to find more than one instance.
                    //Thus, setting the index is important
                    constructor() {
                        super(() => {
                            return cy.get(".MuiTypography-h6").parent(".MuiGrid-item");
                        });
                    }

                    elements = {
                        title: () => this.container().find(".MuiTypography-h6"),
                        link: () => this.container().find("ul > li"),
                    };

                    //app action to perform an assertion
                    assertLinksInOrder(...labels: string[]) {
                        cy.log("labels", labels);
                        console.log("labels", labels);
                        this.elements.link().each(($link) => {
                            cy.wrap($link).should("have.text", labels.shift());
                        });
                    }
                }

                const linkListObject = new LinkListObject();

                cy.log(
                    `To select iterative components from a generic base container function, cloning the base instance and changing properties afterwards is also possible`
                );
                cy.log(`This is the first distinct component object created from the generic "linkListObject"`);
                const firstLinkListObject = linkListObject._clone();
                firstLinkListObject.scopedIndex = 0;
                firstLinkListObject.elements.title().should("have.text", "Company");

                cy.log(`This is the second distinct component object created from the generic "linkListObject"`);
                const secondLinkListObject = linkListObject._clone();
                secondLinkListObject.scopedIndex = 1;
                secondLinkListObject.elements.title().should("have.text", "Features");
            });
        });

        context("class app actions", function () {
            specify("assertNoneExist", function () {
                class AlertObject extends ComponentObject {
                    constructor() {
                        super(() => {
                            //This does not exist
                            return cy.get("div.alert");
                        });
                    }
                }

                const alertObject = new AlertObject();

                alertObject.getAllContainers().should("have.lengthOf", 0); //Ensuring no elements exist
                alertObject.assertNoneExist(); //Should succeed
            });

            context("assertExists", function () {
                it("succeeds when the component container exists", function () {
                    class PricingCardObject extends ComponentObject {
                        constructor(title) {
                            super(() => {
                                return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                            });
                        }
                    }

                    const pricingCardObject = new PricingCardObject("Free");
                    pricingCardObject.assertExists(true);
                });

                it("succeeds when the component container does not exist", function () {
                    class PricingCardObject extends ComponentObject {
                        constructor(title) {
                            super(() => {
                                return cy.contains(".MuiCard-root", title);
                            });
                        }
                    }

                    const pricingCardObject = new PricingCardObject("NOT FREE");
                    pricingCardObject.assertExists(false);
                });

                it("succeeds when the component container does not exist and the scoped index is above 0", function () {
                    class PricingCardObject extends ComponentObject {
                        constructor(title) {
                            super(() => {
                                return cy.contains(".MuiCard-root", title);
                            });
                        }
                    }

                    const pricingCardObject = new PricingCardObject("Free");
                    pricingCardObject.assertExists(true);

                    pricingCardObject.scopedIndex = 1;
                    pricingCardObject.assertExists(false);
                });
            });
        });
    });

    context("Page objects", function () {
        specify("Page objects can have nested component objects", function () {
            class AppBar extends ComponentObject {
                constructor() {
                    super(() => cy.get(".MuiAppBar-root"));
                }

                link(label) {
                    return this.container.contains("a.MuiLink-root", label, { matchCase: true });
                }

                get loginButton() {
                    return this.container.find(".MuiButtonBase-root");
                }
            }

            class PricingHeaderObject extends ComponentObject {
                constructor() {
                    super(() => cy.get(".MuiCardHeader-root"));
                }

                get title() {
                    return this.container.find(".MuiCardHeader-title");
                }

                get subtitle() {
                    return this.container.find(".MuiCardHeader-subheader");
                }

                get starIcon() {
                    return this.container.find('svg[data-testid="StarBorderIcon"]');
                }
            }

            class PricingCardObject extends ComponentObject {
                constructor(title) {
                    super(() => {
                        return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                    });
                }

                PricingHeaderObject(fn) {
                    this._nestedComponent(this.container, new PricingHeaderObject(), fn);
                }

                get contentContainer() {
                    return this.container.find(".MuiCardContent-root");
                }

                get pricing() {
                    return this.contentContainer.find(".MuiBox-root");
                }

                listItem(label) {
                    return this.contentContainer.contains("ul > li", label);
                }

                get submitButton() {
                    return this.container.find("button");
                }
            }

            class LinkListObject extends ComponentObject {
                constructor(title) {
                    super(() => {
                        return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                    });
                }

                get link() {
                    return this.container.find("ul > li");
                }

                //app action to perform an assertion
                __assertLinksInOrder(...labels) {
                    cy.log("labels", labels);
                    console.log("labels", labels);
                    this.link.each(($link) => {
                        cy.wrap($link).should("have.text", labels.shift());
                    });
                }
            }

            class FooterObject extends ComponentObject {
                constructor() {
                    super(() => cy.get(`footer`));
                }

                get gridLayout() {
                    return this.container.find(`.MuiGrid-container`);
                }

                get copyright() {
                    return this.container.find(`p.MuiTypography-root`);
                }

                LinkListObject(title, fn) {
                    this._nestedComponent(this.gridLayout, new LinkListObject(title), fn);
                }

                //app action to perform a page action
                __visitCopyrightLink() {
                    this.copyright.find("a").click();
                }
            }

            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                AppBar(fn) {
                    this._nestedComponent(this.container, new AppBar(), fn);
                }

                get main() {
                    return this.container.find("main").first();
                }

                get contentTitle() {
                    return this.main.find("h1");
                }

                get contentDescription() {
                    return this.contentTitle.next();
                }

                PricingCardObject(title, fn) {
                    this._nestedComponent(this.container, new PricingCardObject(title), fn);
                }

                FooterObject(fn) {
                    this._nestedComponent(this.container, new FooterObject(), fn);
                }
            }

            cy.log("This is a full example of putting it all together");
            const examplePageObject = new ExamplePageObject();
            examplePageObject.components.AppBar((appBar) => {
                appBar.loginButton.should("exist");
                appBar.link("Features").should("exist");
                appBar.link("Enterprise").should("exist");
                appBar.link("Support").should("exist");
            });
            examplePageObject.components.contentTitle.should("have.text", "Pricing");
            examplePageObject.components.contentDescription.should(
                "have.text",
                `Quickly build an effective pricing table for your potential customers with this layout. It's built with default MUI components with little customization.`
            );
            examplePageObject.components.PricingCardObject("Free", (pricingCardObject) => {
                pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                    pricingHeaderObject.starIcon.should("not.exist");
                    pricingCardObject.pricing.should("have.text", "$0/mo");
                });
            });
            examplePageObject.components.PricingCardObject("Pro", (pricingCardObject) => {
                pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                    pricingHeaderObject.starIcon.should("exist");
                    pricingCardObject.pricing.should("have.text", "$15/mo");
                });
            });
            examplePageObject.components.PricingCardObject("Enterprise", (pricingCardObject) => {
                pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                    pricingHeaderObject.starIcon.should("not.exist");
                    pricingCardObject.pricing.should("have.text", "$30/mo");
                });
            });
            examplePageObject.components.FooterObject((footerObject) => {
                footerObject.LinkListObject("Company", (linkListObject) => {
                    linkListObject.__assertLinksInOrder("Team", "History", "Contact us", "Locations");
                });
            });
        });

        context("class app actions", function () {
            specify("assertIsOnPage succeeds on a basic url", function () {
                cy.wrap(new URL("/about", Cypress.config().baseUrl).toString()).as("path");
                cy.stub(cy, "url").returns(cy.get("@path"));

                new PageObject({ path: `/about` }).assertIsOnPage(); //Should succeed
            });

            specify("assertIsOnPage succeeds on correct path replacement", function () {
                cy.wrap(new URL("/user/1234/blog/id-abcd", Cypress.config().baseUrl).toString()).as("path");
                cy.stub(cy, "url").returns(cy.get("@path"));

                new PageObject({ path: `/user/:userId/blog/:blogId` }).assertIsOnPage("1234", "id-abcd"); //Should succeed
            });

            specify(`"url" returns the url specified for the page object`, function () {
                class ExamplePageObject extends PageObject {
                    constructor(path) {
                        super({ path });
                    }
                }

                const examplePageObject = new ExamplePageObject();
                expect(examplePageObject.url()).to.eq(Cypress.config().baseUrl);

                const examplePageObjectWithPath = new ExamplePageObject("/about");
                expect(examplePageObjectWithPath.url()).to.eq(new URL("/about", Cypress.config().baseUrl).toString());
            });

            specify(`path variables can be set using path inputs`, function () {
                class ExamplePageObject extends PageObject {
                    constructor(metadata) {
                        super(metadata);
                    }
                }

                const examplePageObjectWithNoInputs = new ExamplePageObject({ path: `/user` });
                expect(examplePageObjectWithNoInputs.url("1234")).to.eq(
                    new URL("/user", Cypress.config().baseUrl).toString()
                );

                const examplePageObjectWithSingleInput = new ExamplePageObject({ path: `/user/:userId` });
                expect(examplePageObjectWithSingleInput.url("1234")).to.eq(
                    new URL("/user/1234", Cypress.config().baseUrl).toString()
                );

                const examplePageObjectWithMultipleInputs = new ExamplePageObject({
                    path: `/user/:userId/blog/:blogId`,
                });
                expect(examplePageObjectWithMultipleInputs.url("1234", "abcd")).to.eq(
                    new URL("/user/1234/blog/abcd", Cypress.config().baseUrl).toString()
                );
                expect(examplePageObjectWithMultipleInputs.url("1234", "abcd", "WXYZ")).to.eq(
                    new URL("/user/1234/blog/abcd", Cypress.config().baseUrl).toString()
                );
                expect(() => examplePageObjectWithMultipleInputs.url("1234")).to.throw(
                    "Not enough path variables were supplied, so path cannot be substituted"
                );
            });
        });
    });
});
