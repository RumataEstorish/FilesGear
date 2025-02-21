/*global tau */
(function(){
	var page = document.querySelector("#pickFilePage"),
		drawer = page.querySelector("#moreoptionsDrawer"),
		selector = page.querySelector("#selector"),
		helper;

	page.addEventListener( "pagebeforeshow", function() {
		if (tau.support.shape.circle) {
			helper = tau.helper.DrawerMoreStyle.create(drawer, {
				handler: ".drawer-handler"
			});
		}
	});

	page.addEventListener( "pagebehide", function() {
		if (tau.support.shape.circle) {
			helper.destroy();
		}
	});

	/*
	 * When user click the indicator of Selector, drawer will close.
	 */
	selector.addEventListener("click", function(event) {
		var target = event.target,
			drawerComponent = tau.widget.Drawer(drawer);

		if (tau.support.shape.circle) {
			// 'ui-selector-indicator' is default indicator class name of Selector component
			if (target.classList.contains("ui-selector-indicator")) {
				drawerComponent.close();
			}
		}
	});
}());
