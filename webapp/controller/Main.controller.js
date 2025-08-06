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

            const oSmartTable = this.byId("idSmartTable");
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

            const oSmartFilterBar = this.byId("smartFilterBar");
            oSmartFilterBar.attachSearch(this._recalculateIconTabBarCount, this);

            this._setInitialFilter();

        },

        onItemPress: function(oEvent){

            let sReservationNo = oEvent?.getSource()?.getBindingContext()?.getProperty("reservationNo");

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteItem", {
                reservationNo: sReservationNo
            });

        },

        onAfterRendering: function(oEvent){

            const oIconTabBar = this.byId("iconTabBar");
            if (oIconTabBar){
                oIconTabBar.getBinding("items").attachEventOnce("change", function(){

                    const oIconTabBar = this.byId("iconTabBar");
                    if (oIconTabBar){
                        const oItems = oIconTabBar.getItems();
                        if (oItems && oItems.length > 0){

                            const oFirstItem = oItems[0];
                            const sFirstKey = oFirstItem.getKey();
                            oIconTabBar.setSelectedKey(sFirstKey);

                            const oSmartTable = this.byId("idSmartTable");
                            const oTable = oSmartTable.getTable();
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

            const sSelectedKey = oEvent.getParameter("selectedKey");
            this._filterSmartTable(sSelectedKey);
            this._enableFooterButtons(sSelectedKey);

        },

        onModifyHeader: function(oEvent){

            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();

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

            this._checkPendingChangesModifyHeader(() => {

                if (this._iCurrentIndex < this._aSelectedItems.length - 1) {

                    this._iCurrentIndex++;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pHeaderDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
    
                    this.getView()?.byId("idDialogModHeadLeft")?.setEnabled(true);
                } 
                
                this.OnDialogModHeaderArrowsVisibility();
                
            });

        },

        OnDialogModHeaderMoveLeft: function(oEvent) {

            this._checkPendingChangesModifyHeader(() => {

                if (this._iCurrentIndex > 0) {

                    this._iCurrentIndex--;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pHeaderDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
            
                    this.getView()?.byId("idDialogModHeadRight")?.setEnabled(true);
    
                }
            
                this.OnDialogModHeaderArrowsVisibility();

            });

            

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

        onSaveModifyHeader: function(oEvent){         

            this._checkPendingChangesModifyHeader(() => {

                this._pHeaderDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
            });

        },

        onCancelModifyHeader: function(oEvent){

            this._checkCloseDialog();

        },

        onAllowReservation: function(oEvent){

            const oModel = this.getView().getModel();
            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();
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

            const oModel = this.getView().getModel();
            const oDialog = this.byId("idAcceptDialog");
            const oContext = oDialog.getBindingContext();
            const sReservationNo = oContext.getProperty("reservationNo");
            const oTextArea = this.byId("idAcceptTextArea");
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

                    const oResponseJSON = JSON.parse(oError.responseText);
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

        onRejectReservation: function(oEvent){

            const oModel = this.getView().getModel();
            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            
            if (oSelected.length == 0){
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineReject");
                MessageToast.show(sMessage);
            } else if (oSelected.length > 1){
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineReject");
                MessageToast.show(sMessage);
            } else {

                this._openDialogReject(oSelected);

            }

        },

        onRejectYes: function(oEvent){

            const oModel = this.getView().getModel();
            const oDialog = this.byId("idRejectDialog");
            const oContext = oDialog.getBindingContext();
            const sReservationNo = oContext.getProperty("reservationNo");
            const oTextArea = this.byId("idRejectTextArea");
            const sReason = oTextArea.getValue();
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            oModel.callFunction("/rejectReservation", {
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
                            const sSuccessMessage = oBundle.getText("Main.RejectErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                        this._recalculateIconTabBarCount();
                        this._pRejectDialog.then(oDialog => oDialog.close());
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.RejectErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.RejectErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                        this._pRejectDialog.then(oDialog => oDialog.close());
                    }
                    
                }.bind(this)
            });

        },

        onRejectNo: function(oEvent){
            this._pRejectDialog.then((oDialog) => {
                oDialog.close();
            });
        },

        onModifyDialogYes: function(oEvent){

            const oModel = this.getView().getModel();
            const oDialog = this.byId("idModifyHeaderFragment");
            const oContext = oDialog?.getBindingContext();
            const oRadioButton = this.byId("idModifyDialogRadioButton");
            const sPropertyPath = oContext?.getPath() + "/reservationStatus";

            if (oRadioButton?.getSelectedButton()?.getId().includes("idMainModifyHeaderRB1")) {
                oModel?.setProperty(sPropertyPath, "1");
            } else if (oRadioButton?.getSelectedButton()?.getId().includes("idMainModifyHeaderRB3")) {
                oModel?.setProperty(sPropertyPath, "3");
            } else if (oRadioButton?.getSelectedButton()?.getId().includes("idMainModifyHeaderRB5")) {
                oModel?.setProperty(sPropertyPath, "5");
            }

            this._submitChangesModifyHeader();

            this._pModifyStatusDialog.then(function (oDialog) {
                oDialog.close();
            });

        },

        onModifyDialogNo: function(oEvent){
            this._pModifyStatusDialog.then((oDialog) => {
                oDialog.close();
            });
        },

        onMainClearSelection: function(oEvent){
            
            const oSmartTable = this.byId("idSmartTable");
            const oInnerTable = oSmartTable?.getTable();

            if (oInnerTable instanceof sap.m.Table) {
                const aItems = oInnerTable.getItems();
                aItems.forEach(function (oItem) {
                    oItem.setSelected(false); // desseleciona
                });
            } else if (oInnerTable instanceof sap.ui.table.Table) {
                oInnerTable.clearSelection(); // limpa todas as seleções
            }

        },

        _checkPendingChangesModifyHeader: function(fnAfterSaveModifyHeader){

            const oModel = this.getView().getModel(); 
            const oPendingChanges = oModel?.getPendingChanges();

            if (Object.keys(oPendingChanges).length > 0) {

                const oDialog = this.byId("idModifyHeaderFragment"); 
                const oContext = oDialog?.getBindingContext();
                const sStatus = oContext?.getProperty("reservationStatus"); 
    
                if (sStatus !== '4' || sStatus !== '5' || sStatus !== '7'){
                    this._openDialogModifyStatus(fnAfterSaveModifyHeader);
                } else {
                    this._submitChangesModifyHeader();
                }
                
            } else {
                fnAfterSaveModifyHeader();
            }

        },

        _submitChangesModifyHeader: function(){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            oModel.submitChanges({
                success: function (oSuccess) {
                    MessageToast.show(oResourceBundle.getText("Main.ChangesSaved"));
                    if (typeof this._fnAfterSaveModifyHeader === "function") {
                        this._fnAfterSaveModifyHeader();
                        this._fnAfterSaveModifyHeader = null;
                    }
                    this._recalculateIconTabBarCount();
                }.bind(this),
                error: function (oError) {
                    MessageToast.show(oResourceBundle.getText("Main.SaveError"));
                }.bind(this)
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
            const sStatus = oContext.getProperty("reservationStatus"); 

            if (sStatus == '3'){

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
            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgAllowStatus");
                MessageToast.show(sMessage);
            }

        },

        _openDialogModifyStatus: function(fnAfterSaveModifyHeader){

            const oView = this.getView();

            if (!this._pModifyStatusDialog) {
                this._pModifyStatusDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainModifyHeaderDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            } 

            this._pModifyStatusDialog.then((oDialog) => {
                this._setCurrentStatusRadioButton();
                this._fnAfterSaveModifyHeader = fnAfterSaveModifyHeader;
                oDialog.open();
            });

        },

        _setCurrentStatusRadioButton: function(){

            const oRadioButton = this.byId("idModifyDialogRadioButton");
            const oDialog = this.byId("idModifyHeaderFragment");
            const oContext = oDialog?.getBindingContext();
            const sStatus = oContext?.getProperty("reservationStatus");

            if (sStatus == "1"){
                oRadioButton.setSelectedButton(this.byId("idMainModifyHeaderRB1"))
            } else if (sStatus == "3"){
                oRadioButton.setSelectedButton(this.byId("idMainModifyHeaderRB3"))
            } else if (sStatus == "5"){
                oRadioButton.setSelectedButton(this.byId("idMainModifyHeaderRB5"))
            }

        },

        _openDialogReject: function(oSelected){

            const oContext = oSelected[0].getBindingContext();
            const oView = this.getView(); 
            const sStatus = oContext.getProperty("reservationStatus"); 

            if (sStatus == '2' || sStatus == '3' || sStatus == '5' || sStatus == '6'){

                if (!this._pRejectDialog) {

                    this._pRejectDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.ep.zgiftscockpit.view.fragments.MainRejectDialog",
                        controller: this
                    }).then((oDialog) => {
                        oView.addDependent(oDialog);
                        oDialog.setBindingContext(oContext);
                        oDialog.open();
                        return oDialog;
                    });

                } else {
                    this._pRejectDialog.then((oDialog) => {
                        oDialog.setBindingContext(oContext);
                        this.byId("idRejectTextArea")?.setValue();
                        oDialog.open();
                    });
                }
            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgRejectStatus");
                MessageToast.show(sMessage);
            }

        },

        _filterSmartTable: function(sKey){

            const oSmartTable = this.byId("idSmartTable");
            let aFilters = [];

            if (sKey && sKey != "A") { 
                aFilters.push(new Filter("reservationStatus", FilterOperator.EQ, sKey));
            }

            const oTable = oSmartTable.getTable();
            oTable.getBinding("items").filter(aFilters);

        },

        _recalculateIconTabBarCount: function(){

            const oIconTabBar = this.byId("iconTabBar");
            const oItems = oIconTabBar.getItems();
            let aFilters = this.byId("smartFilterBar")?.getFilters();
            oItems.forEach((oItem) => {

                const sStatus = oItem.getKey();
                const sPath = "/zz_pv_gifts_ckpt_reservations/$count";
                let aAllFilters = aFilters.slice();
                if (sStatus !== 'A') { 
                    aAllFilters.push(new Filter("reservationStatus", FilterOperator.EQ, sStatus));
                }

                const mParameters = {
                    filters: aAllFilters,
                    success: function (sCount) {
                        oItem.setCount(sCount);
                    },
                    error: function (oError) {
                        oItem.setCount(0);
                    }
                };

                const oModel = this.getView().getModel();
                oModel.read(sPath, mParameters);

            });

        },

        _enableFooterButtons: function(sKey){

            if (sKey == '3' || sKey == 'A'){
                this.byId("idMainApproveBtn")?.setEnabled(true);
            } else {
                this.byId("idMainApproveBtn")?.setEnabled(false);
            }

            if (sKey == '2' || sKey == '3' || sKey == '5' || sKey == '6' || sKey == 'A'){
                this.byId("idMainRejectBtn")?.setEnabled(true);
            } else {
                this.byId("idMainRejectBtn")?.setEnabled(false);
            }

        },

        _setInitialFilter: function(){

            const oSmartFilterBar = this.byId("smartFilterBar");

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
