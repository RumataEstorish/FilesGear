/*global Dirs, ContentManagement, LANG_JSON_DATA*/

function FileActionUnit(file, parent) {
	this.file = file;
	this.parent = parent;
}

/**
 * Files work
 * 
 * @param directories - only directories to access them
 * @param contMang - content manager
 * @param operationComplete - operation completed callback
 * @param operationError - operation error callback
 * @param onMessage - other messages event
 */
function FilesAction(directories, contMan, operationComplete, operationError, onMessage) {

	var dirs = directories, contentManagement = contMan;

	this.source = [];
	this.operationComplete = operationComplete;
	this.operationError = operationError;
	this.onMessage = onMessage;

	this.__defineGetter__("contentManagement", function() {
		return contentManagement;
	});

	this.__defineGetter__("dirs", function() {
		return dirs;
	});
}

/**
 * Get file extension 
 * @returns file extension or empty if folder
 */
FilesAction.prototype.getFileExtension = function(file) {
	if (!file.isDirectory) {
		return file.name.substr(file.name.lastIndexOf('.'));
	}
	return "";
};

/**
 * Get file name
 * @returns file name WITHOUT extension or folder name
 */
FilesAction.prototype.getFileName = function(file) {
	if (!file){
		return '';
	}
	if (!file.isDirectory) {
		return file.name.substr(0, file.name.lastIndexOf('.'));
	}
	return this.dirs.detectFileName(file);
};

/**
 * Add files to process queue
 * @param parent - parent directory
 */
FilesAction.prototype.addSource = function(src, parent) {
	if (parent) {
		this.source.push(new FileActionUnit(src, parent));
	} else {
		this.source.push(new FileActionUnit(src, this.dirs.HomeDir));
	}
};

/**
 * Clear files queue
 */
FilesAction.prototype.clearSource = function() {
	this.source = [];
};

/**
 * Operation error
 */
FilesAction.prototype.operationErrored = function(message) {
	this.contentManagement.scanContent();
	if (this.operationError) {
		this.operationError(message);
	}
};

/**
 * File operation completed
 */
FilesAction.prototype.operationCompleted = function(message) {
	if (this.source.length === 0) {
		// Update content database
		this.contentManagement.scanContent();
	}

	if (this.operationComplete) {
		this.operationComplete(message, this.source.length);
	}
};

FilesAction.prototype.checkIOConditions = function(destin, onsuccess, onerror, checkSize) {
	var i = 0, file = null, totalSize = 0, checkedFiles = 0;

	if (!onsuccess || !onerror || !destin) {
		return;
	}

	for (i = 0; i < this.source.length; i++) {
		file = this.source[i];

		// Check if folder is system
		if (this.dirs.checkSysFolder(file.file.toURI())) {
			onerror(LANG_JSON_DATA["SYSFOLDER_ALERT"]);
			return;
		}

		// Check if destination folder same as current file's folder
		if (file.file.parent.toURI() === destin.toURI()) {
			onerror(LANG_JSON_DATA["SAME_FOLDER"]);
			return;
		}

		// Check if folder moves/copies inside itself
		if (file.file.isDirectory && destin.toURI().indexOf(file.file.toURI()) !== -1) {
			onerror(LANG_JSON_DATA["TARGET_FOLDER_IS_SAME"]);
			return;
		}

		// Check if enough free space
		Dirs.calculateDirSize(file.file, function(size) {
			totalSize += size;
		});
	}

	onsuccess();

};

/**
 * Check file exists
 */
FilesAction.checkFileExists = function(filePath, onexists, onnotexists) {
	try {
		tizen.filesystem.resolve(filePath, function() {
			if (onexists) {
				onexists();
			}
		}, function() {
			if (onnotexists) {
				onnotexists();
			}
		}, "r");
	} catch (e) {
		if (onexists) {
			onexists();
		}
	}
};

FilesAction.prototype.move = function(destin) {
	var i = 0, file = null, destinPath = "", self = this,

	// Move file without checking file already exist
	moveOne = function(file, destinPath, overwrite) {
		self.contentManagement.addToScan(file.file.toURI());

		file.parent.moveTo(file.file.toURI(), destinPath, !overwrite ? false : true, function() {
			tizen.filesystem.resolve(destinPath, function(dir) {
				self.dirs.addDirToScan(dir);
			});
			// self.contentManagement.addToScan(destinPath);
		}, function(err) {
			if (err.message === "IO error" && !overwrite) {
				if (!confirm(LANG_JSON_DATA["OVERWRITE_QUESTION"] + file.file.name)) {
					return;
				}
				moveOne(file, destinPath, true);
				return;
			}
			self.operationErrored(LANG_JSON_DATA["MOVE_ERROR"] + err);
		});
	};

	this.checkIOConditions(destin, function() {
		for (i = self.source.length - 1; i >= 0; i--) {
			try {
				file = self.source.pop();

				destinPath = destin.toURI() + "/" + file.file.name;

				moveOne(file, destinPath);
			} catch (e) {
				this.onMessage(e.message);
			}
		}

		self.operationCompleted(LANG_JSON_DATA["MOVE_FINISHED"]);

	}, function(err) {
		self.operationError(err);
		self.clearSource();
	}, false);
};

/**
 * Copy file or filder in queue
 */
FilesAction.prototype.copy = function(destin) {
	var i = 0, destinPath = "", file = null, self = this,

	copy = function(file, destinPath, overwrite) {
		self.contentManagement.addToScan(file.file.toURI());
		// self.contentManagement.addToScan(destinPath);

		file.parent.copyTo(file.file.toURI(), destinPath, !overwrite ? false : true, function() {
			tizen.filesystem.resolve(destinPath, function(dir) {
				self.dirs.addDirToScan(dir);
			});
		}, function(err) {
			if (err.message === "IO error" && !overwrite) {
				if (!confirm(LANG_JSON_DATA["OVERWRITE_QUESTION"] + file.file.name)) {
					return;
				}
				copy(file, destinPath, true);
				return;
			}
			self.operationErrored(LANG_JSON_DATA["COPY_ERROR"] + err);
		});

	};

	// Check copy conditions
	this.checkIOConditions(destin, function() {
		for (i = self.source.length - 1; i >= 0; i--) {
			try {
				file = self.source.pop();

				destinPath = destin.toURI() + "/" + file.file.name;

				copy(file, destinPath);
			} catch (e) {
				this.onMessage(e.message);
			}
		}
		self.operationCompleted(LANG_JSON_DATA["COPY_FINISHED"]);
	}, function(err) {
		self.clearSource();
		self.operationError(err);
	}, true);
};

/**
 * Rename file
 */
FilesAction.prototype.rename = function(newName) {

	var i = 0, file = null, destinPath = "", self = this, rename = function(file, destinPath) {
		self.contentManagement.addToScan(file.file.toURI());
		file.parent.moveTo(file.file.toURI(), destinPath, true, function() {
			self.contentManagement.addToScan(destinPath);
			self.operationCompleted(LANG_JSON_DATA["RENAME_FINISHED"]);
		}, function(err) {
			if (err.message !== "NotFoundError") {
				self.operationCompleted(LANG_JSON_DATA["RENAME_FINISHED"]);
			}
			// self.operationErrored(LANG_JSON_DATA["RENAME_ERROR"] + err);
		});
	};

	for (i = this.source.length - 1; i >= 0; i--) {
		try {
			file = this.source.pop();

			if (this.dirs.checkSysFolder(file.file.toURI())) {
				this.onMessage(LANG_JSON_DATA["SYSFOLDER_ALERT"]);
				continue;
			}

			destinPath = file.parent.toURI() + "/" + newName;

			FilesAction.checkFileExists(destinPath, function() {
				if (!confirm(LANG_JSON_DATA["OVERWRITE_QUESTION"] + file.file.name)) {
					return;
				}
				rename(file, destinPath);
			}, function() {
				rename(file, destinPath);
			});

		} catch (e) {
			// this.onMessage(e.message);
		}
	}

};

/**
 * Delete files from disk, that were in queue
 */
FilesAction.prototype.deleteFiles = function() {
	var i = 0, filePath = "", file = null, self = this;

	try {
		for (i = this.source.length - 1; i >= 0; i--) {
			file = this.source[i];
			filePath = file.file.toURI();

			if (this.dirs.checkSysFolder(filePath)) {
				this.onMessage(LANG_JSON_DATA["SYSFOLDER_ALERT"]);
				continue;
			}

			this.contentManagement.addToScan(file.file);
			if (file.file.isFile) {
				file.parent.deleteFile(filePath, function() {
					self.source.pop();
					if (self.source.length === 0) {
						self.operationCompleted(LANG_JSON_DATA["DELETE_FINISHED"]);
					}
				}, function(err) {
					self.operationErrored(LANG_JSON_DATA["DELETE_ERROR"] + err);
				});
			}
			if (file.file.isDirectory) {
				file.parent.deleteDirectory(filePath, true, function() {
					self.source.pop();
					if (self.source.length === 0) {
						self.operationCompleted(LANG_JSON_DATA["DELETE_FINISHED"]);
					}
				}, function(err) {
					self.operationErrored(LANG_JSON_DATA["DELETE_ERROR"] + err);
				});
			}
		}
	} catch (e) {
		alert(e);
	}
};