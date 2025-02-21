/*global tau, $*/

function ActionPopup(page) {
	this.page = page;
	this.copy = null;
	this.move = null;
	this.share = null;
	this.rename = null;
	this.remove = null;
	this.opened = false;
	this.selector = null;

	if (tau.support.shape.circle) {
		this.popup = "#moreoptionsPopupCircle";
	} else {
		this.popup = "#moreoptionsPopup";
	}
}

ActionPopup.prototype.show = function(sysFolder, isDirectory) {
	this.opened = true;
	if (sysFolder === true) {
		$("#copyContextMenu").parent().hide();
		$("#moveContextMenu").parent().hide();
		$("#renameContextMenu").parent().hide();
		$("#removeContextMenu").parent().hide();
		$("#shareContextMenu").parent().hide();

		this.copy = $("#copyContextMenuC");
		this.copy.remove();

		this.move = $("#moveContextMenuC");
		this.move.remove();
		this.rename = $("#renameContextMenuC");
		this.rename.remove();
		this.remove = $("#removeContextMenuC");
		this.remove.remove();
	} else {
		$("#copyContextMenu").parent().show();
		$("#moveContextMenu").parent().show();
		$("#renameContextMenu").parent().show();
		$("#removeContextMenu").parent().show();

		if (this.copy) {
			$("#selector").append(this.copy);
			$("#selector").append(this.move);
			$("#selector").append(this.rename);
			$("#selector").append(this.remove);
			this.copy = null;
			this.move = null;
			this.rename = null;
			this.remove = null;
		}
	}

	if (isDirectory === true) {
		$("#shareContextMenu").parent().hide();
		this.share = $("#shareContextMenuC");
		this.share.remove();
	} else {
		$("#shareContextMenu").parent().show();
		if (this.share) {
			$("#selector").append(this.share);
			this.share = null;
		}
	}

	if (tau.support.shape.circle) {
		var page = document.querySelector("#" + this.page), radius = window.innerHeight / 2 * 0.8, elSelector = page.querySelector("#selector");
		this.selector = tau.widget.Selector(elSelector, {
			itemRadius : radius
		});
	}
	tau.openPopup(this.popup);
};

ActionPopup.prototype.close = function() {
	this.opened = false;
	if (tau.support.shape.circle && this.selector) {
		this.selector.destroy();
		this.selector = null;
	}
	tau.closePopup(this.popup);
}