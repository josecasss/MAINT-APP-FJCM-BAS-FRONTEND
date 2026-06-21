  sap.ui.define(["sap/ui/core/routing/HashChanger"], function(HashChanger) {
      "use strict";
      return {
          navigateToAnalytics: function() {
              HashChanger.getInstance().setHash("Analytics");
          }
      };
  });