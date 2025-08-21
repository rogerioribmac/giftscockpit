sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
function (Controller,MessageToast,MessageBox) {
    "use strict";

    return Controller.extend("com.ep.zgiftscockpit.controller.Item", {
        
        onInit: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteItem").attachPatternMatched(this._onRouteMatched, this);
        },

        onAttachmentSelection: function(oEvent){

          oEvent.preventDefault();
          const oItem = oEvent?.getParameter("item");
          const sFileName = oItem?.getFileName();
          const sMimeType = oItem?.getMediaType();
          let sBase64 = oItem?.data("fileContent");

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

        onAfterItemAdded: function(oEvent){

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
                    var oUploadSet = this.byId("idItemsUploadSet");
                    oUploadSet.removeAllIncompleteItems();
                    oUploadSet.getBinding("items").refresh();

                    const sSapMessage = oResponse?.headers?.["sap-message"];
                    if (sSapMessage){
                      try {
                          const oMessage = JSON.parse(sSapMessage);
                          MessageBox.success(oMessage.message);
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

                var oUploadSet = this.byId("idItemsUploadSet");
                oUploadSet.getBinding("items").refresh();

                const sSapMessage = oResponse?.headers?.["sap-message"];
                if (sSapMessage){
                  try {
                      const oMessage = JSON.parse(sSapMessage);
                      MessageBox.success(oMessage.message);
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
        }

    });
});
