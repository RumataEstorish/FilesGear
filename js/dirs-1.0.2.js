/*global ContentManagement, SortOrderEnum, ListDirTypes, SortByEnum, Utils, LANG_JSON_DATA, GearModel*/

/**
 * v1.0.2 camera folder support
 */
function Dirs(homeResolved, contMan, model) {

	var self = this, sortOrder = localStorage.getItem("sortOrder"), sortBy = localStorage.getItem("sortBy"), contentManagement = contMan, resErr = function(err) {
		alert(err);
	}, cameraPath = "file:///opt/usr/media/DCIM", imagePath = "", videoPath = "", audioPath = "", documentPath = "", downloadPath = "", ringtonesPath = "", homeDir = null, showDotFiles = localStorage
			.getItem("showDotFiles") === "true";

	if (Object.freeze) {
		Object.freeze(SortByEnum);
		Object.freeze(SortOrderEnum);
	}

	// Load sort order
	if (sortOrder === null) {
		sortOrder = SortOrderEnum.ASC;
	}
	sortOrder = parseInt(sortOrder, 0);

	// Load sort order type
	if (sortBy === null) {
		sortBy = SortByEnum.NAME;
	}

	if (contentManagement === null) {
		contentManagement = new ContentManagement();
	}

	this.model = model;
	this.currentDir = null;
	this.currentFiles = null;

	/**
	 * Show hidden files first
	 */
	this.__defineGetter__("showDotFiles", function() {
		return showDotFiles;
	});
	this.__defineSetter__("showDotFiles", function(val) {
		showDotFiles = val;
		localStorage.setItem("showDotFiles", val);
	});

	try {
		tizen.filesystem.resolve('camera', function(dir) {
			cameraPath = dir.toURI();
		}, null, "rw");
	} catch (ignore) {
	}

	tizen.filesystem.resolve('images', function(dir) {
		imagePath = dir.toURI();
	}, resErr, "rw");

	tizen.filesystem.resolve('videos', function(dir) {
		videoPath = dir.toURI();
	}, resErr, "rw");

	tizen.filesystem.resolve('music', function(dir) {
		audioPath = dir.toURI();
	}, resErr, "rw");

	tizen.filesystem.resolve('documents', function(dir) {
		documentPath = dir.toURI();
	}, resErr, "rw");

	tizen.filesystem.resolve('downloads', function(dir) {
		downloadPath = dir.toURI();
	}, resErr, "rw");

	tizen.filesystem.resolve('ringtones', function(dir) {
		ringtonesPath = dir.toURI();
	}, resErr, "r");

	/**
	 * Camera path
	 */
	this.__defineGetter__("CameraPath", function() {
		return cameraPath;
	});

	/**
	 * Content manager
	 */
	this.__defineGetter__("contentManagement", function() {
		return contentManagement;
	});

	/**
	 * Sort order
	 */
	this.__defineGetter__("sortOrder", function() {
		return sortOrder;
	});
	this.__defineSetter__("sortOrder", function(val) {
		sortOrder = val;
		localStorage.setItem("sortOrder", val);
	});

	/**
	 * Order type
	 */
	this.__defineGetter__("sortBy", function() {
		return sortBy;
	});
	this.__defineSetter__("sortBy", function(val) {
		sortBy = val;
		localStorage.setItem("sortBy", val);
	});

	/**
	 * Images path
	 */
	this.__defineGetter__("ImagePath", function() {
		return imagePath;
	});

	/**
	 * Videos path
	 */
	this.__defineGetter__("VideoPath", function() {
		return videoPath;
	});

	/**
	 * Audio path
	 */
	this.__defineGetter__("AudioPath", function() {
		return audioPath;
	});

	/**
	 * Documents path
	 */
	this.__defineGetter__("DocumentPath", function() {
		return documentPath;
	});

	/**
	 * Downloads path
	 */
	this.__defineGetter__("DownloadPath", function() {
		return downloadPath;
	});

	/**
	 * Ringtones path
	 */
	this.__defineGetter__("RingtonesPath", function() {
		return ringtonesPath;
	});

	/**
	 * Home directory
	 */
	this.__defineGetter__("HomeDir", function() {
		return homeDir;
	});

	this.__defineGetter__("parentDir", function() {
		if (this.currentDir.parent) {
			return self.currentDir.parent;
		}
		if (this.checkSysFolder(self.currentDir.toURI()) && self.currentDir !== self.HomeDir) {
			return this.HomeDir;
		}
		return null;
	});

	/**
	 * Home directory path
	 */
	this.__defineGetter__("HomePath", function() {
		return "file:///opt/usr/media";
	});

	tizen.filesystem.resolve(this.HomePath, function(dir) {
		homeDir = dir;
		if (homeResolved) {
			homeResolved(homeDir);
		}
	}, resErr, "rw");

}

/**
 * List files depending on listType
 * 
 * @param listType - type of files to retreive
 * @param onfiles - file receive callback
 */
Dirs.prototype.getFiles = function(dir, listType, onfiles) {
	var self = this,

	dynamicSort = function(property) {
		var sortOrder = 1;

		if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function(a, b) {
			var result = null, aprop = null, bprop = null;

			aprop = a[property];
			bprop = b[property];
			if (property === "name" && !aprop) {
				aprop = self.getSysDirName(a.toURI());
			}
			if (property === "name" && !bprop) {
				bprop = self.getSysDirName(b.toURI());
			}

			if (Utils.isString(aprop) && Utils.isString(bprop)) {
				result = (aprop.toLowerCase() < bprop.toLowerCase()) ? -1 : (aprop.toLowerCase() > bprop.toLowerCase()) ? 1 : 0;
			} else {
				result = (aprop < bprop) ? -1 : (aprop > bprop) ? 1 : 0;
			}

			return result * sortOrder;
		};
	},

	dynamicSortMultiple = function() {
		var props = arguments;

		return function(obj1, obj2) {
			var i = 0, result = 0, numberOfProperties = props.length;

			while (result === 0 && i < numberOfProperties) {
				result = dynamicSort(props[i])(obj1, obj2);
				i++;
			}
			return result;
		};
	},

	// Filter hidden files
	filterDotFile = function(file) {
		if (self.showDotFiles === true) {
			return true;
		}
		return file.name[0] !== '.';
	},
	// Filter only files
	filterFilesByFile = function(file) {
		if (!filterDotFile) {
			return false;
		}
		return file.isFile;
	},
	// Filter only directories
	filterFilesByDir = function(file) {
		// If folder is hidden, return false
		if (!filterDotFile(file)) {
			return false;
		}

		return file.isDirectory;
	};

	this.setCurrentDir(dir);

	this.currentDir.listFiles(function(files) {
		// Filter file type
		switch (listType) {
		case ListDirTypes.PICKFILES:
		case ListDirTypes.CHECKFILES:
			files = files.filter(filterFilesByFile);
			break;
		case ListDirTypes.PICKDIRS:
		case ListDirTypes.CHECKDIRS:
			files = files.filter(filterFilesByDir);
			break;
		}
		files = files.filter(filterDotFile);

		if (self.sortOrder === SortOrderEnum.ASC) {
			files = files.sort(dynamicSortMultiple(SortByEnum.properties[self.sortBy].name, SortByEnum.properties[SortByEnum.NAME].name));
		} else {
			files = files.sort(dynamicSortMultiple("-" + SortByEnum.properties[self.sortBy].name, "-" + SortByEnum.properties[SortByEnum.NAME].name));
		}

		self.setCurrentFiles(files);

		if (onfiles) {
			onfiles(files);
		}
	}, function(err) {
		if (self.currentDir.toURI() === self.HomePath) {
			alert(LANG_JSON_DATA.REBOOT_NEEDED);
			tizen.application.getCurrentApplication().exit();
			return;
		}
		alert(err);
	});
};

var totalSize = 0;
/**
 * Recursive dir size calculation
 */
Dirs.calculateDirSize = function(dir, onsize) {

	if (!onsize) {
		return;
	}
	if (dir.isFile) {
		onsize(dir.fileSize);
		return;
	}
	dir.listFiles(function(files) {
		var i = 0;
		for (i = 0; i < files.length; i++) {
			if (files[i].isDirectory) {
				Dirs.calculateDirSize(files[i], onsize);
				continue;
			}
			totalSize += files[i].fileSize;
		}
		onsize(totalSize);
	});
	totalSize = 0;
};

/**
 * Add files to scan queue
 */
Dirs.prototype.addDirToScan = function(dir) {
	var self = this;

	if (!dir) {
		return;
	}
	if (dir.isFile) {
		self.contentManagement.addToScan(dir.toURI());
		self.contentManagement.scanContent();
		return;
	}

	dir.listFiles(function(files) {
		var i = 0;
		for (i = 0; i < files.length; i++) {
			if (files[i].isDirectory) {
				self.addDirToScan(files[i]);
				continue;
			}
			self.contentManagement.addToScan(files[i].toURI());
		}
		self.contentManagement.scanContent();
	});
};

/**
 * Set current files list
 */
Dirs.prototype.setCurrentFiles = function(files) {
	this.currentFiles = files;
	this.contentManagement.getContentDirs();
};

/**
 * Set current directory
 */
Dirs.prototype.setCurrentDir = function(dir) {
	if (!dir) {
		this.currentDir = this.HomeDir;
	} else {
		this.currentDir = dir;
	}
	this.contentManagement.currentDir = dir;
};

/**
 * Detect file type. System folders don't have names, but we know their path
 * @returns file name
 */
Dirs.prototype.detectFileName = function(file) {
	if (!file) {
		return "";
	}

	var fileName = file.name;

	if (file.name === "") {
		fileName = this.getSysDirName(file.toURI());
		if (fileName === "") {
			fileName = file.path;
		}
		return fileName;

	}
	return fileName;
};

/**
 * Check folder is system
 * @returns {Boolean} - true if folder is system. False othewise
 */
Dirs.prototype.checkSysFolder = function(path) {
	return (path === this.CameraPath || path === this.ImagePath || path === this.VideoPath || path === this.AudioPath || path === this.DocumentPath || path === this.DownloadPath || path === this.HomePath);
};

/**
 * Get names of system folders by path
 * @returns display name
 */
Dirs.prototype.getSysDirName = function(path) {

	switch (path) {
	case this.ImagePath:
		return "Images";
	case this.DocumentPath:
		return "Documents";
	case this.AudioPath:
		if (Utils.getGearVersion(this.model) === GearModel.S2) {
			return "Music";
		}
		return "Sounds";
	case this.VideoPath:
		return "Videos";
	case this.DownloadPath:
		return "Downloads";
	case this.RingtonesPath:
		return "Ringtones";
	case this.CameraPath:
		return "DCIM";
	default:
		return "";
	}
};