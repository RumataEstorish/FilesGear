/*global $, tau*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

/**
 * VirtualList wrapper
 * 
 * @param pageName -
 *            name of page with list
 * @param listName -
 *            name of virtual list
 * @param dataLength -
 *            length of data array
 * @param procFunc -
 *            function(elListItem, newIndex)
 * 
 * v2.0.0 allow dynamically change lists on one page.
 * v1.0.1 pageName/listName allows # at start added create and destroy functions for forcing needs
 */
function VirtualList(pageName, listName, dataLength, procFunc) {
	var page = $(pageName[0] === '#' ? pageName : '#' + pageName), list = document.getElementById(listName[0] === '#' ? listName.substring(1) : listName), vlist = null, self = this, scroll = function(e) {
		var l = $(self.list).parent().parent(), scrollPosition = 0;

		l.finish();

		if (e.detail.direction === 'CW') {
			scrollPosition = l.scrollTop() + 75;
		} else if (e.detail.direction === 'CCW') {
			scrollPosition = l.scrollTop() - 75;
		}
		l.finish().animate({
			scrollTop : scrollPosition
		}, 200, function() {

		});
	},
	create = function() {
		var list = $(self.listName), i = 0, item = null;
		
		/*if (self.dataLength <= 5 && self.dataLength > 0){
			list.removeClass('ui-virtuallistview');
			for (i = 0; i<self.dataLength; i++){
				item = $('<li></li>');
				self.procFunc(item, i);
				list.append(item);
			}
		}*/
		
			list.empty();
			
			self.vList = tau.widget.VirtualListview(self.list, {
				dataLength : self.dataLength,
				bufferSize : 40,
				scrollElement : 'ui-scroller'
			});
			list.addClass('ui-virtuallistview');
			
			self.vList.setListItemUpdater(self.procFunc);
			self.vList.draw();
			
			if (!tau.support.shape.circle){
				list.css('height', $(pageName + ' .ui-content').height() + 1);
			}
			$(self.list).scrollTop(0);
			$(self.list).parent().scrollTop(0);
			$(self.list).parent().parent().scrollTop(0);
			$(document).on('rotarydetent', scroll);

	}, destroy = function() {
		self.page.off('pagebeforeshow', create);
		self.page.off('pagehide', destroy);
		//$(listName[0] === '#' ? listName : '#' + listName).removeClass('ui-virtual-list-container');
		//$(listName[0] === '#' ? listName : '#' + listName).empty();

		if (self.vList) {
			try {
				self.vList.setListItemUpdater(null);
				self.vList.destroy();
			} catch (ignore) {
			}
			self.vList = null;
		}
		$(document).off('rotarydetent', scroll);
		var l = '', ll = $(self.listName);
		ll.removeClass('ui-virtual-list-container');
		ll.remove();
		l = '<ul class="' + ll.attr('class') + '" id="' + ll.prop('id') + '""></ul>';
		
		self.page.find('.ui-virtual-list-spacer').remove();
		self.page.find('.ui-content').eq(0).append(l);
		
	};
	this.create = create;
	this.destroy = destroy;
	
	Object.defineProperty(this, 'listName', {
		get : function(){
			return listName[0] === '#' ? listName : '#' + listName; 
		}
	});
	
	Object.defineProperty(this, 'page', {
		get : function() {
			return page;
		},
	});

	Object.defineProperty(this, "list", {
		get : function() {
			return list;
		}
	});

	Object.defineProperty(this, 'vList', {
		get : function() {
			return vlist;
		},
		set : function(val) {
			vlist = val;
		}
	});

	Object.defineProperty(this, 'dataLength', {
		get : function() {
			return dataLength;
		}
	});

	Object.defineProperty(this, 'procFunc', {
		get : function() {
			return procFunc;
		}
	});

	page.on("pagebeforeshow", create);
	page.on("pagehide", destroy);	
}
