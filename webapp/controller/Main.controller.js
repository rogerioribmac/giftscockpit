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

//===== GENERAL METHODS =================================//

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

        onAfterRendering: function(oEvent){

            const oIconTabBar = this.byId("iconTabBar");
            if (oIconTabBar){
                oIconTabBar.getBinding("items").attachEventOnce("change", function(){
                    this._getTabAndFilterSmartTable();
                }, this);

            }

            const oSmartTable = this.byId("idSmartTable");
            oSmartTable?.attachBeforeRebindTable(this.onBeforeRebindTable, this);

        },

        onBeforeRebindTable: function (oEvent) {

            this._getTabAndFilterSmartTable();
            const oBindingParams = oEvent.getParameter("bindingParams");
            if (!oBindingParams.sorter || oBindingParams.sorter.length === 0) {
                oBindingParams.sorter = [
                    new sap.ui.model.Sorter("reservationNo", true)
                ];
            }

        },

        onItemPress: function(oEvent){

            let sReservationNo = oEvent?.getSource()?.getBindingContext()?.getProperty("reservationNo");

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteItem", {
                reservationNo: sReservationNo
            });

        },

        onIconTabBarSelect: function(oEvent) {

            const sSelectedKey = oEvent.getParameter("selectedKey");
            this._filterSmartTable(sSelectedKey);
            this._enableFooterButtons(sSelectedKey);

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

        _getTabAndFilterSmartTable: function(){

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

            // Approve Button
            if (sKey == '3' || sKey == 'A'){
                this.byId("idMainApproveBtn")?.setEnabled(true);
            } else {
                this.byId("idMainApproveBtn")?.setEnabled(false);
            }

            // Reject Button
            if (sKey == '2' || sKey == '3' || sKey == '5' || sKey == '6' || sKey == 'A'){
                this.byId("idMainRejectBtn")?.setEnabled(true);
            } else {
                this.byId("idMainRejectBtn")?.setEnabled(false);
            }

            // Pickup Button
            if (sKey !== '4' && sKey !== '5'){
                this.byId("idMainPickBtn")?.setEnabled(true);
            } else {
                this.byId("idMainPickBtn")?.setEnabled(false);
            }

            // Mission Cancelled Button
            if (sKey !== '7'){
                this.byId("idMainMissionBtn")?.setEnabled(true);
            } else {
                this.byId("idMainMissionBtn")?.setEnabled(false);
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

        },

        _checkCloseDialog: function(oPromise, oDialog){

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
                                    oDialog.then((oDialog) => {
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
                    oDialog.then((oDialog) => {
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

//===== ACCEPT RESERVATION =================================//

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

//===== REJECT RESERVATION =================================//

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

//===== MODIFY HEADER =================================//

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

        onSaveModifyHeader: function(oEvent){         

            this._checkPendingChangesModifyHeader(() => {

                this._pHeaderDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
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

        onCancelModifyHeader: function(oEvent){

            this._checkCloseDialog(null, this._pHeaderDialog);

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
        
        _submitChangesModifyHeader: function(){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const oDialog = this.byId("idModifyHeaderFragment");
            const oContext = oDialog.getBindingContext();
            const oData = oContext?.getObject();

            oModel.callFunction("/modifyHeader", {
                method: "POST",
                urlParameters: {
                    reservationNo: oData.reservationNo,
                    reservationStatus: oData.reservationStatus,
                    dg: oData.dg,
                    eventOrganizer: oData.eventOrganizer,
                    contactPerson: oData.contactPerson,
                    service: oData.service,
                    eventName: oData.eventName,
                    eventCountry: oData.eventCountry,
                    eventDate: oData.eventDate,
                    needByDate: oData.needByDate,
                    requestor: oData.requestor,
                    pickupComment: oData.pickupComment
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Main.ModifyHeaderErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                        this._recalculateIconTabBarCount();
                        if (typeof this._fnAfterSaveModifyHeader === "function") {
                            this._fnAfterSaveModifyHeader();
                            this._fnAfterSaveModifyHeader = null;
                        }
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.ModifyHeaderErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.ModifyHeaderErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });

        },

        _checkPendingChangesModifyHeader: function(fnAfterSaveModifyHeader){

            const oModel = this.getView().getModel(); 
            const oPendingChanges = oModel?.getPendingChanges();

            if (Object.keys(oPendingChanges).length > 0) {

                const oDialog = this.byId("idModifyHeaderFragment"); 
                const oContext = oDialog?.getBindingContext();
                const sStatus = oContext?.getProperty("reservationStatus"); 
    
                if (sStatus !== '4' && sStatus !== '5' && sStatus !== '7'){
                    this._openDialogModifyStatus(fnAfterSaveModifyHeader);
                } else {
                    this._submitChangesModifyHeader();
                    fnAfterSaveModifyHeader();
                }
                
            } else {
                fnAfterSaveModifyHeader();
            }

        },

        _loadDurationvalues: function() {

            if (!this?._aDurations || !this?._aDurations?.length) {
                var oModel = this.getView().getModel();
                oModel.read("/zz_pv_gifts_ckpt_sh_pickdurati", {
                    success: (oData) => {
                        this._aDurations = oData.results.map(item => item.Duration);
                    },
                    error: () => {
                        this._aDurations = [];
                    }
                });

            }

            var oSmartField = this.byId("idMainPickupDuration");
            oSmartField.attachChange(this.onPickupDurationChange.bind(this));

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
        
//===== PICKUP RESERVATION =================================//

        onPickupDialog: function(oEvent){

            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();

            if (oSelected.length) {

                this._openDialogPickup(oSelected);

            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLinePickup");
                MessageToast.show(sMessage);
            }

        },

        onPickupDurationChange: function(oEvent) {
            
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            if (this?._aDurations?.length) {
                var sValue = oEvent.getParameter("value") || oEvent.getSource().getValue();
                if (!this._aDurations.includes(sValue)) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText(oResourceBundle.getText("Main.PickupDurationError")); 
                } else {
                    oEvent.getSource().setValueState("None");
                }
            }
            
        },

        OnDialogPickupArrowsVisibility: function(){

            if (this._iCurrentIndex == 0) {
                this.getView()?.byId("idDialogPickupLeft")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogPickupLeft")?.setEnabled(true);
            }

            if (this._iCurrentIndex == this._aSelectedItems.length - 1) {
                this.getView()?.byId("idDialogPickupRight")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogPickupRight")?.setEnabled(true);
            }

        },

        OnDialogPickupMoveRight: function(oEvent){

            this._checkPendingChangesPickupDialog(() => {

                if (this._iCurrentIndex < this._aSelectedItems.length - 1) {

                    this._iCurrentIndex++;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pPickupDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
    
                    this.getView()?.byId("idDialogPickupLeft")?.setEnabled(true);
                } 
                
                this.OnDialogPickupArrowsVisibility();
                
            });

        },

        OnDialogPickupMoveLeft: function(oEvent) {

            this._checkPendingChangesPickupDialog(() => {

                if (this._iCurrentIndex > 0) {

                    this._iCurrentIndex--;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pPickupDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
            
                    this.getView()?.byId("idDialogPickupRight")?.setEnabled(true);
    
                }
            
                this.OnDialogPickupArrowsVisibility();

            });

        },

        onCancelPickupDialog: function(oEvent){

            this._checkCloseDialog(null, this._pPickupDialog);

        },

        onSavePickupDialog: function(oEvent){         

            this._checkPendingChangesPickupDialog(() => {

                this._pPickupDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
            });

        },

        _checkPendingChangesPickupDialog: function(fnAfterSavePickupDialog){

            const oModel = this.getView().getModel(); 
            const oPendingChanges = oModel?.getPendingChanges();
            const oPickupDuration = this.byId("idMainPickupDuration");
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            if (oPickupDuration.getValueState() !== sap.ui.core.ValueState.Error){
                if (this._checkPickMandatoryFields()){
                    if (Object.keys(oPendingChanges).length > 0) {

                        MessageBox.confirm(
                            oResourceBundle.getText("Main.ExitSaveChanges"), 
                            {
                                title: oResourceBundle.getText("Main.ConfirmationTitle"), 
                                actions: [
                                    oResourceBundle.getText("Main.Yes"),
                                    oResourceBundle.getText("Main.No")                          ],
                                emphasizedAction: oResourceBundle.getText("Main.No"),
                                onClose: function (sAction) {
                                    if (sAction === oResourceBundle.getText("Main.Yes")) {
                                        this._submitChangesPickupDialog(fnAfterSavePickupDialog);
                                    }
                                }.bind(this)
                            }
                        );                        

                    } else {
                        fnAfterSavePickupDialog();
                    }
                } else {
                    MessageBox.error(oResourceBundle.getText("Main.PickupMandatoryFieldsError"));
                }
            } else {
                MessageBox.error(oPickupDuration.getValueStateText());
            }

        },

        _checkPickMandatoryFields: function(){

            const sDate     = this.byId("idMainPickupDate").getValue();
            const sTime     = this.byId("idMainPickupTime").getValue();
            const sDuration = this.byId("idMainPickupDuration").getValue();

            if (sDate && sTime && sDuration){
                return true;
            } else {
                return false;
            }

        },

        _submitChangesPickupDialog: function(fnAfterSavePickupDialog){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const oDialog = this.byId("idPickupDialog");
            const oContext = oDialog.getBindingContext();
            const oData = oContext?.getObject();

            oModel.callFunction("/pickup", {
                method: "POST",
                urlParameters: {
                    reservationNo: oData.reservationNo,
                    pickupDate: oData.pickupDate,
                    pickupTime: oData.pickupTime,
                    pickupDuration: oData.pickupDuration,
                    pickupComment: oData.pickupComment
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Main.PickupErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                        fnAfterSavePickupDialog();
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.PickupErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.PickupErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });

        },

        _checkPickupStatus: function(oSelected){

            for (let iIndex = 0; iIndex < oSelected.length; iIndex++){

                const oContext = oSelected[iIndex].getBindingContext();
                const sStatus = oContext.getProperty("reservationStatus");
                if (sStatus == '4' || sStatus == '5'){
                    const oBundle = this.getView().getModel("i18n").getResourceBundle();
                    const sMessage = oBundle.getText("Main.ErrorMsgPickupStatus");
                    MessageToast.show(sMessage);
                    return false;
                }

            }
            return true;

        },

        _setPickupFieldsMandatory: function(){

            this.byId("idMainPickupDate").setMandatory(true);
            this.byId("idMainPickupTime").setMandatory(true);
            this.byId("idMainPickupDuration").setMandatory(true);

        },        

        _openDialogPickup: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext();     
            const oModel = oContext.getModel();

            if (this._checkPickupStatus(oSelected)){

                if (!this._pPickupDialog) {

                    this._pPickupDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.ep.zgiftscockpit.view.fragments.MainPickupDialog",
                        controller: this
                    }).then((oDialog) => {
                        oView.addDependent(oDialog);
                        this._setEscapeHandler(oDialog);
                        this._loadDurationvalues();
                        this._setPickupFieldsMandatory();
                        return oDialog;
                    });

                }

                this._pPickupDialog.then((oDialog) => {
                    oDialog.setBindingContext(oContext);
                    this.OnDialogPickupArrowsVisibility();
                    oDialog.open();
                });

            } else {

            }

        },

//===== CREATE/CHANGE COMMENT =================================//

        onChangeCommentDialog: function(oEvent){

            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();

            if (oSelected.length) {

                this._openDialogComment(oSelected);

            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineComment");
                MessageToast.show(sMessage);
            }

        },

        OnDialogCommentArrowsVisibility: function(){

            if (this._iCurrentIndex == 0) {
                this.getView()?.byId("idDialogCommentLeft")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogCommentLeft")?.setEnabled(true);
            }

            if (this._iCurrentIndex == this._aSelectedItems.length - 1) {
                this.getView()?.byId("idDialogCommentRight")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogCommentRight")?.setEnabled(true);
            }

        },

        onCancelCommentDialog: function(oEvent){

            this._checkCloseDialog(null, this._pCommentDialog);

        },

        OnDialogCommentMoveRight: function(oEvent){

            this._checkPendingChangesCommentDialog(() => {

                if (this._iCurrentIndex < this._aSelectedItems.length - 1) {

                    this._iCurrentIndex++;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pCommentDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
    
                    this.getView()?.byId("idDialogCommentLeft")?.setEnabled(true);
                } 
                
                this.OnDialogCommentArrowsVisibility();
                
            });

        },

        OnDialogCommentMoveLeft: function(oEvent) {

            this._checkPendingChangesCommentDialog(() => {

                if (this._iCurrentIndex > 0) {

                    this._iCurrentIndex--;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pCommentDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
            
                    this.getView()?.byId("idDialogCommentRight")?.setEnabled(true);
    
                }
            
                this.OnDialogCommentArrowsVisibility();

            });

        },

        onSaveCommentDialog: function(oEvent){         

            this._checkPendingChangesCommentDialog(() => {

                this._pCommentDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
            });

        },

        _openDialogComment: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext();     
            const oModel = oContext.getModel();

            if (!this._pCommentDialog) {

                this._pCommentDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainChangeCommentDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    this._setEscapeHandler(oDialog);
                    return oDialog;
                });

            }

            this._pCommentDialog.then((oDialog) => {
                oDialog.setBindingContext(oContext);
                this.OnDialogCommentArrowsVisibility();
                oDialog.open();
            });

        },

        _submitChangesCommentDialog: function(fnAfterSaveCommentDialog){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const oDialog = this.byId("idChangeCommentDialog");
            const oContext = oDialog.getBindingContext();
            const oData = oContext?.getObject();
            const sTitle = this.byId("idCommentTitleInput").getValue();
            const sComment = this.byId("idCommentObjTextArea").getValue();

            oModel.callFunction("/changeComment", {
                method: "POST",
                urlParameters: {
                    reservationNo: oData.reservationNo,
                    CommentTitle: sTitle,
                    CommentObj: sComment
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Main.CommentErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                        fnAfterSaveCommentDialog();
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });

        },        

        _checkPendingChangesCommentDialog: function(fnAfterSaveCommentDialog){

            const oModel = this.getView().getModel(); 
            const oPendingChanges = oModel?.getPendingChanges();
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            if (Object.keys(oPendingChanges).length > 0) {

                MessageBox.confirm(
                    oResourceBundle.getText("Main.ExitSaveChanges"), 
                    {
                        title: oResourceBundle.getText("Main.ConfirmationTitle"), 
                        actions: [
                            oResourceBundle.getText("Main.Yes"),
                            oResourceBundle.getText("Main.No")                          ],
                        emphasizedAction: oResourceBundle.getText("Main.No"),
                        onClose: function (sAction) {
                            if (sAction === oResourceBundle.getText("Main.Yes")) {
                                this._submitChangesCommentDialog(fnAfterSaveCommentDialog);
                            }
                        }.bind(this)
                    }
                );                        

            } else {
                fnAfterSaveCommentDialog();
            }
        },

//===== SEND MAIL =================================//

        onSendMailDialog: function(oEvent){

            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            if (oSelected.length === 1) {

                MessageBox.confirm(
                    oResourceBundle.getText("Main.QuestionSendMail"), 
                    {
                        title: oResourceBundle.getText("Main.ConfirmationTitle"), 
                        actions: [
                            oResourceBundle.getText("Main.Yes"),
                            oResourceBundle.getText("Main.No")                          ],
                        emphasizedAction: oResourceBundle.getText("Main.No"),
                        onClose: function (sAction) {
                            if (sAction === oResourceBundle.getText("Main.Yes")) {
                                this._submitSendMailDialog(oSelected);
                            }
                        }.bind(this)
                    }
                );

            } else {
                const sMessage = oResourceBundle.getText("Main.ErrorMsgSelectLineMail");
                MessageToast.show(sMessage);
            }
y
        },

        _submitSendMailDialog: function(oSelected){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const sReservationNo = oSelected[0]?.getBindingContext()?.getObject()?.reservationNo;

            oModel.callFunction("/sendEmail", {
                method: "POST",
                urlParameters: {
                    reservationNo: sReservationNo
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Main.CommentErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                    }

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });            

        },

//===== MISSION CANCELLED =================================//

        onMissionCancelledDialog: function(oEvent){

            const oSmartTable = this.getView()?.byId("idSmartTable");
            const oSelected = oSmartTable?.getTable()?.getSelectedItems();

            if (oSelected.length) {

                this._openDialogMissionCanc(oSelected);

            } else {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sMessage = oBundle.getText("Main.ErrorMsgSelectLineMissionCanc");
                MessageToast.show(sMessage);
            }

        },

        onSaveMissionCancDialog: function(oEvent){

            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const oDatePicker = this.byId("idMissionCancDateInput");
            const sDate = oDatePicker.getValue();

            if (sDate){

                this._submitMissionCancDialog();

            } else {
                oDatePicker.setValueState("Error");
                oDatePicker.setValueStateText(oResourceBundle.getText("Main.DateRequired"));
            }

        },

        onMissionCancDateChange: function(oEvent){

            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const oDatePicker = this.byId("idMissionCancDateInput");
            const sDate = oDatePicker.getValue();

            if (sDate){
                oDatePicker.setValueState("None");
                oDatePicker.setValueStateText("");
            } 

        },

        onCancelMissionCancDialog: function(oEvent){

            this._pMissionCancDialog.then(function (oDialog) {
                oDialog.close();
            });

        },

        _submitMissionCancDialog: function(){

            const oModel = this.getView()?.getModel();
            const oDialog = this.byId("idMissionCancDialog");
            const oContext = oDialog.getBindingContext();
            const sReservationNo = oContext.getProperty("reservationNo"); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const sComment = this.byId("idMissionCancCommentsInput").getValue();
            const sDate = new Date(this.byId("idMissionCancDateInput").getValue());


            oModel.callFunction("/missionCancelled", {
                method: "POST",
                urlParameters: {
                    reservationNo: sReservationNo,
                    Comment: sComment,
                    Date: sDate
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Main.CommentErrorMsg");
                            MessageBox.success(sSuccessMessage);
                        }
                    }
                    this._recalculateIconTabBarCount();
                    this._pMissionCancDialog.then(function (oDialog) {
                        oDialog.close();
                    });

                }.bind(this),
                error: function(oError, oResponse) {

                    const oResponseJSON = JSON.parse(oError.responseText);
                    try {
                        const sMessage = oResponseJSON?.error?.message?.value;
                    
                        if (sMessage) {
                            MessageBox.error(sMessage);
                        } else {
                            const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Main.CommentErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });

        },

        _openDialogMissionCanc: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext();     
            const oModel = oContext.getModel();

            if (!this._pMissionCancDialog) {

                this._pMissionCancDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.MainMissionCancDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    this._setEscapeHandler(oDialog);
                    return oDialog;
                });

            }

            this._pMissionCancDialog.then((oDialog) => {
                oDialog.setBindingContext(oContext);
                this.byId("idMissionCancCommentsInput").setValue();
                this.byId("idMissionCancDateInput").setValue();
                oDialog.open();
            });

        }

    });
});
