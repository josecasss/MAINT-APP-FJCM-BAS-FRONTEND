sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/controls/common/feeds/FeedItem"
], function (PageController, JSONModel, FeedItem) {
    "use strict";

    return PageController.extend("maintnoti.maint.ext.analytics.AnalyticsPage", {

        onInit: function () {
            PageController.prototype.onInit.apply(this, arguments);
            var oView = this.getView();
            oView.setModel(new JSONModel({ count: 0, totalHours: 0, openCount: 0 }), "kpi");
            oView.setModel(new JSONModel({ data: [] }), "chartStatus");
            oView.setModel(new JSONModel({ data: [] }), "chartPriority");

            var oModel = this.getOwnerComponent().getModel();
            if (oModel) {
                oModel.getMetaModel().requestObject("/MaintNotificationAnal/").then(function () {
                    this._loadAllData(oModel);
                }.bind(this)).catch(function () {});
            }
        },

        _loadAllData: function (oModel) {
            var oView = this.getView();
            var oBinding = oModel.bindList("/MaintNotificationAnal");

            oBinding.requestContexts(0, 500).then(function (aCtx) {
                if (oView.bIsDestroyed) { return; }

                var total = 0, openCount = 0;
                var statusMap = {}, priorityMap = {};

                aCtx.forEach(function (ctx) {
                    var hours    = parseFloat(ctx.getProperty("SlaHours") || 0);
                    var status   = ctx.getProperty("Status")       || "?";
                    var stText   = ctx.getProperty("StatusText")   || status;
                    var priority = ctx.getProperty("Priority")     || "?";
                    var prText   = ctx.getProperty("PriorityText") || priority;

                    total += hours;
                    if (status === "101") { openCount++; }

                    if (!statusMap[status])   { statusMap[status]   = { StatusText:   stText, SlaHours: 0 }; }
                    if (!priorityMap[priority]){ priorityMap[priority]= { PriorityText: prText, SlaHours: 0 }; }
                    statusMap[status].SlaHours   += hours;
                    priorityMap[priority].SlaHours += hours;
                });

                oView.getModel("kpi").setData({ count: aCtx.length, totalHours: total, openCount: openCount });
                oView.getModel("chartStatus").setProperty("/data",   Object.values(statusMap));
                oView.getModel("chartPriority").setProperty("/data", Object.values(priorityMap));

            }).catch(function () {}).finally(function () { oBinding.destroy(); });
        },

        onChartTypeChange: function (oEvent) {
            var sKey      = oEvent.getParameter("item").getKey();
            var sId       = oEvent.getSource().getId();
            var bStatus   = sId.indexOf("typeStatusBtn") !== -1;
            var oViz      = this.byId(bStatus ? "vizStatus" : "vizPriority");
            var sDimLabel = bStatus ? "Status" : "Priority";

            oViz.setVizType(sKey);
            oViz.removeAllFeeds();

            if (sKey === "pie" || sKey === "donut") {
                oViz.addFeed(new FeedItem({ uid: "color", type: "Dimension", values: [sDimLabel] }));
                oViz.addFeed(new FeedItem({ uid: "size",  type: "Measure",   values: ["SLA Hours"] }));
            } else {
                oViz.addFeed(new FeedItem({ uid: "valueAxis",    type: "Measure",   values: ["SLA Hours"] }));
                oViz.addFeed(new FeedItem({ uid: "categoryAxis", type: "Dimension", values: [sDimLabel] }));
            }
        }
    });
});
