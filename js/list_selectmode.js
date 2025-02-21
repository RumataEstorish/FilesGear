/*global tau */
/*jslint unparam: true */
(function() {
	var page = document.getElementById("selectModePage"),
		listview = document.querySelector('#selectModePage .ui-listview'),
		selectWrapper = document.querySelector(".select-mode"),
		selectBtn = document.getElementById("select-btn"),
		selectBtnText =  document.getElementById("select-btn-text"),
		selectAll = document.getElementById("select-all"),
		deselectAll = document.getElementById("deselect-all"),
		//handler = document.getElementById("handler"),
		selector = page.querySelector("#selector"),
		selectorComponent,
		selectCount,
		i,
		addFunction,
		fnSelectAll,
		fnDeselectAll,
		fnPopup,
		fnPopupClose,
		fnBackKey;

	function textRefresh() {
		selectBtnText.innerHTML =
			selectCount < 10 ? "0" + selectCount : selectCount;
	}

	function modeShow() {
		selectWrapper.classList.remove("open");
		//handler.style.display = "block";
		selectWrapper.classList.add("show-btn");
		textRefresh();
	}

	function modeHide() {
		selectWrapper.classList.remove("open");
		//handler.style.display = "none";
		selectWrapper.classList.remove("show-btn");
		selectCount = 0;
	}

	addFunction = function(event){
		var target = event.target;
		if ( !target.classList.contains("select")) {
			target.classList.add("select");
			selectCount++;
			modeShow();
		} else {
			target.classList.remove("select");
			selectCount--;
			if (selectCount <= 0) {
				modeHide();
			} else {
				textRefresh();
			}
		}
	};

	fnSelectAll = function(){
		var list = listview.getElementsByTagName("li"),	listLength = list.length;
		for (i = 0; i < listLength; i++) {
			list[i].classList.add("select");
		}
		selectCount = listLength;
		modeShow();
	};

	fnDeselectAll = function(){
		var list = listview.getElementsByTagName("li"),	listLength = list.length;
		for (i = 0; i < listLength; i++) {
			list[i].classList.remove("select");
		}
		modeHide();
	};

	fnPopup = function() {
		selectWrapper.classList.add("open");
		event.preventDefault();
		event.stopPropagation();
	};

	fnPopupClose = function() {
		selectWrapper.classList.remove("open");
	};

	fnBackKey = function() {
		var classList = selectWrapper.classList;
		if( event.keyName === "back" && classList.contains("show-btn")) {
			if (classList.contains("open")) {
				classList.remove("open");
			} else {
				fnDeselectAll();
			}
			event.preventDefault();
			event.stopPropagation();
		}
	};

	page.addEventListener("pageshow", function() {
		listview.addEventListener('click', addFunction, false);
		selectAll.addEventListener("click", fnSelectAll, false);
		deselectAll.addEventListener("click", fnDeselectAll, false);
		selectBtn.addEventListener("click", fnPopup, false);
		selectWrapper.addEventListener("click", fnPopupClose, false);
		modeHide();
	}, false);

	page.addEventListener("pagehide", function() {
		listview.removeEventListener('click', addFunction, false);
		selectAll.removeEventListener("click", fnSelectAll, false);
		deselectAll.removeEventListener("click", fnDeselectAll, false);
		document.removeEventListener('tizenhwkey', fnBackKey);
		modeHide();
	}, false);

	page.addEventListener( "pagebeforeshow", function() {
	
		selectorComponent = tau.widget.Selector(selector);
		if (selectorComponent){
			selectorComponent.disable();
		}
		document.addEventListener('tizenhwkey', fnBackKey);
	});

}());