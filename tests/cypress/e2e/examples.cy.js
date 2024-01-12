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

                get appBar() {
                    return cy.get(`.MuiAppBar-root`);
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appBar" is a static element selector`);
            examplePageObject.appBar.should("exist").and("contain.text", "Company name");
        });

        specify("getters from another element selector", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get appBar() {
                    return cy.get(`.MuiAppBar-root`);
                }

                get loginButton() {
                    return this.appBar.contains(".MuiButtonBase-root", "Login");
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"loginButton" is chained from the "appBar" static element selector`);
            examplePageObject.loginButton.should("exist").and("have.class", "MuiButton-outlined");
        });

        specify("dynamic element selectors are parameterized", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get appBar() {
                    return cy.get(`.MuiAppBar-root`);
                }

                appLink(label) {
                    return this.appBar.contains("a.MuiLink-root", label, { matchCase: true });
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appLink" is dynamic because it requires a parameter and can select different types of elements`);
            examplePageObject.appLink("Features").should("exist");
            examplePageObject.appLink("Enterprise").should("exist");
            examplePageObject.appLink("Support").should("exist");
        });

        specify("[ALTERNATIVE]: filtering getters instead of using dynamic element selectors", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super();
                }

                get appBar() {
                    return cy.get(`.MuiAppBar-root`);
                }

                get appLink() {
                    return this.appBar.find("a.MuiLink-root");
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log("the getter will find multiple elements because it is has a generic selector path");
            examplePageObject.appLink.should("have.lengthOf", 3);

            cy.log(`To find distinct elements, filtering can be used instead of dynamic element selectors`);
            examplePageObject.appLink.filter(`:contains("Features")`).should("exist");
            examplePageObject.appLink.filter(`:contains("Enterprise")`).should("exist");
            examplePageObject.appLink.filter(`:contains("Support")`).should("exist");
        });
    });

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
            proPricingCardObject.container.should("exist");
            proPricingCardObject.container.should("have.lengthOf", 1);
        });

        specify("component objects can have their own element selectors", function () {
            class ProPricingCardObject extends ComponentObject {
                constructor() {
                    super(() => cy.contains(".MuiCard-root", "Pro"));
                }

                get header() {
                    return this.container.find(".MuiCardHeader-root");
                }

                get starIcon() {
                    return this.header.find('svg[data-testid="StarBorderIcon"]');
                }
            }

            const proPricingCardObject = new ProPricingCardObject();

            cy.log(`Component objects can contain element selectors`);
            proPricingCardObject.container.should("exist");
            proPricingCardObject.header.should("contain.text", "Pro").and("contain.text", "Most popular");
            proPricingCardObject.starIcon.should("exist");
        });

        specify("nested component object base container functions can be parameterized", function () {
            class PricingCardObject extends ComponentObject {
                constructor(title) {
                    super(() => {
                        return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                    });
                }

                get header() {
                    return this.container.find(".MuiCardHeader-root");
                }

                get starIcon() {
                    return this.header.find('svg[data-testid="StarBorderIcon"]');
                }
            }

            const freePricingCardObject = new PricingCardObject("Free");
            const proPricingCardObject = new PricingCardObject("Pro");
            const enterprisePricingCardObject = new PricingCardObject("Enterprise");

            cy.log(`Component objects can made generic and then parameterized to select distinct components`);
            freePricingCardObject.container.should("exist").and("contain.text", "$0/mo");
            freePricingCardObject.starIcon.should("not.exist");

            proPricingCardObject.container.should("exist").and("contain.text", "$15/mo");
            proPricingCardObject.starIcon.should("exist");

            enterprisePricingCardObject.container.should("exist").and("contain.text", "30/mo");
            enterprisePricingCardObject.starIcon.should("not.exist");
        });

        specify("[ALTERNATE]: base container functions can be updated after creation", function () {
            //This is useful when properties should be set on an object and saved.
            class PricingCardObject extends ComponentObject {
                constructor(title) {
                    super();
                    this._title = title;
                    this.updateBaseContainerFunction = () => {
                        return cy.contains(".MuiCardHeader-content", this._title).parents(".MuiCard-root");
                    };
                }

                get header() {
                    return this.container.find(".MuiCardHeader-root");
                }

                get starIcon() {
                    return this.header.find('svg[data-testid="StarBorderIcon"]');
                }
            }

            cy.log(
                `Component objects can be parameterized.`,
                `In this case, the distinct component is determined by its title`
            );
            const proPricingCardObject = new PricingCardObject("Pro");
            proPricingCardObject.container.should("exist").and("contain.text", "$15/mo");
            proPricingCardObject.starIcon.should("exist");
        });

        specify("component objects can nested other component objects using _nestedObject", function () {
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
                    this._nestedObject(this.container, new PricingHeaderObject(), fn);
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

            const proPricingCardObject = new PricingCardObject("Pro");

            cy.log("Basic element selectors");
            proPricingCardObject.pricing.should("have.text", "$15/mo");
            proPricingCardObject.listItem("20 users included").should("exist");
            proPricingCardObject.submitButton.should("have.text", "Get started");

            cy.log(
                `Nested component object named "PricingHeaderObject"`,
                `Because it exists within the outer component object named "PricingCardObject", using cy.get will only be performed inside of the base container of the outer object`
            );
            proPricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                pricingHeaderObject.title.should("have.text", "Pro");
                pricingHeaderObject.subtitle.should("have.text", "Most popular");
                pricingHeaderObject.starIcon.should("exist");
            });
        });

        specify("[ALTERNATIVE]: component objects can nested other component objects using cy.within()", function () {
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
                    //functionally equivalent to using "this._nestedObject"
                    this.container.within(() => fn(new PricingHeaderObject()));
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

            const proPricingCardObject = new PricingCardObject("Pro");

            cy.log(
                `The function above for PricingHeaderObject is functionally equivalent to using "this._nestedObject"`
            );
            proPricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                pricingHeaderObject.title.should("have.text", "Pro");
                pricingHeaderObject.subtitle.should("have.text", "Most popular");
                pricingHeaderObject.starIcon.should("exist");
            });
        });

        specify("nested component objects can be parameterized", function () {
            class LinkListObject extends ComponentObject {
                constructor(title) {
                    super(() => {
                        return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                    });
                }

                link(label) {
                    return this.container.contains("a", label, { matchCase: true });
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
                    this._nestedObject(this.gridLayout, new LinkListObject(title), fn);
                }
            }

            const footerObject = new FooterObject();

            cy.log(
                "Nested component objects can be parameterized to find distinct instances inside of a parent component object"
            );
            footerObject.LinkListObject("Company", (linkListObject) => {
                ["Team", "History", "Contact us", "Locations"].forEach((i) => {
                    linkListObject.link(i).should("exist");
                });
            });

            footerObject.LinkListObject("Features", (linkListObject) => {
                ["Cool stuff", "Random feature", "Team feature", "Developer stuff", "Another one"].forEach((i) => {
                    linkListObject.link(i).should("exist");
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
                    this._nestedObject(this.gridLayout, new LinkListObject(title), fn);
                }

                //app action to perform a page action
                __visitCopyrightLink() {
                    this.copyright.find("a").click();
                }
            }

            const footerObject = new FooterObject();

            footerObject.LinkListObject("Company", (listLinkObject) => {
                listLinkObject.container.should("exist");
                cy.log(`app action to perform an assertion`);
                listLinkObject.__assertLinksInOrder("Team", "History", "Contact us", "Locations");
            });

            cy.log(`app action to perform a page action`);
            footerObject.__visitCopyrightLink();
        });

        specify("different indices can change with which nested component is currently being interacted", function () {
            class LinkListObject extends ComponentObject {
                //This time, the base container is going to be generically located
                //So there is a chance for it to find more than one instance.
                //Thus, setting the index is important
                constructor() {
                    super(() => {
                        return cy.get(".MuiTypography-h6").parent(".MuiGrid-item");
                    });
                }

                get title() {
                    return this.container.find(".MuiTypography-h6");
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

                LinkListObject(fn) {
                    this._nestedObject(this.gridLayout, new LinkListObject(), fn);
                }
            }

            const footerObject = new FooterObject();

            cy.log(
                `The nested component object has a generic base container function, so we cannot perform actions on the entire set.`,
                `This is checked with "this.getAllContainers" to see the number of instances returned from the base container function`
            );
            footerObject.LinkListObject((linkListObject) => {
                linkListObject.getAllContainers().should("have.lengthOf", 4);
            });

            cy.log(
                `By setting the scoped index of the nested component object, actions can be performed successfully on distinct components`
            );
            footerObject.LinkListObject((listLinkObject) => {
                listLinkObject.scopedIndex = 0;
                listLinkObject.title.should("have.text", "Company");
            });
            footerObject.LinkListObject((listLinkObject) => {
                listLinkObject.scopedIndex = 1;
                listLinkObject.title.should("have.text", "Features");
            });
            footerObject.LinkListObject((listLinkObject) => {
                listLinkObject.scopedIndex = 2;
                listLinkObject.title.should("have.text", "Resources");
            });
            footerObject.LinkListObject((listLinkObject) => {
                listLinkObject.scopedIndex = 3;
                listLinkObject.title.should("have.text", "Legal");
            });
        });

        specify("component objects can be cloned", function () {
            class LinkListObject extends ComponentObject {
                //This time, the base container is going to be generically located
                //So there is a chance for it to find more than one instance.
                //Thus, setting the index is important
                constructor() {
                    super(() => {
                        return cy.get(".MuiTypography-h6").parent(".MuiGrid-item");
                    });
                }

                get title() {
                    return this.container.find(".MuiTypography-h6");
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

            const linkListObject = new LinkListObject();

            cy.log(
                `To select iterative components from a generic base container function, cloning the base instance and changing properties afterwards is also possible`
            );
            cy.log(`This is the first distinct component object created from the generic "linkListObject"`);
            const firstLinkListObject = linkListObject._clone();
            firstLinkListObject.scopedIndex = 0;
            firstLinkListObject.title.should("have.text", "Company");

            cy.log(`This is the second distinct component object created from the generic "linkListObject"`);
            const secondLinkListObject = linkListObject._clone();
            secondLinkListObject.scopedIndex = 1;
            secondLinkListObject.title.should("have.text", "Features");
        });
    });

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
                this._nestedObject(this.container, new PricingHeaderObject(), fn);
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
                this._nestedObject(this.gridLayout, new LinkListObject(title), fn);
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
                this._nestedObject(this.container, new AppBar(), fn);
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
                this._nestedObject(this.container, new PricingCardObject(title), fn);
            }

            FooterObject(fn) {
                this._nestedObject(this.container, new FooterObject(), fn);
            }
        }

        cy.log("This is a full example of putting it all together");
        const examplePageObject = new ExamplePageObject();
        examplePageObject.AppBar((appBar) => {
            appBar.loginButton.should("exist");
            appBar.link("Features").should("exist");
            appBar.link("Enterprise").should("exist");
            appBar.link("Support").should("exist");
        });
        examplePageObject.contentTitle.should("have.text", "Pricing");
        examplePageObject.contentDescription.should(
            "have.text",
            `Quickly build an effective pricing table for your potential customers with this layout. It's built with default MUI components with little customization.`
        );
        examplePageObject.PricingCardObject("Free", (pricingCardObject) => {
            pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                pricingHeaderObject.starIcon.should("not.exist");
                pricingCardObject.pricing.should("have.text", "$0/mo");
            });
        });
        examplePageObject.PricingCardObject("Pro", (pricingCardObject) => {
            pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                pricingHeaderObject.starIcon.should("exist");
                pricingCardObject.pricing.should("have.text", "$15/mo");
            });
        });
        examplePageObject.PricingCardObject("Enterprise", (pricingCardObject) => {
            pricingCardObject.PricingHeaderObject((pricingHeaderObject) => {
                pricingHeaderObject.starIcon.should("not.exist");
                pricingCardObject.pricing.should("have.text", "$30/mo");
            });
        });
        examplePageObject.FooterObject((footerObject) => {
            footerObject.LinkListObject("Company", (linkListObject) => {
                linkListObject.__assertLinksInOrder("Team", "History", "Contact us", "Locations");
            });
        });
    });

    context("class app actions", function () {
        specify("__assertIsOnPage", function () {
            class ExamplePageObject extends PageObject {
                constructor() {
                    super("/");
                }
            }

            const examplePageObject = new ExamplePageObject();
            examplePageObject.__assertIsOnPage();
        });

        specify(`"url" returns the url specified for the page object`, function () {
            class ExamplePageObject extends PageObject {
                constructor(path) {
                    super(path);
                }
            }

            const examplePageObject = new ExamplePageObject();
            expect(examplePageObject.url()).to.eq(Cypress.config().baseUrl);

            const examplePageObjectWithPath = new ExamplePageObject("/about");
            expect(examplePageObjectWithPath.url()).to.eq(new URL("/about", Cypress.config().baseUrl).toString());
        });

        specify(`path variables can be set using path inputs`, function () {
            class ExamplePageObject extends PageObject {
                constructor(path) {
                    super(path);
                }
            }

            const examplePageObjectWithNoInputs = new ExamplePageObject(`/user`);
            expect(examplePageObjectWithNoInputs.url("1234")).to.eq(
                new URL("/user", Cypress.config().baseUrl).toString()
            );

            const examplePageObjectWithSingleInput = new ExamplePageObject(`/user/:userId`);
            expect(examplePageObjectWithSingleInput.url("1234")).to.eq(
                new URL("/user/1234", Cypress.config().baseUrl).toString()
            );

            const examplePageObjectWithMultipleInputs = new ExamplePageObject(`/user/:userId/blog/:blogId`);
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
