# cypress-page-object

A set of template classes and guides to help with developing page objects in Cypress.

## The base class: `ElementCollection`

## The `ComponentObject` class

### Nesting

## The `PageObject` class

Nesting other component objects is supported, but it is highly advised to not nest another page object inside of a page
object!

## Notes

Cypress advises using [App Actions], but in my time working with Cypress, app actions can actually be used _with_ page
objects! Actions that occur within a page can be contained in the `PageObject` class, and actions that navigate through
multiple `PageObject`s or `ComponentObjects` can exist as organized helper functions within your application.
