sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.ep.zgiftscockpit.controller.Main", {
        
        onInit: function(oEvent){

            var oSmartTable = this.byId("idSmartTable");
            oSmartTable.applyVariant({
                sort: {
                    sortItems: [{ 
                        columnKey: "reservationNo", 
                        operation:"Descending"}
                    ]
                }
            });

        },

        onItemPress: function(oEvent){
            var sReservationNo = oEvent?.getSource()?.getBindingContext()?.getProperty("reservationNo");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteItem", {
                reservationNo: sReservationNo
            });
        },

        onAfterRendering: function(oEvent){
            
            var oIconTabBar = this.byId("iconTabBar");
            if (oIconTabBar){
                oIconTabBar.getBinding("items").attachEventOnce("change", function(){

                    var oIconTabBar = this.byId("iconTabBar");
                    if (oIconTabBar){
                        var oItems = oIconTabBar.getItems();
                        if (oItems && oItems.length > 0){
                            var oFirstItem = oItems[0];
                            var sFirstKey = oFirstItem.getKey();
                            oIconTabBar.setSelectedKey(sFirstKey);
                            this._filterSmartTable(sFirstKey);
                        }
                    }

                }, this);
            }

        },

        onIconTabBarSelect: function(oEvent) {

            var sSelectedKey = oEvent.getParameter("selectedKey");
            this._filterSmartTable(sSelectedKey);

        },

        _filterSmartTable: function(sKey){

            var oSmartTable = this.byId("idSmartTable");
            var aFilters = [];

            if (sKey && sKey != "A") { 
                aFilters.push(new sap.ui.model.Filter("reservationStatus", sap.ui.model.FilterOperator.EQ, sKey));
            }

            var oTable = oSmartTable.getTable();
            oTable.getBinding("items").filter(aFilters);

        }

    });
});
