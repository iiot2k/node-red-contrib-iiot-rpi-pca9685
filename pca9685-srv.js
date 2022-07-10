/**
 * Copyright 2022 Ocean (iiot2k@gmail.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

"use strict";

module.exports = function(RED) {
	const syslib = require("./lib/syslib.js");
	const sysmodule = syslib.LoadModule("rpi_pca9685");

    RED.nodes.registerType("pca9685-srv", function(n) {
		var node = this;
		RED.nodes.createNode(node, n);

		node.devadr  = parseInt(n.devadr);
		node.channel = parseInt(n.channel);
		node.tlow  = n.tlow;
		node.thigh = n.thigh;
		node.pos = n.pos;
		node.digital = n.digital; 
		node.iserror = false;
		node.name = n.name || "servo @" + (0x40 + parseInt(node.devadr)).toString(16).toUpperCase() + "#" + node.channel;

		if (sysmodule === undefined)
			node.iserror = syslib.outError(node, "driver error", "driver not load, wrong os or not Raspi");
		else if (!sysmodule.initservo(node.devadr, node.digital))
			node.iserror = syslib.outError(node, "device used", "device used by other node or i2c not open");
		else if (!sysmodule.setservo(node.devadr, node.channel, node.pos, node.tlow, node.thigh))
			syslib.outError(node, "write error", "device not write, check i2c and device");
		else
			syslib.outText(node, node.pos);

		node.on("input", function (msg) {
			if (node.iserror)
				return;

			var val = Number(msg.payload);

			if (isNaN(val)) {
				syslib.outError(node, "not number", "msg.payload not number");
				return;
			}
			
			if (val < 0)
				val = 0;
			else if (val > 100)
				val = 100;
	
			if (!sysmodule.setservo(node.devadr, node.channel, val, node.tlow, node.thigh))
				syslib.outError(node, "write error", "device not write, check i2c and device");
			else
				syslib.outText(node, val);
		});

		node.on('close', function () {
			sysmodule.deinit(node.devadr);
		});
	});
}
