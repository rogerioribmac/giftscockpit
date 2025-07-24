sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (Controller, Fragment, MessageBox, MessageToast, Filter, FilterOperator) {
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

            // Set growing
            oSmartTable.getTable().setGrowing(true);
            oSmartTable.getTable().setGrowingScrollToLoad(true);
            oSmartTable.getTable().setGrowingThreshold(100);

            var oSmartFilterBar = this.byId("smartFilterBar");
            oSmartFilterBar.attachSearch(this._recalculateIconTabBarCount, this);

            this._setInitialFilter();

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

                            var oSmartTable = this.byId("idSmartTable");
                            var oTable = oSmartTable.getTable();
                            if (oTable) {
                                oSmartTable.setBusy(true);
                                oTable.attachEventOnce("updateFinished", function () {
                                    this._filterSmartTable(sFirstKey);
                                    oSmartTable.setBusy(false);
                                }, this);
                            }

                            this._recalculateIconTabBarCount();

                        }
                       
                    }

                }, this);
            }

        },

        onIconTabBarSelect: function(oEvent) {

            var sSelectedKey = oEvent.getParameter("selectedKey");
            this._filterSmartTable(sSelectedKey);
            this._enableFooterButtons(sSelectedKey);

        },

        onModifyHeader: function(oEvent){

            var oSmartTable = this.getView()?.byId("idSmartTable");
            var oSelected = oSmartTable?.getTable()?.getSelectedItems();

            if (oSelected.length) {

                this._openDialogModifyHeader(oSelected);

            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineModify");
                MessageToast.show(sMessage);
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
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            oModel.submitChanges({
                success: function (oSuccess) {
                    MessageToast.show(oResourceBundle.getText("Main.ChangesSaved"));
                    this._pHeaderDialog.then(function (oDialog) {
                        oDialog.close();
                    });
                }.bind(this),
                error: function (oError) {
                    MessageToast.show(oResourceBundle.getText("Main.SaveError"));
                }.bind(this)
            });

        },

        onCancelDialogPress: function(oEvent){

            this._checkCloseDialog();

        },

        onAllowReservation: function(oEvent){

            var oModel = this.getView().getModel();
            var oSmartTable = this.getView()?.byId("idSmartTable");
            var oSelected = oSmartTable?.getTable()?.getSelectedItems();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            
            if (oSelected.length == 0){
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineAccept");
                MessageToast.show(sMessage);
            } else if (oSelected.length > 1){
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineAccept");
                MessageToast.show(sMessage);
            } else {

                this._openDialogAccept(oSelected);

            }

        },

        onAcceptYes: function(oEvent){

            var oModel = this.getView().getModel();
            var oDialog = this.byId("idAcceptDialog");
            var oContext = oDialog.getBindingContext();
            const sReservationNo = oContext.getProperty("reservationNo");
            var oTextArea = this.byId("idAcceptTextArea");
            const sReason = oTextArea.getValue();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            oModel.callFunction("/allowReservation", {
                method: "POST",
                urlParameters: {
                    reservationNo: sReservationNo,
                    Reason: sReason
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oBundle.getText("Main.AcceptErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                        this._recalculateIconTabBarCount();
                        this._pAcceptDialog.then(oDialog => oDialog.close());
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    var oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.AcceptErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.AcceptErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                        this._pAcceptDialog.then(oDialog => oDialog.close());
                    }
                    
                }.bind(this)
            });

        },

        onAcceptNo: function(oEvent){
            this._pAcceptDialog.then((oDialog) => {
                oDialog.close();
            });
        },

        _checkCloseDialog: function(oPromise){

            const oModel = this.getView().getModel();
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const oPendingChanges = oModel.getPendingChanges();

            if (Object.keys(oPendingChanges).length > 0) {
                MessageBox.confirm(
                    oResourceBundle.getText("Main.ExitWithoutSaving"), 
                    {
                        title: oResourceBundle.getText("Main.ConfirmationTitle"), 
                        actions: [
                            oResourceBundle.getText("Main.Yes"),
                            oResourceBundle.getText("Main.No")                          ],
                        emphasizedAction: oResourceBundle.getText("Main.No"),
                        onClose: function (sAction) {
                            if (sAction === oResourceBundle.getText("Main.Yes")) {
                                oModel.resetChanges();
                                if (oPromise){
                                    oPromise.resolve();
                                } else {
                                    this._pHeaderDialog.then((oDialog) => {
                                        oDialog.close();
                                    });
                                }
                            }
                        }.bind(this)
                    }
                );
            } else {
                if (oPromise){
                    oPromise.resolve();
                } else {
                    this._pHeaderDialog.then((oDialog) => {
                        oDialog.close();
                    });
                }
            }

        },

        _setEscapeHandler: function(oDialog) {

            const oView = this.getView();
            const oModel = oView.getModel();
            const oResourceBundle = oView.getModel("i18n").getResourceBundle();
        
            oDialog.setEscapeHandler((oPromise) => {
                this._checkCloseDialog(oPromise);
            });
        },

        _openDialogModifyHeader: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext();     
            const oModel = oContext.getModel();

            if (!this._pHeaderDialog) {

                this._pHeaderDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainModifyHeader",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    oDialog.setBindingContext(oContext);
                    this._setEscapeHandler(oDialog);
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

        _openDialogAccept: function(oSelected){

            const oContext = oSelected[0].getBindingContext();
            const oView = this.getView();  

            if (!this._pAcceptDialog) {

                this._pAcceptDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainAcceptDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    oDialog.setBindingContext(oContext);
                    oDialog.open();
                    return oDialog;
                });

            } else {
                this._pAcceptDialog.then((oDialog) => {
                    oDialog.setBindingContext(oContext);
                    this.byId("idAcceptTextArea")?.setValue();
                    oDialog.open();
                });
            }

        },

        _filterSmartTable: function(sKey){

            var oSmartTable = this.byId("idSmartTable");
            var aFilters = [];

            if (sKey && sKey != "A") { 
                aFilters.push(new Filter("reservationStatus", FilterOperator.EQ, sKey));
            }

            var oTable = oSmartTable.getTable();
            oTable.getBinding("items").filter(aFilters);

        },

        _recalculateIconTabBarCount: function(){

            var oIconTabBar = this.byId("iconTabBar");
            var oItems = oIconTabBar.getItems();
            var aFilters = this.byId("smartFilterBar")?.getFilters();
            oItems.forEach((oItem) => {

                var sStatus = oItem.getKey();
                var sPath = "/zz_pv_gifts_ckpt_reservations/$count";
                var aAllFilters = aFilters.slice();
                if (sStatus !== 'A') { 
                    aAllFilters.push(new Filter("reservationStatus", FilterOperator.EQ, sStatus));
                }

                var mParameters = {
                    filters: aAllFilters,
                    success: function (sCount) {
                        oItem.setCount(sCount);
                    },
                    error: function (oError) {
                        oItem.setCount(0);
                    }
                };

                var oModel = this.getView().getModel();
                oModel.read(sPath, mParameters);

            });

        },

        _enableFooterButtons: function(sKey){

            if (sKey == '3'){
                this.byId("idMainApproveBtn")?.setEnabled(true);
                this.byId("idMainRejectBtn")?.setEnabled(true);
            } else {
                this.byId("idMainApproveBtn")?.setEnabled(false);
                this.byId("idMainRejectBtn")?.setEnabled(false);
            }

        },

        _setInitialFilter: function(){

            var oSmartFilterBar = this.byId("smartFilterBar");

            oSmartFilterBar?.attachInitialise(() => {

                oSmartFilterBar?.setFilterData({
                    eventDate: {
                        conditionTypeInfo: {
                            data: {
                                key: "eventDate",
                                operation: "TODAYFROMTO",
                                value1: 180,
                                value2: 180
                            },
                            name: "sap.ui.comp.config.condition.DateRangeType"
                        }
                    }
                });

            });

        }

    });
});
