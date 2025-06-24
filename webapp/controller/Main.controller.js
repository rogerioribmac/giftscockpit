sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
],
function (Controller, Fragment) {
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

        onModifyHeader: function(oEvent){

            var oSmartTable = this.getView()?.byId("idSmartTable");
            var oSelected = oSmartTable?.getTable()?.getSelectedItems();

            if (oSelected.length) {

                this._openDialogModifyHeader(oSelected);

            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLine");
                sap.m.MessageToast.show(sMessage);
            }

        },

        formatDialogModifyHeaderTitle: function(sText, sReservationNo){

            return sText + " " + sReservationNo;

        },

        OnDialogModHeaderMoveRight: function(oEvent){

            if (this._iCurrentIndex < this._aSelectedItems.length - 1) {

                this._iCurrentIndex++;
                const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                this._pHeaderDialog.then(oDialog => {
                    oDialog.setBindingContext(oContext);
                });

                this.getView()?.byId("idDialogModHeadLeft")?.setEnabled(true);
            } 
            
            this.OnDialogModHeaderArrowsVisibility();

        },

        OnDialogModHeaderMoveLeft: function(oEvent) {

            if (this._iCurrentIndex > 0) {

                this._iCurrentIndex--;
                const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                this._pHeaderDialog.then(oDialog => {
                    oDialog.setBindingContext(oContext);
                });
        
                this.getView()?.byId("idDialogModHeadRight")?.setEnabled(true);

            }
        
            this.OnDialogModHeaderArrowsVisibility();

        },

        OnDialogModHeaderArrowsVisibility: function(){

            if (this._iCurrentIndex == 0) {
                this.getView()?.byId("idDialogModHeadLeft")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogModHeadLeft")?.setEnabled(true);
            }

            if (this._iCurrentIndex == this._aSelectedItems.length - 1) {
                this.getView()?.byId("idDialogModHeadRight")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogModHeadRight")?.setEnabled(true);
            }

        },

        onSaveDialogPress: function(oEvent){

            const oModel = this.getView().getModel();

            oModel.submitChanges({
                success: function (oSuccess) {
                    this._pHeaderDialog.close();
                    sap.m.MessageToast.show("Alterações salvas com sucesso!");
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Erro ao salvar alterações.");
                }
            });

        },

        _openDialogModifyHeader: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext(); 

            if (!this._pHeaderDialog) {

                this._pHeaderDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainModifyHeader",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    oDialog.setBindingContext(oContext);
                    oDialog.open();
                    this.OnDialogModHeaderArrowsVisibility();
                    return oDialog;
                });

            } else {
                this._pHeaderDialog.then((oDialog) => {
                    oDialog.setBindingContext(oContext);
                    this.OnDialogModHeaderArrowsVisibility();
                    oDialog.open();
                });
            }

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
