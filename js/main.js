/*global ActionMenu, Dirs, ActionPopup, ContentManagement, Utils, FilesAction, LANG_JSON_DATA, ListDirTypes, KeyboardModes, $, document, tau, GearModel, Input, VirtualList, ToastMessage*/
/*jshint unused: false*/
/*jslint laxbreak: true*/
/*jshint multistr: true */

var dirs = null;
var currentAction = null;
var contentManagement = null;
var showExtension = false;

/* Dialog results */
var pickOkClick = false;
var selectOkClick = false;

var gearModel = "";
var fileToOpen = null;
// Action after file selection
var afterSelectionAction = null;
var afterPickAction = null;

var lastPickAction = ListDirTypes.ALL;
var actionPopup = null;// new ActionPopup("pageDir");
var pickFilePageMenu = null;
var vList = null;

/* DblClick vars */
var DELAY = 500, clicks = 0, timer = null;
var toast = new ToastMessage('popupToastMsg', 'popupToast');

function getProcessingPage() {
	switch (Utils.getGearVersion(gearModel)) {
	case GearModel.S2:
		return "processingPage";
	default:
		return "smallProcessingPage";
	}
}

function toastMessage(msg) {
	toast.show(msg, 1000);
}

function getPageByListDirType(listDir) {
	if (!listDir && listDir !== ListDirTypes.ALL) {
		listDir = lastPickAction;
	}
	switch (listDir) {
	case ListDirTypes.ALL:
		return "pageDir";
	case ListDirTypes.PICKALL:
	case ListDirTypes.PICKDIRS:
	case ListDirTypes.PICKFILES:
		return "pickFilePage";
	case ListDirTypes.CHECKALL:
	case ListDirTypes.CHECKFILES:
	case ListDirTypes.CHECKDIRS:
		return "selectModePage";
	}
}

/**
 * Open main menu
 */
function menuClick() {
	tau.changePage("#menuPage");
}

function findOneContent(content) {
	var j = 0, curPage = null, haveFile = false, cur = null, img = null;

	for (j = 0; j < dirs.currentFiles.length; j++) {
		if (content.contentURI === dirs.currentFiles[j].toURI()
				&& content.thumbnailURIs && content.thumbnailURIs.length > 0) {
			haveFile = true;
			curPage = "#" + getPageByListDirType(lastPickAction);
			cur = $(curPage + " li").eq(j);

			cur.addClass("li-has-thumb-left");

			img = cur.find("img").eq(0);

			img.prop("src", content.thumbnailURIs[0]);
			img.show();
		}
	}

	if (!haveFile) {
		contentManagement.scanSilent(content.contentURI);
	}
}

function findContent(contents) {
	var i = 0;

	if (!contents) {
		return;
	}
	if (!contents.length) {
		findOneContent(contents);
		return;
	}
	for (i = 0; i < contents.length; i++) {
		findOneContent(contents[i]);
	}
}

function listDirs(dir, listType) {

	var processList = function(elListItem, newIndex) {

		var files = dirs.currentFiles;
		if (!files || files.length <= newIndex) {
			return;
		}

		var fileName = dirs.detectFileName(files[newIndex]), res;

		if (showExtension === false) {
			fileName = currentAction.getFileName(files[newIndex]);
		}
		$(elListItem).prop('id', newIndex);
		$(elListItem).addClass('files-li');

		// Filter content
		switch (listType) {
		case ListDirTypes.PICKALL:
		case ListDirTypes.PICKFILES:
		case ListDirTypes.PICKDIRS:
			$(elListItem).addClass('li-has-thumb-left');
			$(elListItem).on('click', function() {
				gotodir(elListItem);
			});
			$(elListItem)
					.html(
							fileName
									+ '<img src="images/Folder-icon.png" style="background-color: rgba(0,0,0,0);" class="folder-icon ui-li-thumb-left"/>');
			break;
		case ListDirTypes.CHECKALL:
		case ListDirTypes.CHECKDIRS:
		case ListDirTypes.CHECKFILES:
			if (!dirs.checkSysFolder(files[newIndex].toURI())) {
				if (files[newIndex].isDirectory) {
					$(elListItem).addClass('li-thumb-left');
					$(elListItem)
							.html(
									fileName
											+ '<img src="images/Folder-icon.png" style="background-color: rgba(0,0,0,0);" class="ui-li-thumb-left folder-icon"/>');
				} else {
					$(elListItem).addClass('li-has-multiline');
					$(elListItem)
							.html(
									fileName
											+ '<img hidden="hidden" style="background-color: rgba(0,0,0,0);" src=""/>');
				}
			}
			break;
		case ListDirTypes.ALL:
			$(elListItem).on('touchstart', function() {
				touchStart(newIndex);
			});
			$(elListItem).on('touchend', touchEnd);

			if (files[newIndex].isDirectory) {
				$(elListItem).addClass('li-has-thumb-left');
				$(elListItem).on('click', function() {
					touchClick(elListItem);
				});
				$(elListItem)
						.html(
								fileName
										+ '<img src="images/Folder-icon.png" style="background-color: rgba(0,0,0,0);" class="ui-li-thumb-left folder-icon"/>');
			} else {
				$(elListItem).on('click', function() {
					gotodir(elListItem);
				});
				$(elListItem).addClass('li-has-multiline');
				$(elListItem)
						.html(
								'<label>'
										+ fileName
										+ '<span class="ui-li-sub-text li-text-sub">'
										+ Utils
												.bytesToSize(files[newIndex].fileSize)
										+ '</span></label><img hidden="hidden" style="background-color: rgba(0,0,0,0);" src=""/>');
			}
			break;
		}
	};

	if (!listType) {
		listType = ListDirTypes.ALL;
	}

	// $("#blankPage").one("pageshow", function() {
	var pageName = getPageByListDirType(listType), pageHeader = $("#"
			+ pageName + " h2"), pageList = $("#" + pageName + " ul").eq(0), fileName = "";

	fileName = dirs.detectFileName(dir);
	if (fileName === dirs.HomeDir.path) {
		pageHeader.html(LANG_JSON_DATA.HOME);
		pageHeader.css({
			'background-image' : 'url(icon.png)'
		});
	} else {
		pageHeader.html(fileName);
		pageHeader.css({
			'background-image' : 'url(images/arrow_up.png)'
		});
	}

	// pageList.empty();

	if (vList) {
		vList.destroy();
		vList = null;
		pageList.empty();
	}

	dirs
			.getFiles(
					dir,
					listType,
					function(files) {

						var i = 0, listName = '#'
								+ $('#' + pageName + ' ul').prop('id'), list = $(listName);
						if (files.length > 0) {
							vList = new VirtualList('#' + pageName, listName,
									files.length, processList);
						}

						if (vList !== null) {
							vList.create();
						}
						lastPickAction = listType;

						if (pageName === "pickFilePage"
								&& Utils.getActivePage() !== "pickFilePage") {
							tau.changePage("#pickFilePage", {
								transition : 'none'
							});
						}
						if (pageName === "pageDir") {
							tau.changePage("#pageDir", {
								transition : 'none'
							});
						}
						if (pageName === "selectModePage"
								&& Utils.getActivePage() !== "selectModePage") {
							tau.changePage("#selectModePage", {
								transition : 'none'
							});
						}

					});
}

/**
 * File operation completed successfully 
 */
function operationComplete(message, filesLeft) {
	if (filesLeft === 0) {
		listDirs(dirs.currentDir, ListDirTypes.ALL);
		toastMessage(message);
	}
}

/**
 * File operation completed with error
 */
function operationError(message) {
	/*
	 * if (Utils.getActivePage() === "pageDir") { refreshDir(); }
	 */
	toastMessage(message);
}

function cancelPickClick() {

	pickFilePageMenu.close(false);

	$("#pickFilesOk").off();
	currentAction.clearSource();
	listDirs(dirs.currentDir, ListDirTypes.ALL);
}

function deleteFiles() {
	$("#selectModeButtonOk").one(
			"click",
			function() {
				var i = 0, checked = $("#selectModePage .select");

				if (checked.length === 0) {
					listDirs(dirs.currentDir, ListDirTypes.ALL);
					return;
				}

				if (!confirm(LANG_JSON_DATA.DELETE_QUESTION + checked.length
						+ LANG_JSON_DATA.FILES_QUESTION)) {
					listDirs(dirs.currentDir, ListDirTypes.ALL);
					return;
				}
				for (i = 0; i < checked.length; i++) {
					currentAction.addSource(dirs.currentFiles[checked.eq(i)
							.prop("id")], dirs.currentDir);
				}

				currentAction.deleteFiles();
			});
	listDirs(dirs.currentDir, ListDirTypes.CHECKALL);

}

function shareContextMenuClick() {
	actionPopup.close(true, function() {

		var appControl = new tizen.ApplicationControl(
				"http://tizen.org/appcontrol/operation/share", fileToOpen
						.toURI(), Utils.OTHER_MIME, null, null);
		tizen.application.launchAppControl(appControl, null, null, function() {
			toastMessage(LANG_JSON_DATA.OPEN_APP_NOT_FOUND);
		});
	});
}

function shareFiles() {
	$("#selectModeButtonOk")
			.one(
					"click",
					function() {
						try {
							var i = 0, checked = $("#selectModePage .select"), files = [], appControl = null, data = [];

							if (checked.length === 0) {
								listDirs(dirs.currentDir, ListDirTypes.ALL);
								return;
							}

							for (i = 0; i < checked.length; i++) {
								files.push(dirs.currentFiles[checked.eq(i)
										.prop("id")].toURI());
							}

							if (files.length === 1) {
								appControl = new tizen.ApplicationControl(
										"http://tizen.org/appcontrol/operation/share",
										files[0], Utils.OTHER_MIME, null, null);
								tizen.application
										.launchAppControl(
												appControl,
												null,
												null,
												function() {
													toastMessage(LANG_JSON_DATA.OPEN_APP_NOT_FOUND);
												});
							} else {
								for (i = 0; i < files.length; i++) {
									data
											.push(new tizen.ApplicationControlData(
													"http://tizen.org/appcontrol/data/path",
													[ files[i] ]));
								}
								appControl = new tizen.ApplicationControl(
										"http://tizen.org/appcontrol/operation/multi_share",
										null,
										Utils.OTHER_MIME,
										null,
										[ new tizen.ApplicationControlData(
												"http://tizen.org/appcontrol/data/path",
												files) ]);
								tizen.application
										.launchAppControl(
												appControl,
												null,
												null,
												function() {
													toastMessage(LANG_JSON_DATA.OPEN_APP_NOT_FOUND);
												});
							}
						} finally {
							listDirs(dirs.currentDir, ListDirTypes.ALL);
						}
					});

	listDirs(dirs.currentDir, ListDirTypes.CHECKFILES);
}

function pickFilesOkClick() {
	$("#" + getProcessingPage() + " h2").html(LANG_JSON_DATA.COPYING);
	tau.changePage("#" + getProcessingPage());
	// currentAction.copy(filesTotal[checked[0].id]);
	setTimeout(function() {
		// currentAction.copy(dirs.currentFiles[checked[0].id]);
		currentAction.copy(dirs.currentDir);
	}, 1000);
}

function copyFiles() {
	$("#selectModeButtonOk").one(
			"click",
			function() {
				var i = 0, checked = $("#selectModePage .select");

				if (checked.length === 0) {
					listDirs(dirs.currentDir, ListDirTypes.ALL);
					return;
				}
				for (i = 0; i < checked.length; i++) {
					currentAction.addSource(dirs.currentFiles[checked.eq(i)
							.prop("id")], dirs.parentDir);
				}

				$("#pickFilesOk").one("click", pickFilesOkClick);

				listDirs(dirs.currentDir, ListDirTypes.PICKDIRS);
			});
	listDirs(dirs.currentDir, ListDirTypes.CHECKALL);
}

function moveFiles() {

	$("#selectModeButtonOk").one(
			"click",
			function() {
				var i = 0, checked = $("#selectModePage .select");

				if (checked.length === 0) {
					listDirs(dirs.currentDir, ListDirTypes.ALL);
					return;
				}
				for (i = 0; i < checked.length; i++) {
					currentAction.addSource(dirs.currentFiles[checked.eq(i)
							.prop("id")], dirs.parentDir);
				}

				$("#pickFilesOk").one(
						"click",
						function() {
							$("#" + getProcessingPage() + " h2").html(
									LANG_JSON_DATA.MOVING);
							tau.changePage("#" + getProcessingPage());
							setTimeout(function() {
								currentAction.move(dirs.currentDir);
							}, 1000);
						});

				listDirs(dirs.currentDir, ListDirTypes.PICKDIRS);
			});
	listDirs(dirs.currentDir, ListDirTypes.CHECKALL);
}

function refreshFiles() {
	// dirs.addDirToScan(dirs.currentDir);
	listDirs(dirs.currentDir, ListDirTypes.ALL);
	// tau.changePage("#pageDir");
}

function changeSortBy() {
	tau.changePage("#sortByPage");
}

/**
 * Change sort order button
 */
function changeSortOrder() {
	tau.changePage("#sortOrderPage");
}

/**
 * Sorting order changed
 */
function sortOrderChanged() {
	var i = 0, checked = $("#sortOrderPage input");

	for (i = 0; i < checked.length; i++) {
		if (checked[i].checked) {
			if (dirs.sortOrder !== i) {
				dirs.sortOrder = i;
				break;
			}
		}
	}
}

/**
 * Sorting type changed
 */
function sortByChanged() {
	var i = 0, checked = $("#sortByPage input");

	for (i = 0; i < checked.length; i++) {
		if (checked[i].checked) {
			if (dirs.sortBy !== i) {
				dirs.sortBy = i;
				break;
			}
		}
	}
}

/**
 * Folder creation menu
 */
function createFolderClick() {
	var input = new Input(gearModel);

	input.open("", LANG_JSON_DATA.ENTER_NAME, KeyboardModes.SINGLE_LINE,
			function(folderName) {

				folderName = folderName.trim();
				if (folderName === "") {
					toastMessage(LANG_JSON_DATA.EMPTY_FILE_NAME);
					return;
				}

				FilesAction.checkFileExists(dirs.currentDir.toURI() + "/"
						+ folderName, function() {
					toastMessage(LANG_JSON_DATA.DIR_ALREADY_EXISTS);
					return;
				}, function() {
					try {
						dirs.currentDir.createDirectory(folderName);
					} catch (e) {
						alert(e);
					}

					listDirs(dirs.currentDir, ListDirTypes.ALL);
				});
			}, function() {
				listDirs(dirs.currentDir, ListDirTypes.ALL);
			}, function(e) {
				if (e === "Please, install TypeGear from store. It's free.") {
					alert(LANG_JSON_DATA.NO_TYPEGEAR);
				} else {
					alert(e);
				}
			});
}

var fileExtension = "";

/**
 * Rename file
 */
function rename(file, newName, extension) {

	if (newName === "") {
		toastMessage(LANG_JSON_DATA.EMPTY_FILE_NAME);
		return;
	}

	try {
		currentAction.addSource(file, dirs.currentDir);
		if (!confirm(LANG_JSON_DATA.RENAME_FILE_QUESTION + file.name
				+ LANG_JSON_DATA.TO + newName + fileExtension + "?")) {
			listDirs(dirs.currentDir, ListDirTypes.ALL);
			return;
		}

		currentAction.rename(newName + extension);
		// refreshDir();
	} catch (er) {
		alert(er.message);
	}
}

/**
 * Rename context menu click
 */
function renameCommand() {

	var input = new Input(gearModel), fileName = currentAction
			.getFileName(fileToOpen);
	fileExtension = currentAction.getFileExtension(fileToOpen);

	input.open(fileName, LANG_JSON_DATA.ENTER_NEW_NAME,
			KeyboardModes.SINGLE_LINE, function(e) {
				rename(fileToOpen, e, fileExtension);
			}, function() {
				setTimeout(function() {
					listDirs(dirs.currentDir, ListDirTypes.ALL);
				}, 500);
			}, function(e) {
				if (e === "Please, install TypeGear from store. It's free.") {
					alert(LANG_JSON_DATA.NO_TYPEGEAR);
				} else {
					alert(e);
				}
			});
}

/**
 * Confirm rename for Gear S dialog
 */
function confirmRename() {
	rename(fileToOpen, $("#folderRenameText").val(), fileExtension);
}

function removeTimezone(time) {
	var index = time.indexOf(' ');
	if (index === -1) {
		return time;
	}
	return time.substring(0, index);
}

/**
 * Open file info click
 */
function openFileInfo() {

	// actionPopup.close(true, function(){

	$("#fileNameLabel").html(dirs.detectFileName(fileToOpen));
	$("#createdLabel").html(fileToOpen.created.toLocaleDateString());
	$("#createdSpanTime").html(
			removeTimezone(fileToOpen.created.toLocaleTimeString()));
	$("#modifiedLabel").html(fileToOpen.modified.toLocaleDateString());
	$("#modifiedSpanTime").html(
			removeTimezone(fileToOpen.modified.toLocaleTimeString()));

	Dirs.calculateDirSize(fileToOpen, function(size) {
		$("#fileSizeLabel").html(Utils.bytesToSize(size));
	});

	document.getElementById("isReadonlyCheck").checked = fileToOpen.readOnly;
	tau.changePage("#fileInfoPage");
	// });
}

function preventDblClick(a) {
	a.preventDefault();
}

function fileNameClick() {
	toastMessage(fileToOpen.name);
}

function openFile() {
	// tau.closePopup($("#listPopup"));

	var appControl = new tizen.ApplicationControl(
			"http://tizen.org/appcontrol/operation/view", fileToOpen.toURI()
					.substring(7), Utils.getMime(fileToOpen.name), null, null);

	tizen.application.launchAppControl(appControl, null, null, function(e) {
		if (e.name === "NotFoundError") {
			toastMessage(LANG_JSON_DATA.OPEN_APP_NOT_FOUND + fileToOpen.name);
		} else {
			alert(e);
		}
	}, null);

}

function gotodir(a) {
	if (dirs.currentFiles[parseInt(a.id, 0)].isFile) {
		fileToOpen = dirs.currentFiles[parseInt(a.id, 0)];
		openFile();
		// tau.openPopup($("#listPopup"));
		// $("#fileNamePopupHeader").html(dirs.currentFiles[a.id].name);
		fileToOpen = dirs.currentFiles[parseInt(a.id, 0)];
	} else {
		listDirs(dirs.currentFiles[parseInt(a.id, 0)], lastPickAction);
	}
}

var releaseTimer = null;
var longTap = false;

/**
 * Taphold element list to open context menu
 */
function taphold(id) {
	fileToOpen = dirs.currentFiles[id];
	$("#actionPopupHeader").html(dirs.detectFileName(fileToOpen));
	actionPopup.show(dirs.checkSysFolder(fileToOpen.toURI()),
			fileToOpen.isDirectory);
}

function touchClick(sender) {
	clearTimeout(releaseTimer);
	releaseTimer = null;
	if (longTap === false) {
		gotodir(sender);
	}
	longTap = false;
}

function touchStart(id) {
	if (!releaseTimer) {
		releaseTimer = setTimeout(function() {
			longTap = true;
			touchEnd();
			taphold(id);
		}, 1000);
	}
}

function touchEnd() {
	clearTimeout(releaseTimer);
	releaseTimer = null;
}

function gotodirdblclick(a) {

	clicks++; // count clicks

	if (clicks === 1) {
		timer = setTimeout(function() {

			// perform single-click action
			clicks = 0; // after action performed, reset counter

		}, DELAY);

	} else {

		clearTimeout(timer); // prevent single-click action
		// perform double-click action
		gotodir(a);
		clicks = 0; // after action performed, reset counter
	}
}

/**
 * Check box show hidden files first
 */
function showDotFilesClick() {
	dirs.showDotFiles = document.getElementById("showDotFiles").checked;
}

/**
 * Check box show file extension
 */
function showExtensionClick() {
	showExtension = document.getElementById("showExtension").checked;

	try {
		localStorage.setItem("showExtension", showExtension);
	} catch (e) {
		alert(e);
	}
}

// ------------------------------------------------------------------------------
// ContextMenu
// ------------------------------------------------------------------------------
/**
 * File/folder info
 */
function infoContextMenuClick() {
	actionPopup.close(true, function() {
		openFileInfo();
	});
}

/**
 * Open menu for folder pick up
 */
function openPickDirsPopup() {
	actionPopup.close(true, function() {

		setTimeout(function() {
			// tau.openPopup("#copyToPopup");
			listDirs(dirs.currentDir, ListDirTypes.PICKDIRS);
		}, 500);
	});
}

/**
 * Copy file/folder
 */
function copyContextMenuClick() {
	actionPopup.close(true, function() {
		currentAction.addSource(fileToOpen, dirs.currentDir);
		$("#pickFilesOk").one("click", function() {
			currentAction.copy(dirs.currentDir);
		});
		listDirs(dirs.currentDir, ListDirTypes.PICKDIRS);
	});
}

/**
 * Move file/folder
 */ 
function moveContextMenuClick() {
	actionPopup.close(true, function() {
		currentAction.addSource(fileToOpen, dirs.currentDir);
		$("#pickFilesOk").one("click", function() {
			currentAction.move(dirs.currentDir);
		});
		listDirs(dirs.currentDir, ListDirTypes.PICKDIRS);
	});
}

/**
 * Rename file/folder
 */
function renameContextMenuClick() {
	actionPopup.close(true, function() {
		renameCommand();
	});
}

/**
 * Delete file/folder
 */
function deleteContextMenuClick() {
	actionPopup.close(true, function() {

		if (!confirm(LANG_JSON_DATA.DELETE_QUESTION + fileToOpen.name + "?")) {
			return;
		}

		currentAction.addSource(fileToOpen, dirs.currentDir);
		currentAction.deleteFiles();
	});
}

// --------------------------------------------------------------------------------

function exitClick() {
	/*
	 * if (!confirm(LANG_JSON_DATA["EXIT_CONFIRM"])) { return; }
	 */
	tizen.application.getCurrentApplication().exit();
}

function showPickFilePageMenu() {
	pickFilePageMenu.show();
}

function translateUi() {
	// $("#loadText").html(LANG_JSON_DATA["LOADING_TEXT"]);
	$("#smallProcessingText").html(LANG_JSON_DATA.LOADING_TEXT);
	$("#processingText").html(LANG_JSON_DATA.LOADING_TEXT);
	$("#pickFilesOk").html(LANG_JSON_DATA.OK);
	$("#pickFilesCancel").html(LANG_JSON_DATA.CANCEL);
	$("#pickFilesCancelDrawer").attr("data-title", LANG_JSON_DATA.CANCEL);
	$("#selectFilesOk").html(LANG_JSON_DATA.OK);
	$("#selectFilesCancel").html(LANG_JSON_DATA.CANCEL);
	$("#createFolderHeader").html(LANG_JSON_DATA.CREATE_FOLDER_HEADER);
	$("#renameFilesHeader").html(LANG_JSON_DATA.RENAME_FILES_HEADER);
	$("#createFolderMenuItem").html(LANG_JSON_DATA.CREATE_FOLDER_MENU);
	$("#exitMenuItem").html(LANG_JSON_DATA.EXIT_MENU);
	$("#shareMenuItem").html(LANG_JSON_DATA.SHARE_MENU);
	$("#copyMenuItem").html(LANG_JSON_DATA.COPY_MENU);
	$("#moveMenuItem").html(LANG_JSON_DATA.MOVE_MENU);
	$("#renameMenuItem").html(LANG_JSON_DATA.RENAME_MENU);
	$("#removeMenuItem").html(LANG_JSON_DATA.REMOVE_MENU);
	$("#refreshMenuItem").html(LANG_JSON_DATA.REFRESH_MENU);
	$("#sortByMenu").html(
			$("#sortByMenu").html().replace("Sort by",
					LANG_JSON_DATA.ORDERBY_MENU));
	$("#sortOrderMenu").html(
			$("#sortOrderMenu").html().replace("Sort order",
					LANG_JSON_DATA.SORT_ORDER_MENU));
	$("#sortAsc")
			.html(
					$("#sortAsc").html().replace("Ascending",
							LANG_JSON_DATA.ORDER_ASC));
	$("#sortDesc").html(
			$("#sortDesc").html().replace("Descending",
					LANG_JSON_DATA.ORDER_DESC));
	$("#sortByName").prepend(LANG_JSON_DATA.ORDER_BY_NAME);
	$("#sortBySize").prepend(LANG_JSON_DATA.ORDER_BY_SIZE);
	$("#sortByCreated").prepend(LANG_JSON_DATA.ORDER_BY_CREATED);
	$("#sortByModified").prepend(LANG_JSON_DATA.ORDER_BY_MODIFIED);
	$("#sortByType").prepend(LANG_JSON_DATA.ORDER_BY_TYPE);
	$("#fileNameA").html(
			$("#fileNameA").html().replace("Name", LANG_JSON_DATA.FILE_NAME));
	$("#fileSizeA").html(
			$("#fileSizeA").html().replace("Size", LANG_JSON_DATA.FILE_SIZE));
	$("#fileCreatedA").html(
			$("#fileCreatedA").html().replace("Created",
					LANG_JSON_DATA.FILE_CREATED));
	$("#fileModifiedA").html(
			$("#fileModifiedA").html().replace("Modified",
					LANG_JSON_DATA.FILE_MODIFIED));
	$("#isReadOnlySpan").prepend(LANG_JSON_DATA.FILE_READONLY);

	$("#listPopup-cancel").html(LANG_JSON_DATA.CANCEL);
	$("#actionPopupCancelBtn").html(LANG_JSON_DATA.CANCEL);
	$("#menuPage h2").html(LANG_JSON_DATA.MENU);

	$("#showExtensionLabel").prepend(LANG_JSON_DATA.SHOW);
	$("#showExtensionSpan").html(LANG_JSON_DATA.FILE_EXTENSION);
	$("#showDotFilesLabel").prepend(LANG_JSON_DATA.SHOW);
	$("#showDotFilesSpan").html(LANG_JSON_DATA.DOT_FILES);
	$('#select-all').html(LANG_JSON_DATA.SELECT_ALL);
	$('#deselect-all').html(LANG_JSON_DATA.DESELECT_ALL);

	$('#fileInfoPage h2').html(LANG_JSON_DATA.INFORMATION);

	// $("#folderRenameText").attr("placeholder",
	// LANG_JSON_DATA["ENTER_NEW_NAME"]);
	// $("#folderNameText").attr("placeholder", LANG_JSON_DATA["ENTER_NAME"]);
	// $("#shareContextMenu").html(LANG_JSON_DATA["SHARE_MENU"]);

}

$(window)
		.on(
				'load',
				function() {

					try {
						translateUi();

						actionPopup = new ActionPopup('contextMenuPage',
								'contextMenu', [ {
									name : 'infoContextMenu',
									title : LANG_JSON_DATA.INFORMATION,
									image : 'images/info.png',
									onclick : infoContextMenuClick
								}, {
									name : 'copyContextMenu',
									title : LANG_JSON_DATA.COPY_CONTEXT_MENU,
									image : 'images/copy.png',
									onclick : copyContextMenuClick
								}, {
									name : 'moveContextMenu',
									title : LANG_JSON_DATA.MOVE_CONTEXT_MENU,
									image : 'images/move.png',
									onclick : moveContextMenuClick
								}, {
									name : 'shareContextMenu',
									title : LANG_JSON_DATA.SHARE_MENU,
									image : 'images/share.png',
									onclick : shareContextMenuClick
								}, {
									name : 'renameContextMenu',
									title : LANG_JSON_DATA.RENAME_MENU,
									image : 'images/rename.png',
									onclick : renameContextMenuClick
								}, {
									name : 'removeContextMenu',
									title : LANG_JSON_DATA.REMOVE_MENU,
									image : 'images/delete.png',
									onclick : deleteContextMenuClick
								} ]);
						pickFilePageMenu = new ActionMenu('pickFileMenuPage',
								'pickFilePageContextMenu', [
										{
											name : 'okMenuItem',
											title : LANG_JSON_DATA.OK,
											image : 'images/check.png',
											onclick : function() {
												pickFilePageMenu.close(true,
														pickOkClick);
											}
										},
										{
											name : 'cancelMenuItem',
											title : LANG_JSON_DATA.CANCEL,
											image : 'images/delete_1.png',
											onclick : function() {
												pickFilePageMenu.close(true,
														cancelPickClick);
											}
										} ]);

						showExtension = localStorage.getItem("showExtension") === "true";
						if (showExtension === null) {
							showExtension = false;
						}

						document.getElementById("showExtension").checked = showExtension;

						if (tau.support.shape.circle) {
							$("#pickFilesOk").css("width", "100%");
						} else {
							$("#pickFilePage header")
									.removeClass("ui-has-more");
							$("#pickFilePage header button").remove();
						}

						document
								.addEventListener(
										'tizenhwkey',
										function(e) {
											if (e.keyName === "back") {

												if (Input.isInputPage()) {
													return;
												}

												if (actionPopup.isOpened === true) {
													actionPopup.close();
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													return;
												}
												if (pickFilePageMenu.isOpened === true) {
													pickFilePageMenu.close();
													return;
												}

												switch (Utils.getActivePage()) {
												case "smallProcessingPage":
												case "processingPage":
												case "loadPage":
													tizen.application
															.getCurrentApplication()
															.exit();
													break;
												case "menuPage":
													tau.changePage("#pageDir");
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													break;
												case "textViewerPage":
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													break;
												case "sortByPage":
													tau.changePage("#menuPage");
													break;
												case "sortOrderPage":
													tau.changePage("#menuPage");
													break;
												case "pickFilePage":
													if (dirs.parentDir !== null) {
														listDirs(
																dirs.parentDir,
																lastPickAction);
													}
													break;
												case "renamePage":
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													break;
												case "selectModePage":
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													break;
												case "fileInfoPage":
													listDirs(dirs.currentDir,
															ListDirTypes.ALL);
													break;
												default:
													if (!dirs.parentDir) {
														tizen.application
																.getCurrentApplication()
																.exit();
													} else {
														listDirs(
																dirs.parentDir,
																ListDirTypes.ALL);
													}
													break;
												}
											}
										});

						tizen.systeminfo
								.getPropertyValue(
										"BUILD",
										function(res) {
											gearModel = res.model;

											contentManagement = new ContentManagement(
													findContent);

											try {
												dirs = new Dirs(
														function(dir) {
															document
																	.getElementById("showDotFiles").checked = dirs.showDotFiles;
															listDirs(
																	dir,
																	ListDirTypes.ALL);
														}, contentManagement,
														gearModel);
											} catch (e) {
												alert("Err here " + e);
											}

											var i = 0, checked = $("#sortByPage input");
											for (i = 0; i < checked.length; i++) {
												if (i === dirs.sortBy) {
													checked[i].checked = true;
													break;
												}
											}

											checked = $("#sortOrderPage input");
											for (i = 0; i < checked.length; i++) {
												if (i === dirs.sortOrder) {
													checked[i].checked = true;
													break;
												}
											}

											currentAction = new FilesAction(
													dirs, contentManagement,
													operationComplete,
													operationError,
													toastMessage);
										});
						if (Object.freeze) {
							Object.freeze(ListDirTypes);
						}

						document.getElementById("selectModePage")
								.addEventListener("pagehide", function() {
									$("#selectModeButtonOk").off();
								});

						document.getElementById("sortOrderPage")
								.addEventListener("pagehide", sortOrderChanged);

						document.getElementById("sortByPage").addEventListener(
								"pagehide", sortByChanged);

						document.getElementById("menuPage").addEventListener(
								"pageshow",
								function() {
									$("#sortingByValue").html(
											$("#sortByPage input:checked")
													.parent().text());
									$("#sortingOrderValue").html(
											$("#sortOrderPage input:checked")
													.parent().text());
								});

					} catch (e) {
						alert(e);
					}
				});