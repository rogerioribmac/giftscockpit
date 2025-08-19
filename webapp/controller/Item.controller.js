sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
function (Controller,MessageToast) {
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
          debugger;
          var item = oEvent.getParameter("item")
          this._createEntity(item)
          .then((id) => {
            this._uploadContent(item, id);
          })
          .catch((err) => {
            console.log(err);
          })

        },

        onUploadCompleted: function(oEvent){
          var oUploadSet = this.byId("idItemsUploadSet");
          oUploadSet.removeAllIncompleteItems();
          oUploadSet.getBinding("items").refresh();
        },

        _createEntity: function (item) {

            var data = {
              mediaType: item.getMediaType(),
              fileName: item.getFileName(),
              size: item.getFileObject().size
            };
    
          return new Promise((resolve, reject) => {
            oModel.callFunction("/allowReservation", {
                method: "POST",
                urlParameters: {
                    reservationNo: sReservationNo,
                    Reason: sReason
                },
                success: function(oData, oResponse) {

                }.bind(this),
                error: function(oError, oResponse) {
                    
                }.bind(this)
            });
          })	

        },

        _uploadContent: function (item, id) {

          var url = `/attachments/Files(${id})/content`
          item.setUploadUrl(url);	
          var oUploadSet = this.byId("uploadSet");
          oUploadSet.setHttpRequestMethod("PUT")
          oUploadSet.uploadItem(item);

        }

    });
});
