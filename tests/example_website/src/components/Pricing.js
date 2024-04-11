"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var styles_1 = require("@mui/material/styles");
var AppBar_1 = require("@mui/material/AppBar");
var Box_1 = require("@mui/material/Box");
var Button_1 = require("@mui/material/Button");
var Card_1 = require("@mui/material/Card");
var CardActions_1 = require("@mui/material/CardActions");
var CardContent_1 = require("@mui/material/CardContent");
var CardHeader_1 = require("@mui/material/CardHeader");
var CssBaseline_1 = require("@mui/material/CssBaseline");
var Grid_1 = require("@mui/material/Grid");
var StarBorder_1 = require("@mui/icons-material/StarBorder");
var Toolbar_1 = require("@mui/material/Toolbar");
var Typography_1 = require("@mui/material/Typography");
var Link_1 = require("@mui/material/Link");
var GlobalStyles_1 = require("@mui/material/GlobalStyles");
var Container_1 = require("@mui/material/Container");
function Copyright(props) {
    return (React.createElement(Typography_1.default, __assign({ variant: 'body2', color: 'text.secondary', align: 'center' }, props),
        "Copyright © ",
        React.createElement(Link_1.default, { color: 'inherit', href: '#' }, "Your Website"),
        " ",
        new Date().getFullYear(),
        "."));
}
var tiers = [
    {
        title: "Free",
        price: "0",
        description: ["10 users included", "2 GB of storage", "Help center access", "Email support"],
        buttonText: "Sign up for free",
        buttonVariant: "outlined",
    },
    {
        title: "Pro",
        subheader: "Most popular",
        price: "15",
        description: ["20 users included", "10 GB of storage", "Help center access", "Priority email support"],
        buttonText: "Get started",
        buttonVariant: "contained",
    },
    {
        title: "Enterprise",
        price: "30",
        description: ["50 users included", "30 GB of storage", "Help center access", "Phone & email support"],
        buttonText: "Contact us",
        buttonVariant: "outlined",
    },
];
var footers = [
    {
        title: "Company",
        description: ["Team", "History", "Contact us", "Locations"],
    },
    {
        title: "Features",
        description: ["Cool stuff", "Random feature", "Team feature", "Developer stuff", "Another one"],
    },
    {
        title: "Resources",
        description: ["Resource", "Resource name", "Another resource", "Final resource"],
    },
    {
        title: "Legal",
        description: ["Privacy policy", "Terms of use"],
    },
];
var defaultTheme = (0, styles_1.createTheme)();
function Pricing() {
    return (React.createElement(styles_1.ThemeProvider, { theme: defaultTheme },
        React.createElement(GlobalStyles_1.default, { styles: { ul: { margin: 0, padding: 0, listStyle: "none" } } }),
        React.createElement(CssBaseline_1.default, null),
        React.createElement(AppBar_1.default, { position: 'static', color: 'default', elevation: 0, sx: { borderBottom: function (theme) { return "1px solid ".concat(theme.palette.divider); } } },
            React.createElement(Toolbar_1.default, { sx: { flexWrap: "wrap" } },
                React.createElement(Typography_1.default, { variant: 'h6', color: 'inherit', noWrap: true, sx: { flexGrow: 1 } }, "Company name"),
                React.createElement("nav", null,
                    React.createElement(Link_1.default, { variant: 'button', color: 'text.primary', href: '#', sx: { my: 1, mx: 1.5 } }, "Features"),
                    React.createElement(Link_1.default, { variant: 'button', color: 'text.primary', href: '#', sx: { my: 1, mx: 1.5 } }, "Enterprise"),
                    React.createElement(Link_1.default, { variant: 'button', color: 'text.primary', href: '#', sx: { my: 1, mx: 1.5 } }, "Support")),
                React.createElement(Button_1.default, { href: '#', variant: 'outlined', sx: { my: 1, mx: 1.5 } }, "Login"))),
        React.createElement(Container_1.default, { disableGutters: true, maxWidth: 'sm', component: 'main', sx: { pt: 8, pb: 6 } },
            React.createElement(Typography_1.default, { component: 'h1', variant: 'h2', align: 'center', color: 'text.primary', gutterBottom: true }, "Pricing"),
            React.createElement(Typography_1.default, { variant: 'h5', align: 'center', color: 'text.secondary', component: 'p' }, "Quickly build an effective pricing table for your potential customers with this layout. It's built with default MUI components with little customization.")),
        React.createElement(Container_1.default, { maxWidth: 'md', component: 'main' },
            React.createElement(Grid_1.default, { container: true, spacing: 5, alignItems: 'flex-end' }, tiers.map(function (tier) { return (
            // Enterprise card is full width at sm breakpoint
            React.createElement(Grid_1.default, { item: true, key: tier.title, xs: 12, sm: tier.title === "Enterprise" ? 12 : 6, md: 4 },
                React.createElement(Card_1.default, null,
                    React.createElement(CardHeader_1.default, { title: tier.title, subheader: tier.subheader, titleTypographyProps: { align: "center" }, action: tier.title === "Pro" ? React.createElement(StarBorder_1.default, null) : null, subheaderTypographyProps: {
                            align: "center",
                        }, sx: {
                            backgroundColor: function (theme) {
                                return theme.palette.mode === "light"
                                    ? theme.palette.grey[200]
                                    : theme.palette.grey[700];
                            },
                        } }),
                    React.createElement(CardContent_1.default, null,
                        React.createElement(Box_1.default, { sx: {
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "baseline",
                                mb: 2,
                            } },
                            React.createElement(Typography_1.default, { component: 'h2', variant: 'h3', color: 'text.primary' },
                                "$",
                                tier.price),
                            React.createElement(Typography_1.default, { variant: 'h6', color: 'text.secondary' }, "/mo")),
                        React.createElement("ul", null, tier.description.map(function (line) { return (React.createElement(Typography_1.default, { component: 'li', variant: 'subtitle1', align: 'center', key: line }, line)); }))),
                    React.createElement(CardActions_1.default, null,
                        React.createElement(Button_1.default, { fullWidth: true, variant: tier.buttonVariant }, tier.buttonText))))); }))),
        React.createElement(Container_1.default, { maxWidth: 'md', component: 'footer', sx: {
                borderTop: function (theme) { return "1px solid ".concat(theme.palette.divider); },
                mt: 8,
                py: [3, 6],
            } },
            React.createElement(Grid_1.default, { container: true, spacing: 4, justifyContent: 'space-evenly' }, footers.map(function (footer) { return (React.createElement(Grid_1.default, { item: true, xs: 6, sm: 3, key: footer.title },
                React.createElement(Typography_1.default, { variant: 'h6', color: 'text.primary', gutterBottom: true }, footer.title),
                React.createElement("ul", null, footer.description.map(function (item) { return (React.createElement("li", { key: item },
                    React.createElement(Link_1.default, { href: '#', variant: 'subtitle1', color: 'text.secondary' }, item))); })))); })),
            React.createElement(Copyright, { sx: { mt: 5 } }))));
}
exports.default = Pricing;
