sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel"
], function (PageController, JSONModel) {
    "use strict";

    return PageController.extend("maintnoti.maint.ext.analytics.AnalyticsPage", {
        onInit: function () {
            PageController.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel({ count: "...", totalHours: "...", openCount: "..." }), "kpi");
        },

        onAfterRendering: function () {
            if (PageController.prototype.onAfterRendering) {
                PageController.prototype.onAfterRendering.apply(this, arguments);
            }
            var oModel = this.getOwnerComponent().getModel();
            if (oModel) {
                this._loadKpis(oModel);
            }
        },

        _loadKpis: function (oModel) {
            var oView = this.getView();
            oModel.bindList("/MaintNotificationAnal").requestContexts(0, 500).then(function (aCtx) {
                var total = 0;
                var openCount = 0;
                aCtx.forEach(function (ctx) {
                    total += (ctx.getProperty("SlaHours") || 0);
                    if (ctx.getProperty("Status") === "101") {
                        openCount++;
                    }
                });
                oView.getModel("kpi").setData({
                    count: aCtx.length,
                    totalHours: total,
                    openCount: openCount
                });
            });
        }
    });
});