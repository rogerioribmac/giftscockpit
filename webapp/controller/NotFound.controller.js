sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.ep.zgiftscockpit.controller.NotFound", {

		onNavBack: function () {
			debugger;
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMain");

		},

	});

});
