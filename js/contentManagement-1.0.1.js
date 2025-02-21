/**
 * Конструктор класса Content
 * 
 * @param foundContent
 *            обратный вызов, когда найдено содержимое для текущей папки
 * @returns {ContentManagement}
 */
function ContentManagement(foundContent) {
	var currentDir = null, listener = {
		oncontentadded : function() {
			//self.foundContent(content);
		},
		oncontentupdated : function() {
			//self.foundContent(content);
		}
	};

	this.scanFiles = [];
	this.foundContent = foundContent;

	tizen.content.setChangeListener(listener);

	this.__defineGetter__("currentDir", function() {
		return currentDir;
	});

	this.__defineSetter__("currentDir", function(val) {
		currentDir = val;
	});
}

/**
 * List folder's content
 */
ContentManagement.prototype.getContentDirs = function() {
	var self = this;

	try {
		// List dirs with content
		tizen.content.getDirectories(function(contentDirs) {
			var i = 0;

			if (!self.currentDir) {
				return;
			}
			
			for (i = 0; i < contentDirs.length; i++) {
				if (self.currentDir.toURI().indexOf(contentDirs[i].directoryURI) > -1) {
					tizen.content.find(self.foundContent, null, contentDirs[i].id, null, null, null, null);
				}
			}
		}, function(err) {
			alert(err);
		});

	} catch (e) {
		alert(e.message);
	}
};

var scanLength = 0;

/**
 * Refresh content database
 */
ContentManagement.prototype.scanContent = function() {
	try {
		var i = 0, self = this, f = null, onscancomplete = function() {
			scanLength--;
			if (scanLength === 0) {
				self.getContentDirs();
			}
		};
		scanLength = this.scanFiles.length;

		for (i = this.scanFiles.length - 1; i >= 0; i--) {
			f = this.scanFiles.pop();
			if (f.fullPath) {
				tizen.content.scanFile(f.toURI(), onscancomplete, null);
			} else {
				tizen.content.scanFile(f, onscancomplete, null);
			}
		}
	} catch (e) {
		alert(e);
	}
};

ContentManagement.prototype.scanSilent = function(filePath) {
	tizen.content.scanFile(filePath);
};

/**
 * Add files to Tizen's scan queue
 * 
 * @param file - file to scan
 * @param path - new path of file. Not required
 */
ContentManagement.prototype.addToScan = function(file, destinPath) {
	var i = 0, self = this;

	try {
		if (file.isDirectory) {
			file.listFiles(function(files) {
				for (i = 0; i < files.length; i++) {
					self.scanFiles.push(files[i].toURI());
					if (destinPath) {
						self.scanFiles.push(destinPath + "/" + files[i].name);
					}
					if (files[i].isDirectory) {
						self.addToScan(files[i], destinPath + "/" + files[i].name);
					}
				}
			}, null);
		} else {
			this.scanFiles.push(file);
			if (destinPath) {
				this.scanFiles.push(destinPath + "/" + file.name);
			}
		}
	} catch (e) {
		alert(e);
	}
};
