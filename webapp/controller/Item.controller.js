sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.ep.zgiftscockpit.controller.Item", {
        
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteItem").attachPatternMatched(this._onRouteMatched, this);
        },
          
        _onRouteMatched: function (oEvent) {
            var sReservationNo = oEvent.getParameter("arguments").reservationNo;
            var oView = this.getView();
            oView?.bindElement({
                path: "/zz_dd_gifts_ckpt_reservations('" + sReservationNo + "')",
                events: {
                  dataRequested: function () {
                    oView.setBusy(true);
                  },
                  dataReceived: function (oData) {
                    oView.setBusy(false);
                    const oContext = oView.getBindingContext();
                    if (!oContext || !oContext.getObject()) {
                      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                      oRouter.navTo("RouteNotFound");
                    }
                  }.bind(this)
                }
              });
        }

    });
});
