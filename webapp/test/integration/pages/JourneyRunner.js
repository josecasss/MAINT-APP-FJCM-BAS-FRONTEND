sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"maintnoti/maint/test/integration/pages/MaintNotificationList",
	"maintnoti/maint/test/integration/pages/MaintNotificationObjectPage",
	"maintnoti/maint/test/integration/pages/MaintItemObjectPage"
], function (JourneyRunner, MaintNotificationList, MaintNotificationObjectPage, MaintItemObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('maintnoti/maint') + '/test/flp.html#app-preview',
        pages: {
			onTheMaintNotificationList: MaintNotificationList,
			onTheMaintNotificationObjectPage: MaintNotificationObjectPage,
			onTheMaintItemObjectPage: MaintItemObjectPage
        },
        async: true
    });

    return runner;
});

