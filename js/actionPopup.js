/*global ActionMenu*/

function ActionPopup(page, menuName, menuItems) {
	ActionMenu.call(this, page, menuName, menuItems);
}


ActionPopup.prototype = Object.create(ActionMenu.prototype);
ActionPopup.prototype.constructor = ActionPopup;


ActionPopup.prototype.show = function(sysFolder, isDirectory) {

	if (sysFolder === true) {
		ActionMenu.prototype.hideMenuItem.call(this, 'copyContextMenu');
		ActionMenu.prototype.hideMenuItem.call(this, 'moveContextMenu');
		ActionMenu.prototype.hideMenuItem.call(this, 'renameContextMenu');
		ActionMenu.prototype.hideMenuItem.call(this, 'removeContextMenu');
	} else {
		ActionMenu.prototype.showMenuItem.call(this, 'copyContextMenu');
		ActionMenu.prototype.showMenuItem.call(this, 'moveContextMenu');
		ActionMenu.prototype.showMenuItem.call(this, 'renameContextMenu');
		ActionMenu.prototype.showMenuItem.call(this, 'removeContextMenu');
	}

	if (isDirectory === true) {
		ActionMenu.prototype.hideMenuItem.call(this, 'shareContextMenu');
	} else {
		ActionMenu.prototype.showMenuItem.call(this, 'shareContextMenu');
	}
	ActionMenu.prototype.show.call(this);
};
