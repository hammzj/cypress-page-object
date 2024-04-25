import { PageObject, ComponentObject, IPageMetadata } from "../../../index";
import { ComponentObjectFunction, Elements, NestedComponents } from "../../../src";

describe("Element collections", function () {
    beforeEach(function () {
        //@ts-ignore
        cy.visit(Cypress.config().baseUrl);
    });

    context("Getters", function () {
        specify("element selectors in `this.elements`", function () {
            class ExamplePageObject extends PageObject {
                public elements: Elements;

                constructor() {
                    super();
                    //Just trying another way of doing this,
                    //so don't follow my example.
                    //Use `elements = { ...this.elements, ... }`
                    Object.assign(this.elements, {
                        appBar: () => cy.get(`.MuiAppBar-root`),
                    });
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appBar" is a static element selector`);
            examplePageObject.elements.appBar().should("exist").and("contain.text", "Company name");
        });

        specify("finding elements from a parent element selector", function () {
            class ExamplePageObject extends PageObject {
                public elements: Elements;

                constructor() {
                    super();

                    this.addElements = {
                        appBar: () => cy.get(`.MuiAppBar-root`),
                        loginButton: () => this.elements.appBar().contains(".MuiButtonBase-root", "Login"),
                    };
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"loginButton" is chained from the "appBar" static element selector`);
            examplePageObject.elements.loginButton().should("exist").and("have.class", "MuiButton-outlined");
        });

        specify("dynamic element selectors can be parameterized", function () {
            class ExamplePageObject extends PageObject {
                public elements: Elements;

                constructor() {
                    super();
                    this.addElements = {
                        appBar: () => cy.get(`.MuiAppBar-root`),
                        appLink: (label?: string) =>
                            label ?
                                this.elements.appBar().contains("a.MuiLink-root", label, { matchCase: true })
                            :   this.elements.appBar().find("a.MuiLink-root"),
                    };
                }
            }

            const examplePageObject = new ExamplePageObject();

            cy.log(`"appLink" is dynamic because it requires a parameter and can select different types of elements`);
            examplePageObject.elements.appLink("Features").should("exist");
            examplePageObject.elements.appLink("Enterprise").should("exist");
            examplePageObject.elements.appLink("Support").should("exist");
        });

        specify("[ALTERNATIVE]: filtering getters instead of using dynamic element selectors", function () {
            class ExamplePageObject extends PageObject {
                public elements: Elements;

                constructor() {
                    super();
                    this.addElements = {
                        appBar: () => cy.get(`.MuiAppBar-root`),
                        appLink: (label?: string) =>
                            label ?
                                this.elements.appBar().contains("a.MuiLink-root", label, { matchCase: true })
                            :   this.elements.appBar().find("a.MuiLink-root"),
                    };
                }
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
        specify("component objects are located using a base container function", function () {
            class ProPricingCardObject extends ComponentObject {
                public elements: Elements;

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
            proPricingCardObject.elements.header().should("contain.text", "Pro").and("contain.text", "Most popular");
            proPricingCardObject.elements.starIcon().should("exist");
        });

        context("Nested component objects", function () {
            specify("nested component object base container functions can be parameterized", function () {
                class PricingCardObject extends ComponentObject {
                    constructor(title: string) {
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
                    public elements: Elements;

                    constructor(title: string) {
                        super();
                        this.metadata.title = title;
                        this.updateBaseContainerFunction = () => {
                            return cy.contains(".MuiCardHeader-content", this.metadata.title).parents(".MuiCard-root");
                        };
                        this.addElements = {
                            header: () => this.container().find(".MuiCardHeader-root"),
                            starIcon: () => this.elements.header().find('svg[data-testid="StarBorderIcon"]'),
                        };
                    }
                }

                cy.log(
                    `Component objects can be parameterized.`,
                    `In this case, the distinct component is determined by its title`
                );
                const proPricingCardObject = new PricingCardObject("Pro");
                proPricingCardObject.container().should("exist").and("contain.text", "$15/mo");
                proPricingCardObject.elements.starIcon().should("exist");
            });

            specify("component objects can nested other component objects using performWithin", function () {
                class PricingHeaderObject extends ComponentObject {
                    public elements: Elements;

                    constructor() {
                        super(() => cy.get(".MuiCardHeader-root"));
                        this.addElements = {
                            title: () => this.container().find(".MuiCardHeader-title"),
                            subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                            starIcon: () => this.container().find('svg[data-testid="StarBorderIcon"]'),
                        };
                    }
                }

                class PricingCardObject extends ComponentObject {
                    public elements: Elements;
                    public components: NestedComponents;

                    constructor(title: string) {
                        super(() => {
                            return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                        });
                        this.addElements = {
                            contentContainer: () => this.container().find(".MuiCardContent-root"),
                            pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                            listItem: (label: string) => this.elements.contentContainer().contains("ul > li", label),
                            submitButton: () => this.container().find("button"),
                        };
                        this.addNestedComponents = {
                            PricingHeaderObject: (fn: ComponentObjectFunction) =>
                                this.performWithin(this.container(), new PricingHeaderObject(), fn),
                        };
                    }
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
                "nested component objects can be added using this.addNestedComponents or this.addComponents",
                function () {
                    class PricingHeaderObject extends ComponentObject {
                        public elements: Elements;

                        constructor() {
                            super(() => cy.get(".MuiCardHeader-root"));
                            this.addElements = {
                                title: () => this.container().find(".MuiCardHeader-title"),
                                subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                                starIcon: () => this.container().find(`svg[data-testid="StarBorderIcon"]`),
                            };
                        }
                    }

                    class PricingCardObject1 extends ComponentObject {
                        public elements: Elements;
                        public components: NestedComponents;

                        constructor(title: string) {
                            super(() => cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root"));
                            this.addElements = {
                                contentContainer: () => this.container().find(".MuiCardContent-root"),
                                pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                                listItem: (label: string) =>
                                    this.elements.contentContainer().contains("ul > li", label),
                                submitButton: () => this.container().find("button"),
                            };
                            this.addNestedComponents = {
                                PricingHeaderObject: (fn: ComponentObjectFunction) =>
                                    this.container().within(() => fn(new PricingHeaderObject())),
                            };
                        }
                    }

                    class PricingCardObject2 extends ComponentObject {
                        public elements: Elements;
                        public components: NestedComponents;

                        constructor(title: string) {
                            super(() => cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root"));
                            this.addElements = {
                                contentContainer: () => this.container().find(".MuiCardContent-root"),
                                pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                                listItem: (label: string) =>
                                    this.elements.contentContainer().contains("ul > li", label),
                                submitButton: () => this.container().find("button"),
                            };
                            this.addComponents = {
                                PricingHeaderObject: (fn: ComponentObjectFunction) =>
                                    this.container().within(() => fn(new PricingHeaderObject())),
                            };
                        }
                    }

                    const pco1 = new PricingCardObject1("Free");
                    const pco2 = new PricingCardObject2("Free");
                    expect(pco1.components.PricingHeaderObject).to.exist;
                    expect(pco2.components.PricingHeaderObject).to.exist;
                }
            );

            specify(
                "[ALTERNATIVE]: component objects can nested other component objects using cy.within()",
                function () {
                    class PricingHeaderObject extends ComponentObject {
                        public elements: Elements;

                        constructor() {
                            super(() => cy.get(".MuiCardHeader-root"));
                            this.addElements = {
                                title: () => this.container().find(".MuiCardHeader-title"),
                                subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                                starIcon: () => this.container().find(`svg[data-testid="StarBorderIcon"]`),
                            };
                        }
                    }

                    class PricingCardObject extends ComponentObject {
                        public elements: Elements;
                        public components: NestedComponents;

                        constructor(title: string) {
                            super(() => cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root"));
                            this.addElements = {
                                contentContainer: () => this.container().find(".MuiCardContent-root"),
                                pricing: () => this.elements.contentContainer().find(".MuiBox-root"),
                                listItem: (label: string) =>
                                    this.elements.contentContainer().contains("ul > li", label),
                                submitButton: () => this.container().find("button"),
                            };

                            this.addNestedComponents = {
                                PricingHeaderObject: (fn: ComponentObjectFunction) =>
                                    this.container().within(() => fn(new PricingHeaderObject())),
                            };
                        }
                    }

                    const proPricingCardObject = new PricingCardObject("Pro");

                    cy.log(
                        `The function above for PricingHeaderObject is functionally equivalent to using "this.performWithin"`
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
                    public elements: Elements;

                    constructor(title: string) {
                        super(() => cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item"));
                        this.addElements = {
                            link: (label: string) => this.container().contains("a", label, { matchCase: true }),
                        };
                    }
                }

                class FooterObject extends ComponentObject {
                    public elements: Elements;
                    public components: NestedComponents;

                    constructor() {
                        super(() => cy.get(`footer`));
                        this.addElements = {
                            gridLayout: () => this.container().find(`.MuiGrid-container`),
                            copyright: () => this.container().find(`p.MuiTypography-root`),
                        };
                        this.addNestedComponents = {
                            LinkListObject: (fn: ComponentObjectFunction, title: string) => {
                                return this.performWithin(this.elements.gridLayout(), new LinkListObject(title), fn);
                            },
                        };
                    }
                }

                const footerObject = new FooterObject();

                cy.log(
                    "Nested component objects can be parameterized to find distinct instances inside of a parent component object"
                );
                footerObject.components.LinkListObject((linkListObject) => {
                    ["Team", "History", "Contact us", "Locations"].forEach((i) => {
                        linkListObject.elements.link(i).should("exist");
                    });
                }, "Company");
                footerObject.components.LinkListObject((linkListObject) => {
                    ["Cool stuff", "Random feature", "Team feature", "Developer stuff", "Another one"].forEach((i) => {
                        linkListObject.elements.link(i).should("exist");
                    });
                }, "Features");
            });
        });

        specify("different indices can change with which nested component is currently being interacted", function () {
            class LinkListObject extends ComponentObject {
                public elements: Elements;
                public components: NestedComponents;

                //This time, the base container is going to be generically located
                //So there is a chance for it to find more than one instance.
                //Thus, setting the index is important
                constructor() {
                    super(() => {
                        return cy.get(".MuiTypography-h6").parent(".MuiGrid-item");
                    });
                    this.addElements = {
                        title: () => this.container().find(".MuiTypography-h6"),
                        link: () => this.container().find("ul > li"),
                    };
                }

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
                public elements: Elements;
                public components: NestedComponents;

                constructor() {
                    super(() => cy.get(`footer`));
                    this.addElements = {
                        gridLayout: () => this.container().find(`.MuiGrid-container`),
                    };

                    this.addNestedComponents = {
                        LinkListObject: (fn) =>
                            this.performWithin(this.elements.gridLayout(), new LinkListObject(), fn),
                    };
                }
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
                listLinkObject.index = 0;
                listLinkObject.elements.title().should("have.text", "Company");
            });
            footerObject.components.LinkListObject((listLinkObject) => {
                listLinkObject.index = 1;
                listLinkObject.elements.title().should("have.text", "Features");
                listLinkObject.scopedIndex = 1; //Alternate way to set an index
                listLinkObject.elements.title().should("have.text", "Features");
            });
            footerObject.components.LinkListObject((listLinkObject) => {
                listLinkObject.index = 2;
                listLinkObject.elements.title().should("have.text", "Resources");
            });
            footerObject.components.LinkListObject((listLinkObject) => {
                listLinkObject.index = 3;
                listLinkObject.elements.title().should("have.text", "Legal");
            });
        });

        context("class app actions", function () {
            specify("component objects can utilize app actions", function () {
                class LinkListObject extends ComponentObject {
                    constructor(title: string) {
                        super(() => {
                            return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                        });
                        this.addElements = {
                            link: () => this.container().find("ul > li"),
                        };
                    }

                    //app action to perform an assertion
                    assertLinksInOrder(...labels: string[]) {
                        this.elements.link().each(($link) => {
                            cy.wrap($link).should("have.text", labels.shift());
                        });
                    }
                }

                class FooterObject extends ComponentObject {
                    public elements: Elements;
                    public components: NestedComponents;

                    constructor() {
                        super(() => cy.get(`footer`));
                        this.addElements = {
                            gridLayout: () => this.container().find(`.MuiGrid-container`),
                            copyright: () => this.container().find(`p.MuiTypography-root`),
                        };
                        this.addNestedComponents = {
                            LinkListObject: (fn: ComponentObjectFunction, title: string) => {
                                this.performWithin(this.elements.gridLayout(), new LinkListObject(title), fn);
                            },
                        };
                    }

                    //app action to perform a page action
                    visitCopyrightLink() {
                        this.elements.copyright().find("a").click();
                    }
                }

                const footerObject = new FooterObject();

                footerObject.components.LinkListObject((listLinkObject: LinkListObject) => {
                    listLinkObject.container().should("exist");
                    cy.log(`app action to perform an assertion`);
                    listLinkObject.assertLinksInOrder("Team", "History", "Contact us", "Locations");
                }, "Company");

                cy.log(`app action to perform a page action`);
                footerObject.visitCopyrightLink();
            });

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
                        constructor(title: string) {
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
                        constructor(title: string) {
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
                        constructor(title: string) {
                            super(() => cy.contains(".MuiCard-root", title));
                        }
                    }

                    const pricingCardObject = new PricingCardObject("Free");
                    pricingCardObject.assertExists(true);

                    pricingCardObject.scopedIndex = 1;
                    pricingCardObject.assertExists(false);
                });
            });
        });

        specify(
            "component objects can extend base classes and add new element selectors using this.addElements",
            function () {
                class PricingCardObject extends ComponentObject {
                    public elements: Elements;

                    constructor(title: string) {
                        super(() => {
                            return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                        });
                        this.addElements = {
                            header: () => this.container().find(".MuiCardHeader-root"),
                            starIcon: () => this.elements.header().find('svg[data-testid="StarBorderIcon"]'),
                        };
                    }
                }

                const freePricingCardObject = new PricingCardObject("Free");
                freePricingCardObject.elements.container().should("exist").and("contain.text", "$0/mo");
                freePricingCardObject.elements.starIcon().should("not.exist");
            }
        );
    });

    describe("Page objects", function () {
        class AppBar extends ComponentObject {
            public elements: Elements;
            public components: NestedComponents;

            constructor() {
                super(() => cy.get(".MuiAppBar-root"));
                this.addElements = {
                    link: (label: string) => this.container().contains("a.MuiLink-root", label, { matchCase: true }),
                    loginButton: () => this.container().find(".MuiButtonBase-root"),
                };
            }
        }

        class PricingHeaderObject extends ComponentObject {
            public elements: Elements;
            public components: NestedComponents;

            constructor() {
                super(() => cy.get(".MuiCardHeader-root"));
                this.addElements = {
                    title: () => this.container().find(".MuiCardHeader-title"),
                    subtitle: () => this.container().find(".MuiCardHeader-subheader"),
                    starIcon: () => this.container().find('svg[data-testid="StarBorderIcon"]'),
                };
            }
        }

        class PricingCardObject extends ComponentObject {
            public elements: Elements;
            public components: NestedComponents;

            constructor(title: string) {
                super(() => {
                    return cy.contains(".MuiCardHeader-content", title).parents(".MuiCard-root");
                });
                this.addElements = {
                    contentContainer: () => this.container().find(".MuiCardContent-root"),
                    pricing: () => this.container().find("button"),
                    submitButton: () => this.elements.contentContainer().find(".MuiBox-root"),
                    listItem: (label: string) => this.elements.contentContainer().contains("ul > li", label),
                };
                this.addNestedComponents = {
                    PricingHeaderObject: (fn) => this.performWithin(this.container(), new PricingHeaderObject(), fn),
                };
            }
        }

        class LinkListObject extends ComponentObject {
            constructor(title: string) {
                super(() => {
                    return cy.contains(".MuiTypography-h6", title).parent(".MuiGrid-item");
                });
                this.addElements = {
                    link: () => this.container().find("ul > li"),
                };
            }

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
            public components: NestedComponents;

            constructor() {
                super(() => cy.get(`footer`));
                this.addElements = {
                    gridLayout: () => this.container().find(`.MuiGrid-container`),
                    copyright: () => this.container().find(`p.MuiTypography-root`),
                };
                this.addNestedComponents = {
                    LinkListObject: (fn, title: string) =>
                        this.performWithin(this.elements.gridLayout(), new LinkListObject(title), fn),
                };
            }

            //app action to perform a page action
            visitCopyrightLink() {
                this.elements.copyright().find("a").click();
            }
        }

        class ExamplePageObject extends PageObject {
            public elements: Elements;
            public components: NestedComponents;

            constructor() {
                super();
                this.addElements = {
                    main: () => this.container().find("main").first(),
                    contentTitle: () => this.elements.main().find("h1").first(),
                    contentDescription: () => this.elements.contentTitle().next(),
                };
                this.addNestedComponents = {
                    AppBar: (fn) => {
                        this.performWithin(this.container(), new AppBar(), fn);
                    },
                    PricingCardObject: (fn, title: string) => {
                        this.performWithin(this.container(), new PricingCardObject(title), fn);
                    },
                    FooterObject: (fn) => {
                        this.performWithin(this.container(), new FooterObject(), fn);
                    },
                };
            }
        }

        const examplePageObject = new ExamplePageObject();

        specify("Page objects can have elements", function () {
            examplePageObject.elements.contentTitle().should("have.text", "Pricing");
            examplePageObject.elements
                .contentDescription()
                .should(
                    "have.text",
                    `Quickly build an effective pricing table for your potential customers with this layout. It's built with default MUI components with little customization.`
                );
        });

        specify("Page objects can have nested component objects", function () {
            cy.log("This is a full example of putting it all together");
            examplePageObject.components.AppBar((appBar: AppBar) => {
                appBar.elements.loginButton().should("exist");
                appBar.elements.link("Features").should("exist");
                appBar.elements.link("Enterprise").should("exist");
                appBar.elements.link("Support").should("exist");
            });
            examplePageObject.components.PricingCardObject((pricingCardObject: PricingCardObject) => {
                pricingCardObject.components.PricingHeaderObject((pricingHeaderObject: PricingHeaderObject) => {
                    pricingHeaderObject.elements.starIcon().should("not.exist");
                    pricingCardObject.elements.pricing().should("have.text", "Sign up for free");
                });
            }, "Free");
            examplePageObject.components.PricingCardObject((pricingCardObject: PricingCardObject) => {
                pricingCardObject.components.PricingHeaderObject((pricingHeaderObject: PricingHeaderObject) => {
                    pricingHeaderObject.elements.starIcon().should("exist");
                    pricingCardObject.elements.pricing().should("have.text", "Get started");
                });
            }, "Pro");
            examplePageObject.components.PricingCardObject((pricingCardObject: PricingCardObject) => {
                pricingCardObject.components.PricingHeaderObject((pricingHeaderObject: PricingHeaderObject) => {
                    pricingHeaderObject.elements.starIcon().should("not.exist");
                    pricingCardObject.elements.pricing().should("have.text", "Contact us");
                });
            }, "Enterprise");
            examplePageObject.components.FooterObject((footerObject: FooterObject) => {
                footerObject.components.LinkListObject((linkListObject: LinkListObject) => {
                    linkListObject.assertLinksInOrder("Team", "History", "Contact us", "Locations");
                }, "Company");
            });
        });

        specify("Page objects cannot have other nested page objects", function () {
            class AnotherPageObjectBaseClass extends PageObject {
                constructor() {
                    super();
                }
            }

            class AnotherPageObject extends AnotherPageObjectBaseClass {
                constructor() {
                    super();
                }
            }

            class ParentPageObject extends PageObject {
                constructor() {
                    super();
                }

                components = {
                    AnotherPageObject: (fn) => this.performWithin(this.container(), new AnotherPageObject(), fn),
                };
            }

            const parentPageObject = new ParentPageObject();
            expect(() =>
                parentPageObject.components.AnotherPageObject((anotherPageObject: AnotherPageObject) =>
                    cy.log(anotherPageObject.constructor.name)
                )
            ).to.throw("Page objects cannot be nested in other page objects");
        });

        context("class app actions", function () {
            specify("assertIsOnPage succeeds on a basic url", function () {
                //@ts-ignore
                cy.wrap(new URL("/about", Cypress.config().baseUrl).toString()).as("path");
                cy.stub(cy, "url").returns(cy.get("@path"));

                new PageObject({ path: `/about` }).assertIsOnPage(); //Should succeed
            });

            specify("assertIsOnPage succeeds on correct path replacement", function () {
                //@ts-ignore
                cy.wrap(new URL("/user/1234/blog/id-abcd", Cypress.config().baseUrl).toString()).as("path");
                cy.stub(cy, "url").returns(cy.get("@path"));

                new PageObject({ path: `/user/:userId/blog/:blogId` }).assertIsOnPage("1234", "id-abcd"); //Should succeed
            });

            specify(`"url" returns the url specified for the page object`, function () {
                class ExamplePageObject extends PageObject {
                    constructor(metadata = {}) {
                        super(metadata);
                    }
                }

                const examplePageObject = new ExamplePageObject();
                expect(examplePageObject.url()).to.eq(Cypress.config().baseUrl);

                const examplePageObjectWithPath = new ExamplePageObject({ path: "/about" });
                //@ts-ignore
                expect(examplePageObjectWithPath.url()).to.eq(new URL("/about", Cypress.config().baseUrl).toString());
            });

            specify(`path variables can be set using path inputs`, function () {
                class ExamplePageObject extends PageObject {
                    constructor(metadata: IPageMetadata) {
                        super(metadata);
                    }
                }

                const examplePageObjectWithNoInputs = new ExamplePageObject({ path: `/user` });
                expect(examplePageObjectWithNoInputs.url("1234")).to.eq(
                    // @ts-ignore
                    new URL("/user", Cypress.config().baseUrl).toString()
                );

                const examplePageObjectWithSingleInput = new ExamplePageObject({ path: `/user/:userId` });
                expect(examplePageObjectWithSingleInput.url("1234")).to.eq(
                    // @ts-ignore
                    new URL("/user/1234", Cypress.config().baseUrl).toString()
                );

                const examplePageObjectWithMultipleInputs = new ExamplePageObject({
                    path: `/user/:userId/blog/:blogId`,
                });
                expect(examplePageObjectWithMultipleInputs.url("1234", "abcd")).to.eq(
                    // @ts-ignore
                    new URL("/user/1234/blog/abcd", Cypress.config().baseUrl).toString()
                );
                expect(examplePageObjectWithMultipleInputs.url("1234", "abcd", "WXYZ")).to.eq(
                    // @ts-ignore
                    new URL("/user/1234/blog/abcd", Cypress.config().baseUrl).toString()
                );
                expect(() => examplePageObjectWithMultipleInputs.url("1234")).to.throw(
                    "Not enough path variables were supplied, so path cannot be substituted"
                );
            });
        });
    });
});
