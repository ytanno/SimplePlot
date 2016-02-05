//ref 	http://bl.ocks.org/phil-pedruco/9852362#index.html

////////////////////////////////////////////////////////////////////
//////Gloabl Value/////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

//user set
var g_AnimationSpeed = 50 //milliseconds


var g_renderer;
var g_width, g_height;
var g_camera;
var g_scene;
var g_scatterPlot;
var g_format; 
var g_unfiltered = []; // raw plot data
var g_plotData =[]; // codinate plot data
var g_plotDisplayIndex = 0; //now display plot number
var g_AnimateUpdateTime; //animation update time
var g_paused = false; 
var g_MouseDown = false;
var g_MouseX = 0, g_MouseY = 0;

function InitFileAction()
{
	//other value
	$("#uploadfrfile").change(function () {
		// Just process the 1st file selected.
		//console.log("start");
		g_unfiltered = [];

		if (this.files.length > 0) {
			var file = this.files[0];
			Papa.parse(file, {
				download: true,
				dynamicTyping: true,
				delimiter: " ",
				// worker: false,
				error: function (err, file, inputElem, reason) {
					console.log(reason);
				},
				complete: function (results) {
					// TODO: Add to the nvd3 graph. processFRFile(results.data);
					//console.log(results);

					results.data.forEach(function (entry) {
						//console.log(entry);
						//g_Cash.push(entry);
						var line = entry.join(",");
						var accX = entry[3];
						var accY = entry[4];
						var accZ = entry[5];
						var ts = String(entry[6]);
						g_unfiltered.push({ "x": +accX, "y": +accY, "z": +accZ });
						//console.log(ts);
						//$("#output").append(line).append("<br>");
					});
					PlotText();

				}
			});
		}
	});


}


/////////////////////////////////////////////////////////////////////
//Plot Control
/////////////////////////////////////////////////////////////////////

function InitPlot() {
	var elm = document.getElementById("plotForm");
	g_width = elm.clientWidth;
	g_height = elm.clientHeight;

	g_renderer = new THREE.WebGLRenderer({ antialias: true, canvas: elm });
	g_renderer.setSize(g_width, g_height);

	g_renderer.setClearColor(0xEEEEEE, 1.0);

	g_camera = new THREE.PerspectiveCamera(45, g_width / g_height, 1, 10000);
	g_camera.position.z = 200;
	g_camera.position.x = -100;
	g_camera.position.y = 100;

	g_scene = new THREE.Scene();
	g_scatterPlot = new THREE.Object3D();
	g_scene.add(g_scatterPlot);

	g_scatterPlot.rotation.y = 0;
	var g_unfiltered = [], g_lowPass = [], g_highPass = [];
	g_format = d3.format("+.3f");
}



function CreateTextCanvas(text, color, font, size) {
	size = size || 16;
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	var fontStr = (size + 'px ') + (font || 'Arial');
	ctx.font = fontStr;
	var w = ctx.measureText(text).width;
	var h = Math.ceil(size);
	canvas.width = w;
	canvas.height = h;
	ctx.font = fontStr;
	ctx.fillStyle = color || 'black';
	ctx.fillText(text, 0, Math.ceil(size * 0.8));
	return canvas;
}



function CreateText2d(text, color, font, size, segW, segH) {
	var canvas = CreateTextCanvas(text, color, font, size);
	var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
	var tex = new THREE.Texture(canvas);
	tex.needsUpdate = true;
	var planeMat = new THREE.MeshBasicMaterial({
		map: tex,
		color: 0xffffff,
		transparent: true
	});
	var mesh = new THREE.Mesh(plane, planeMat);
	mesh.scale.set(0.5, 0.5, 0.5);
	mesh.doubleSided = true;
	return mesh;
}

function v(x, y, z) {
	return new THREE.Vector3(x, y, z);
}

function DrawLine(p1, p2) {
	var lineMat = new THREE.LineBasicMaterial({
		color: 0x000000,
		lineWidth: 1
	});

	var lineGeo = new THREE.Geometry();
	lineGeo.vertices.push(p1);
	lineGeo.vertices.push(p2);

	var line = new THREE.Line(lineGeo, lineMat);
	line.type = THREE.Lines;
	g_scatterPlot.add(line);
}


function PlotText()
{
	g_AnimateUpdateTime = new Date().getTime();
	var xExent = d3.extent(g_unfiltered, function (d) { return d.x; });
	yExent = d3.extent(g_unfiltered, function (d) { return d.y; }),
	zExent = d3.extent(g_unfiltered, function (d) { return d.z; });

	var vpts =
	{
		xMax: xExent[1],
		xCen: (xExent[1] + xExent[0]) / 2,
		xMin: xExent[0],
		yMax: yExent[1],
		yCen: (yExent[1] + yExent[0]) / 2,
		yMin: yExent[0],
		zMax: zExent[1],
		zCen: (zExent[1] + zExent[0]) / 2,
		zMin: zExent[0]
	}


	var xScale = d3.scale.linear().domain(xExent).range([-50, 50]);
	var yScale = d3.scale.linear().domain(yExent).range([-50, 50]);
	var zScale = d3.scale.linear().domain(zExent).range([-50, 50]);


	//Set  Lattice
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)));
	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zCen)));
	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)));

	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)));

	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)));

	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)));

	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)));

	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)));

	DrawLine(v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)));
	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)));
	DrawLine(v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)));

	var titleX = CreateText2d('-X');
	titleX.position.x = xScale(vpts.xMin) - 12,
	titleX.position.y = 5;
	g_scatterPlot.add(titleX);

	var valueX = CreateText2d(g_format(xExent[0]));
	valueX.position.x = xScale(vpts.xMin) - 12,
	valueX.position.y = -5;
	g_scatterPlot.add(valueX);

	var titleX = CreateText2d('X');
	titleX.position.x = xScale(vpts.xMax) + 12;
	titleX.position.y = 5;
	g_scatterPlot.add(titleX);

	var valueX = CreateText2d(g_format(xExent[1]));
	valueX.position.x = xScale(vpts.xMax) + 12,
	valueX.position.y = -5;
	g_scatterPlot.add(valueX);

	var titleY = CreateText2d('-Y');
	titleY.position.y = yScale(vpts.yMin) - 5;
	g_scatterPlot.add(titleY);

	var valueY = CreateText2d(g_format(yExent[0]));
	valueY.position.y = yScale(vpts.yMin) - 15,
	g_scatterPlot.add(valueY);

	var titleY = CreateText2d('Y');
	titleY.position.y = yScale(vpts.yMax) + 15;
	g_scatterPlot.add(titleY);

	var valueY = CreateText2d(g_format(yExent[1]));
	valueY.position.y = yScale(vpts.yMax) + 5,
	g_scatterPlot.add(valueY);

	var titleZ = CreateText2d('-Z ' + g_format(zExent[0]));
	titleZ.position.z = zScale(vpts.zMin) + 2;
	g_scatterPlot.add(titleZ);

	var titleZ = CreateText2d('Z ' + g_format(zExent[1]));
	titleZ.position.z = zScale(vpts.zMax) + 2;
	g_scatterPlot.add(titleZ);

	var mat = new THREE.ParticleBasicMaterial({
		vertexColors: true,
		size: 10
	});

	var pointCount = g_unfiltered.length;
	
	for (var i = 0; i < pointCount; i++)
	{
		var x = xScale(g_unfiltered[i].x);
		var y = yScale(g_unfiltered[i].y);
		var z = zScale(g_unfiltered[i].z);
		var pointGeo = new THREE.Geometry();
		pointGeo.vertices.push(new THREE.Vector3(x, y, z));
		console.log(pointGeo.vertices);
		pointGeo.colors.push(new THREE.Color().setRGB(
		  Math.random(), // 0 - 1 
		  Math.random(),
		  Math.random()
		));
		g_plotData.push( new THREE.Points(pointGeo, mat));
	}

	
	//First Plot
	g_scatterPlot.add(g_plotData[g_plotDisplayIndex]);
	g_plotDisplayIndex++;
	g_renderer.render(g_scene, g_camera);
	

	////////////////////////////////////////////////
	//Define Mouse Action 
	///////////////////////////////////////////////
	window.onmousedown = function (ev) {
		g_MouseDown = true;
		g_MouseX = ev.clientX;
		g_MouseY = ev.clientY;
	};
	window.onmouseup = function () {
		g_MouseDown = false;
	};
	window.onmousemove = function (ev) {
		if (g_MouseDown) {
			var dx = ev.clientX - g_MouseX;
			var dy = ev.clientY - g_MouseY;
			g_scatterPlot.rotation.y += dx * 0.01;
			g_camera.position.y += dy;
			g_MouseX += dx;
			g_MouseY += dy;
			g_renderer.clear();
			g_camera.lookAt(g_scene.position);
			g_renderer.render(g_scene, g_camera);
		}
	}

	g_renderer.clear();
	g_camera.lookAt(g_scene.position);
	g_renderer.render(g_scene, g_camera);

	////////////////////////////////////////////////
	//Define Animation
	///////////////////////////////////////////////
	var animating = false;
	window.ondblclick = function () {
		animating = !animating;
	};

	function Animate(t) {
		if (!g_paused) {
			if (animating)
			{
				
				if (g_plotDisplayIndex >= g_plotData.length)
				{
					//remove all plot data
					for (var i = 0; i < g_plotData.length; i++)
						g_scatterPlot.remove(g_plotData[i]);
					g_plotDisplayIndex = 0;
				}
				var now = new Date().getTime();
				var elapsed = (now - g_AnimateUpdateTime);

				//update plot
				if (elapsed >= g_AnimationSpeed )
				{
					g_scatterPlot.add(g_plotData[g_plotDisplayIndex]);
					g_plotDisplayIndex++;
					g_AnimateUpdateTime = now;
				}
			}
			g_renderer.clear();
			g_camera.lookAt(g_scene.position);
			g_renderer.render(g_scene, g_camera);
		}
		window.requestAnimationFrame(Animate, g_renderer.domElement);
	};
	Animate();
	onmessage = function (ev) {
		g_paused = (ev.data == 'pause');
	};
}

