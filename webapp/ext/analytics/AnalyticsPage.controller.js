sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Item",
    "sap/viz/ui5/controls/common/feeds/FeedItem"
], function (PageController, JSONModel, Item, FeedItem) {
    "use strict";

    return PageController.extend("maintnoti.maint.ext.analytics.AnalyticsPage", {

        onInit: function () {
            PageController.prototype.onInit.apply(this, arguments);
            this._dataLoaded  = false;
            this._feedsReady  = false;
            this._rawData     = [];
            var oView = this.getView();
            oView.setModel(new JSONModel({ count: 0, totalHours: 0, openCount: 0 }), "kpi");
            oView.setModel(new JSONModel({ data: [] }), "chartStatus");
            oView.setModel(new JSONModel({ data: [] }), "chartPriority");
        },

        onAfterRendering: function () {
            if (PageController.prototype.onAfterRendering) {
                PageController.prototype.onAfterRendering.apply(this, arguments);
            }
            if (this._dataLoaded) { return; }
            var oModel = this.getOwnerComponent().getModel();
            if (oModel) {
                this._dataLoaded = true;
                this._loadAllData(oModel);
            }
        },

        _loadAllData: function (oModel) {
            var that     = this;
            var oView    = this.getView();
            var oBinding = oModel.bindList("/MaintNotificationAnal");

            oBinding.requestContexts(0, 500).then(function (aCtx) {
                if (oView.bIsDestroyed) { return; }

                that._rawData = aCtx.map(function (ctx) {
                    var techFirst = ctx.getProperty("TechFirstName") || "";
                    var techLast  = ctx.getProperty("TechLastName")  || "";
                    var techID    = ctx.getProperty("TechnicianID")  || "?";
                    var techName  = (techFirst + " " + techLast).trim() || techID;
                    return {
                        status:       ctx.getProperty("Status")    || "?",
                        statusText:   ctx.getProperty("StatusText") || ctx.getProperty("Status") || "?",
                        priority:     ctx.getProperty("Priority")   || "?",
                        priorityText: ctx.getProperty("PriorityText") || ctx.getProperty("Priority") || "?",
                        plant:        ctx.getProperty("PlantID")    || "?",
                        plantText:    ctx.getProperty("PlantName")  || ctx.getProperty("PlantID") || "?",
                        technician:   techID,
                        techName:     techName,
                        slaHours:     parseFloat(ctx.getProperty("SlaHours") || 0)
                    };
                });

                that._populateFilters();
                that._applyFilters();

            }).catch(function () {}).finally(function () { oBinding.destroy(); });
        },

        _populateFilters: function () {
            var oView     = this.getView();
            var oSelects  = {
                status:     oView.byId("filterStatus"),
                priority:   oView.byId("filterPriority"),
                plant:      oView.byId("filterPlant"),
                technician: oView.byId("filterTechnician")
            };

            Object.values(oSelects).forEach(function (oSel) {
                while (oSel.getItems().length > 1) { oSel.removeItem(1); }
            });

            var seen = { status: {}, priority: {}, plant: {}, technician: {} };
            this._rawData.forEach(function (row) {
                if (!seen.status[row.status]) {
                    seen.status[row.status] = true;
                    oSelects.status.addItem(new Item({ key: row.status, text: row.statusText }));
                }
                if (!seen.priority[row.priority]) {
                    seen.priority[row.priority] = true;
                    oSelects.priority.addItem(new Item({ key: row.priority, text: row.priorityText }));
                }
                if (!seen.plant[row.plant]) {
                    seen.plant[row.plant] = true;
                    oSelects.plant.addItem(new Item({ key: row.plant, text: row.plantText }));
                }
                if (!seen.technician[row.technician]) {
                    seen.technician[row.technician] = true;
                    oSelects.technician.addItem(new Item({ key: row.technician, text: row.techName }));
                }
            });
        },

        _applyFilters: function () {
            var oView     = this.getView();
            var sStatus   = oView.byId("filterStatus").getSelectedKey();
            var sPriority = oView.byId("filterPriority").getSelectedKey();
            var sPlant    = oView.byId("filterPlant").getSelectedKey();
            var sTech     = oView.byId("filterTechnician").getSelectedKey();

            var aFiltered = this._rawData.filter(function (row) {
                return (!sStatus   || row.status     === sStatus)   &&
                       (!sPriority || row.priority   === sPriority) &&
                       (!sPlant    || row.plant       === sPlant)    &&
                       (!sTech     || row.technician  === sTech);
            });

            var total = 0, openCount = 0;
            var statusMap = {}, priorityMap = {};

            aFiltered.forEach(function (row) {
                total += row.slaHours;
                if (row.status === "101") { openCount++; }
                if (!statusMap[row.status])     { statusMap[row.status]     = { StatusText: row.statusText, SlaHours: 0 }; }
                if (!priorityMap[row.priority]) { priorityMap[row.priority] = { PriorityText: row.priorityText, SlaHours: 0 }; }
                statusMap[row.status].SlaHours    += row.slaHours;
                priorityMap[row.priority].SlaHours += row.slaHours;
            });

            oView.getModel("kpi").setData({ count: aFiltered.length, totalHours: total, openCount: openCount });
            oView.getModel("chartStatus").setProperty("/data",   Object.values(statusMap));
            oView.getModel("chartPriority").setProperty("/data", Object.values(priorityMap));

            // Add feeds once after first real data arrives — prevents [50053] on empty initial state
            if (!this._feedsReady && aFiltered.length > 0) {
                this._feedsReady = true;
                this._initFeeds();
            }
        },

        _initFeeds: function () {
            var oVizStatus   = this.byId("vizStatus");
            var oVizPriority = this.byId("vizPriority");

            oVizStatus.removeAllFeeds();
            oVizStatus.addFeed(new FeedItem({ uid: "valueAxis",    type: "Measure",   values: ["SLA Hours"] }));
            oVizStatus.addFeed(new FeedItem({ uid: "categoryAxis", type: "Dimension", values: ["Status"] }));

            oVizPriority.removeAllFeeds();
            oVizPriority.addFeed(new FeedItem({ uid: "valueAxis",    type: "Measure",   values: ["SLA Hours"] }));
            oVizPriority.addFeed(new FeedItem({ uid: "categoryAxis", type: "Dimension", values: ["Priority"] }));
        },

        onFilterChange: function () {
            this._applyFilters();
        },

        onResetFilters: function () {
            var oView = this.getView();
            oView.byId("filterStatus").setSelectedKey("");
            oView.byId("filterPriority").setSelectedKey("");
            oView.byId("filterPlant").setSelectedKey("");
            oView.byId("filterTechnician").setSelectedKey("");
            this._applyFilters();
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
