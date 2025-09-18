sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
],
function (Controller,MessageToast,Fragment,MessageBox) {
    "use strict";

    return Controller.extend("com.ep.zgiftscockpit.controller.Item", {

//===== GENERAL METHODS =================================//

        onInit: function () {

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteItem").attachPatternMatched(this._onRouteMatched, this);

            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.byId("idItemsDocumentFlow").setNoData(oBundle.getText("Item.NoDocumentFlow"));

            this._setInitialSortOrder();

        },

        formatDialogModifyItemTitle: function(sText, sItem){

            return sText + " " + sItem;

        },

        onItemClearSelection: function(oEvent){
            
            const oSmartTable = this.byId("idSmartTableItems");
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

        _setEscapeHandler: function(oDialog) {

            const oView = this.getView();
        
            oDialog.setEscapeHandler((oPromise) => {
                this._checkCloseDialog(oPromise);
            });

        },        

        _checkCloseDialog: function(oPromise, oDialog){

          const oModel = this.getView().getModel();
          const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
          const oPendingChanges = oModel.getPendingChanges();

          if (Object.keys(oPendingChanges).length > 0) {
              MessageBox.confirm(
                  oResourceBundle.getText("Item.ExitWithoutSaving"), 
                  {
                      title: oResourceBundle.getText("Item.ConfirmationTitle"), 
                      actions: [
                          oResourceBundle.getText("Item.Yes"),
                          oResourceBundle.getText("Item.No")                          ],
                      emphasizedAction: oResourceBundle.getText("Item.No"),
                      onClose: function (sAction) {
                          if (sAction === oResourceBundle.getText("Item.Yes")) {
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

        _onRouteMatched: function (oEvent) {

            const sReservationNo = oEvent.getParameter("arguments").reservationNo;
            const oView = this.getView();

            oView?.bindElement({
                path: "/zz_pv_gifts_ckpt_reservations('" + sReservationNo + "')",

                parameters: {
                  expand: "to_items"
                },

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
                    } else {
                      const oSmartTable = oView.byId("idSmartTableItems");
                    }
                    
                  }.bind(this)
                }
              });
        },

        _setInitialSortOrder: function(oEvent){

            var oSmartTable = this.getView().byId("idSmartTableItems");            
            oSmartTable.applyVariant({
                sort: {
                    sortItems: 
                        [{ 
                            columnKey: "reservationItem", 
                            operation:"Ascending"}
                        ]
                }
            });

        },

//===== STOCK OVERVIEW =================================//        
        onStockOverview: function(oEvent){

          const oSmartTable = this.getView()?.byId("idSmartTableItems");
          const oSelected = oSmartTable?.getTable()?.getSelectedItems();
          const oBundle = this.getView().getModel("i18n").getResourceBundle();
          
          if (oSelected.length == 0){
              const sMessage = oBundle.getText("Item.ErrorMsgSelectLineStockOverview");
              MessageToast.show(sMessage);
          } else if (oSelected.length > 1){
              const sMessage = oBundle.getText("Item.ErrorMsgSelectLineStockOverview");
              MessageToast.show(sMessage);
          } else {

              this._openStockOverview(oSelected);

          }  

        },

        _openStockOverview: function(oSelected){

          const oContext = oSelected[0].getBindingContext();
          const sMaterial = oContext.getProperty("materialNo");
          const oRouter = sap.ushell.Container.getService("CrossApplicationNavigation");

          const oNavigationTarget = {
              target: {
                  semanticObject: "ZPRESTO",
                  action: "zistockGifts"
              },
              params: {
                  "materialNo": sMaterial,
                  "sap-external-app": true
              }
          };

          const sHash = oRouter.hrefForExternal(oNavigationTarget);
          const sLaunchpadUrl = window.location.href.split("#")[0];
          const sFullUrl = sLaunchpadUrl + sHash;
          window.open(sFullUrl, "_blank");

        },

//===== MODIFY ITEM =================================//         
        onModifyItem: function(oEvent){

          const oSmartTable = this.getView()?.byId("idSmartTableItems");
          const oSelected = oSmartTable?.getTable()?.getSelectedItems();
          const oBundle = this.getView().getModel("i18n").getResourceBundle();
          
          if (oSelected.length == 0){
              const sMessage = oBundle.getText("Item.ErrorMsgSelectLineModify");
              MessageToast.show(sMessage);
          } else {

            let bError = false;
            bError = oSelected.some(oItem => {
              const oContext = oItem.getBindingContext();
              const sCategory = oContext.getProperty("matCategory");
              return sCategory !== "003"; 
            });

            if (bError){
              const sMessage = oBundle.getText("Item.ErrorModifyCategory3");
              MessageToast.show(sMessage);
            } else {
              
              this._openModifyDialog(oSelected);

            }

          }

        },

        OnDialogModItemArrowsVisibility: function(){

            if (this._iCurrentIndex == 0) {
                this.getView()?.byId("idDialogModItemLeft")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogModItemLeft")?.setEnabled(true);
            }

            if (this._iCurrentIndex == this._aSelectedItems.length - 1) {
                this.getView()?.byId("idDialogModItemRight")?.setEnabled(false);
            } else {
                this.getView()?.byId("idDialogModItemRight")?.setEnabled(true);
            }

        },

        onSaveModifyItem: function(oEvent){         

            this._checkPendingChangesModifyItem(() => {

                this.onItemClearSelection();
                this._pModItemDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
            });

        },

        OnDialogModItemMoveLeft: function(oEvent){

            this._checkPendingChangesModifyItem(() => {

                if (this._iCurrentIndex > 0) {

                    this._iCurrentIndex--;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pModItemDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
            
                    this.getView()?.byId("idDialogModItemRight")?.setEnabled(true);
    
                }
            
                this.OnDialogModItemArrowsVisibility();

            });

        },

        OnDialogModItemMoveRight: function(oEvent){

            this._checkPendingChangesModifyItem(() => {

                if (this._iCurrentIndex < this._aSelectedItems.length - 1) {

                    this._iCurrentIndex++;
                    const oContext = this._aSelectedItems[this._iCurrentIndex].getBindingContext();
                    this._pModItemDialog.then(oDialog => {
                        oDialog.setBindingContext(oContext);
                    });
    
                    this.getView()?.byId("idDialogModItemLeft")?.setEnabled(true);
                } 
                
                this.OnDialogModItemArrowsVisibility();
                
            });

        },

        onSaveModifyItem: function(oEvent){         

            this._checkPendingChangesModifyItem(() => {

                this.onItemClearSelection();
                this._pModItemDialog.then(function (oDialog) {
                    oDialog.close();
                });
                
            });

        },

        onCancelModifyItem: function(oEvent){

            this._checkCloseDialog(null, this._pModItemDialog);

        },

        onReservedQuantityChange: function(oEvent){

            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();

            const sReserved = oEvent.getParameter("value") || oEvent.getSource().getValue();
            const sDelivered = oData.deliveredQuantity;

            if (Number(sDelivered) > Number(sReserved)){
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText(oResourceBundle.getText("Item.ReservedQuantityError"));
            } else {
                oEvent.getSource().setValueState("None");
            }

        },

        _checkPendingChangesModifyItem: function(fnAfterSaveModifyHeader){

            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const oModel = this.getView().getModel(); 
            const oReservedQty = this.byId("idReservedQuantitySmartField");
            const oPendingChanges = oModel?.getPendingChanges();

            if (oReservedQty.getValueState() !== sap.ui.core.ValueState.Error){
                if (Object.keys(oPendingChanges).length > 0) {

                    MessageBox.confirm(
                        oResourceBundle.getText("Item.ExitSaveChanges"), 
                        {
                            title: oResourceBundle.getText("Item.ConfirmationTitle"), 
                            actions: [
                                oResourceBundle.getText("Item.Yes"),
                                oResourceBundle.getText("Item.No")                          ],
                            emphasizedAction: oResourceBundle.getText("Item.No"),
                            onClose: function (sAction) {
                                if (sAction === oResourceBundle.getText("Item.Yes")) {
                                    this._submitChangesModifyItem();
                                    fnAfterSaveModifyHeader();
                                }
                            }.bind(this)
                        }
                    );
                    
                } else {
                    fnAfterSaveModifyHeader();
                }
            } else {
                MessageBox.error(oReservedQty.getValueStateText());
            }

        },  

        _submitChangesModifyItem: function(){

            const oModel = this.getView()?.getModel(); 
            const oResourceBundle = this.getView()?.getModel("i18n")?.getResourceBundle();
            const oDialog = this.byId("idModifyItemFragment");
            const oContext = oDialog.getBindingContext();
            const oData = oContext?.getObject();

            oModel.callFunction("/modifyItem", {
                method: "POST",
                urlParameters: {
                  reservationNo: oData.reservationNo,
                  reservationItem: oData.reservationItem,
                  function: oData.function,
                  FirstName: oData.firstName,
                  LastName: oData.lastName,
                  RecipientCountry: oData.recipientCountry,
                  ReservedQuantity: oData.reservedQuantity
                },
                success: function(oData, oResponse) {

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                        try {
                            const oMessage = JSON.parse(sSapMessage);
                            MessageBox.success(oMessage.message);
                        } catch (e) {
                            const sSuccessMessage = oResourceBundle.getText("Item.callActionErrorMsg");
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
                            const sErrorMessage = oBundle.getText("Item.callActionErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                    } catch (e) {
                        const sErrorMessage = oBundle.getText("Item.callActionErrorMsg");
                        MessageBox.error(sErrorMessage);
                    } finally {
                    }
                    
                }.bind(this)
            });

        },

        _openModifyDialog: function(oSelected){

            this._aSelectedItems = oSelected; 
            this._iCurrentIndex = 0;
            const oView = this.getView();
            const oContext = oSelected[this._iCurrentIndex].getBindingContext();     
            const oModel = oContext.getModel();

            if (!this._pModItemDialog) {

                this._pModItemDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.ep.zgiftscockpit.view.fragments.ItemModifyItem",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    this._setEscapeHandler(oDialog);
                    this._attachChange();
                    return oDialog;
                });

            }
          
            this._pModItemDialog.then((oDialog) => {
                oDialog.setBindingContext(oContext);
                this.OnDialogModItemArrowsVisibility();
                this._cleanReservationQtyError();
                oDialog.open();
            });
          

        },

        _cleanReservationQtyError: function(){
            
            this.byId("idReservedQuantitySmartField").setValueState("None");
            this.byId("idReservedQuantitySmartField").setValueStateText();

        },

        _attachChange: function(){

            var oSmartField = this.byId("idReservedQuantitySmartField");
            oSmartField.attachChange(this.onReservedQuantityChange.bind(this));

        },

//===== ATTACHMENTS =================================//

        onAttachmentSelection: function(oEvent){

          oEvent.preventDefault();
          const oItem = oEvent?.getParameter("item");
          const sFileName = oItem?.getFileName();
          const sMimeType = oItem?.getMediaType();
          let sBase64 = oItem?.data("fileContent");

          const sUrl = this._generateBlobUrl(sBase64,sMimeType);

          const sMimeLower = sMimeType.toLowerCase();
          if (sMimeLower.includes("excel") || sMimeLower.includes("word") || sMimeLower.includes("presentation")) {
              const oLink = document.createElement("a");
              oLink.href = sUrl;
              oLink.download = sFileName;
              document.body.appendChild(oLink);
              oLink.click();
              document.body.removeChild(oLink);
          } else {
              window.open(sUrl, "_blank");
          }

        },

        onAfterItemAdded: function(oEvent){

          // in order to include the file at the end, and not in the beginning. 
          // Then the order will be the same whe the page is reloaded
          var oUploadSet = this.byId("idItemsUploadSet");
          var oItem = oEvent.getParameter("item");
          oUploadSet.addItem(oItem);

        },

        onUploadCompleted: function(oEvent){

          const oModel = this.getView().getModel();
          const oItem = oEvent.getParameter("item")
          const oContext = oEvent.getSource().getBindingContext();
          const sReservationNo = oContext.getProperty("reservationNo");   

          let oReader = new FileReader();

          oReader.onload = (oEvent) => {

            const sBase64Content = oEvent.target.result.split(",")[1];
            const oBundle = this.getView().getModel("i18n").getResourceBundle();

            return new Promise((resolve, reject) => {
              oModel.callFunction("/uploadFile", {
                  method: "POST",
                  urlParameters: {
                      reservationNo: sReservationNo,
                      Filename: oItem.getFileName(),
                      Mediatype: oItem.getMediaType(),
                      Filesize: oItem.getFileObject().size,
                      Content: sBase64Content
                  },
                  success: function(oData, oResponse) {

                    this._insertUploadSet(oData,oItem,sBase64Content);

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                      try {
                          const oMessage = JSON.parse(sSapMessage);
                          MessageToast.show(oMessage.message);
                      } catch (e) {
                          const sSuccessMessage = oBundle.getText("Item.UploadErrorMsg");
                          MessageBox.error(sSuccessMessage);
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
                            const sErrorMessage = oBundle.getText("Item.UploadErrorMsg");
                            MessageBox.error(sErrorMessage);
                        }
                      } catch (e) {
                        const sErrorMessage = oBundle.getText("Item.UploadErrorMsg");
                        MessageBox.error(sErrorMessage);
                      } 
                  }.bind(this)
              });
            })
          }

          const oFile = oItem.getFileObject();
          oReader.readAsDataURL(oFile);
          
        },

        onAfterItemRemoved: function(oEvent){

          const oModel = this.getView().getModel();
          const oItem = oEvent.getParameter("item"); 
          const oContext = oItem.getBindingContext();
          const sReservationNo = oContext.getProperty("reservationNo");
          const sTypeIdA = oContext.getProperty("typeIdA"); 
          const sTypeIdB = oContext.getProperty("typeIdB");
          const sAttachId = oContext.getProperty("attachId");
          
          oModel.callFunction("/deleteFile", {
              method: "POST",
              urlParameters: {
                  reservationNo: sReservationNo,
                  TypeIdA: sTypeIdA,
                  AttachId: sAttachId,
                  TypeIdB: sTypeIdB
              },
              success: function(oData, oResponse) {

                const sSapMessage = oResponse?.headers?.["sap-message"];
                if (sSapMessage){
                  try {
                      const oMessage = JSON.parse(sSapMessage);
                      MessageToast.show(oMessage.message);
                  } catch (e) {
                      const sSuccessMessage = oBundle.getText("Item.UploadErrorMsg");
                      MessageBox.error(sSuccessMessage);
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
                        const sErrorMessage = oBundle.getText("Item.UploadErrorMsg");
                        MessageBox.error(sErrorMessage);
                    }
                  } catch (e) {
                    const sErrorMessage = oBundle.getText("Item.UploadErrorMsg");
                    MessageBox.error(sErrorMessage);
                  } 
              }.bind(this)
          });
        },

        _generateBlobUrl: function(sBase64,sMimeType){

          if (!sBase64) {
              const oBundle = this.getView().getModel("i18n").getResourceBundle();
              const sMessage = oBundle.getText("Item.AttachNoContent");
              sap.m.MessageToast.show(sMessage);
              return;
          }

          if (sBase64.startsWith("data:")) {
              sBase64 = sBase64.split(",")[1];
          }

          const sByteCharacters = atob(sBase64);
          const aByteNumbers = new Array(sByteCharacters.length);
          for (let iIndex = 0; iIndex < sByteCharacters.length; iIndex++) {
              aByteNumbers[iIndex] = sByteCharacters.charCodeAt(iIndex);
          }

          const aByteArray = new Uint8Array(aByteNumbers);
          const oBlob = new Blob([aByteArray], { type: sMimeType });
          const sUrl = URL.createObjectURL(oBlob);
          return sUrl;
          
        },

        _insertUploadSet: function(oData,oItem,sBase64Content){

          oItem.setUrl(this._generateBlobUrl(sBase64Content,oItem.getMediaType()));

          oItem.insertStatus(new sap.m.ObjectStatus({
            title: oData.uploadFile.titleBy,
            text: oData.uploadFile.valueBy
          }));

          oItem.insertStatus(new sap.m.ObjectStatus({
            title: oData.uploadFile.titleOn,
            text: oData.uploadFile.valueOn
          }));

          oItem.data("fileContent", sBase64Content);

          oItem.setVisibleEdit(false);

        }

    });
});
