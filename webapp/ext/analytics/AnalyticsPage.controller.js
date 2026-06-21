sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel"
], function (PageController, JSONModel) {
    "use strict";

    return PageController.extend("maintnoti.maint.ext.analytics.AnalyticsPage", {
        onInit: function () {
            PageController.prototype.onInit.apply(this, arguments);
            this._kpiLoaded = false;
            this.getView().setModel(new JSONModel({ count: "...", totalHours: "...", openCount: "..." }), "kpi");
        },

        onAfterRendering: function () {
            if (PageController.prototype.onAfterRendering) {
                PageController.prototype.onAfterRendering.apply(this, arguments);
            }
            if (this._kpiLoaded) { return; }
            var oModel = this.getOwnerComponent().getModel();
            if (oModel) {
                this._loadKpis(oModel);
            }
        },

        _loadKpis: function (oModel) {
            this._kpiLoaded = true;
            var oView = this.getView();
            var oListBinding = oModel.bindList("/MaintNotificationAnal");
            oListBinding.requestContexts(0, 500).then(function (aCtx) {
                if (oView.bIsDestroyed) { return; }
                var total = 0;
                var openCount = 0;
                aCtx.forEach(function (ctx) {
                    total += parseFloat(ctx.getProperty("SlaHours") || 0);
                    if (ctx.getProperty("Status") === "101") {
                        openCount++;
                    }
                });
                oView.getModel("kpi").setData({
                    count: aCtx.length,
                    totalHours: total,
                    openCount: openCount
                });
            }).catch(function () {
                // KPIs remain at default "..."
            }).finally(function () {
                oListBinding.destroy();
            });
        }
    });
});
