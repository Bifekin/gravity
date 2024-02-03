// sketch.js 文件中定义了一些全局变量和函数，其中 setup 和 draw 函数是 p5.js 提供的特殊函数，用于设置初始状态和在每一帧绘制画面。这两个函数的执行由 p5.js 引擎控制，而不是手动调用。

//定义对象
var sun; //不考虑自身运动的特殊“行星”
var planets = [] ;
var shoot; //发射器

//标记运行状态
var paused = false;//是否处于暂停运行状态
var shooting_mode = true;//是否处于可以鼠标发射模型

//定义鼠标选中对象
var selectingPlanet = null;//鼠标正在选中的行星
var selectingSun = null;//鼠标正在选中的太阳
var selectedObject = null;//上一个选中的对象（太阳或行星）或者当前选中的对象(如果存在)
var planteID  = {value:1}; //行星编号

//设置背景
let backgroundImage; //设置背景图片
let trailLayer; // 轨迹图层

//设置参数
var sunMass = 100; 
var planetMass = 1; //范围一般为1-1000
var Gravity = 1000;
var epoch = 500; //每次p5.js函数调用draw()函数时，进行引力计算并更新参数的次数
var dt = 0.1/epoch; //微分时间 和epoch对应，dt小==>误差小, epoch大，卡顿

//DOM
let checkbox;
let select;

//模型文件位置
modelName = "model_1.json";//保存的模型名称
loadjsonPath =  'model/fourStar.json';//加载的模型位置


function preload() {
	// 预加载背景图片
	backgroundImage = loadImage('./background.png');

	// 利用p5.js的函式"loadShader()"来从资料夹位置取得两个shader文件，并且compile
    haloShader = loadShader('./shader/vertexShader.vert', './shader/fragmentShader.frag');
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	sun = new Sun(windowWidth/2, windowHeight/2, sunMass);
	shoot = new Shooter();

	/* 创建一个图层用于绘制轨迹 */
	trailLayer = createGraphics(width, height);
	// 创建一个渲染图层对象用于光晕渲染
    haloLayer = createGraphics(windowWidth, windowHeight, WEBGL);

	/* 设置帧率:  frameRate(120); */

	/* ------------------DOM---------------- */

	/* 创建是否为鼠标射击模式 */
	checkbox = createCheckbox('shooting', shooting_mode);
	checkbox.style('color', '#000000');  // 设置文字颜色
	checkbox.style('background-color', '#ffffff');  // 设置背景颜色
  	checkbox.changed(updateCheckbox);
	checkbox.position(70, height - 30); 

	/* 创建 select 元素 */
	select = createSelect();
	select.position(40, 7);
	select.option('行星列表')
	select.changed(handleSelect);// 添加选择事件

	/* 重置行星为初速度，初始位置 */
	resetallButton = createButton('reset all');
	resetallButton.position(170, 7);
	resetallButton.mousePressed(resetAll);

	/* 更新行星初速度，初始位置 */
	updateInitallButton = createButton('update all');
	updateInitallButton.position(239, 7);
	updateInitallButton.mousePressed(updateInitAll);

	/* 读取和保存文件 */
	saveModelButton = createButton('save');
	saveModelButton.position(400, 7);
	saveModelButton.mousePressed(saveModel);
	loadModelButton = createButton('load');
	loadModelButton.position(447, 7);
	loadModelButton.mousePressed(LoadModel);

	/* -----------------DOM------------------ */
}

function draw() {
	/* 显示图层 */
	blendMode(BLEND);
	background(backgroundImage);//显示背景图层
	image(trailLayer, 0, 0);// 显示轨迹图层
	
	if(!paused) {
		//删除超出范围的行星
		var to_splice = [];
		var bound = 50000;
		for (var i = 0; i < planets.length ; i++) {
			if ((planets[i].pos.x > bound) ||
				(planets[i].pos.x < (0-bound)) ||
				(planets[i].pos.y > bound) ||
				(planets[i].pos.y < (0-bound))) {
				append(to_splice, i);
			}
		}
		for (var i = 0; i < to_splice.length ; i++) {
			//删除行星对应的select选项
			let options = select.elt.options;
			for (let j = 0; j < options.length; j++) {
				if (options[j].text == planets[to_splice[i]].ID) {
					options[j].remove();
					break; 
				}
			}
			//删除行星
			planets.splice(to_splice[i], 1);

		}

		/* 多次计算行星之间的引力并且更新状态 */
		for (var k = 0; k < epoch; k++){
			/* 计算行星之间的引力 */
			for (var i = 0; i < planets.length; i++) {
				for (var j = 0; j < planets.length; j++) {
					if(i != j) {
						planets[i].orbit(planets[j]);
					}
				}
				if(sun !== null) planets[i].orbit(sun);//计算太阳对这个行星的万有引力
			}
			/* 更新行星位置和速度状态 */
			for (var i = 0; i < planets.length; i++) {
				planets[i].update(dt);//更新行星位置和速度，重置加速度为0
				if(k===0) planets[i].draw(selectingPlanet, trailLayer);//绘制行星及其轨迹
			}
		}
	}else {
		// 显示 "Pause" 字样
        textSize(32);
        textAlign(CENTER, CENTER);
        fill(255);
        text("Paused...", width / 2, height/2 - 50);
		
		for (var i = 0; i < planets.length ; i++) {//绘制行星及其轨迹
			planets[i].draw(selectingPlanet, trailLayer);
		}
	}


	/* -------------渲染光晕---------------- */
	haloLayer.shader(haloShader);// 使用光晕着色器 每次渲染帧(frame)时套用Shader
	// 利用p5.js的rect()建立一个矩形，这个矩形将被shader拿來处理
	haloLayer.rect(0, 0, windowWidth, windowHeight);//不管设定多大，矩形都是整个画布大小
	// 传送参数給Shader
	haloShader.setUniform("u_resolution", [windowWidth, windowHeight]);//从左下角开始的矩形
	if(planets.length!==0){
		haloShader.setUniform('u_numPlanets', planets.length);
		// 传递行星数据给着色器
		for (let i = 0; i < planets.length; i++) {
			haloShader.setUniform(`u_planets[${i}].color`, [planets[i].R/255, planets[i].G/255, planets[i].B/255]);
			haloShader.setUniform(`u_planets[${i}].position`, [planets[i].pos.x/width * 2, 2 - planets[i].pos.y/height * 2]);
			haloShader.setUniform(`u_planets[${i}].radius`, planets[i].radius);
		}
	} 
	if(sun !== null){//太阳也用同样方式渲染
		haloShader.setUniform('u_numPlanets', planets.length + 1);
		haloShader.setUniform(`u_planets[${planets.length}].color`, [sun.R/255, sun.G/255, sun.B/255]);
		haloShader.setUniform(`u_planets[${planets.length}].position`, [sun.pos.x/width * 2, 2 - sun.pos.y/height * 2]);
		haloShader.setUniform(`u_planets[${planets.length}].radius`, sun.radius);

	}
	if(planets.length === 0 && sun === null) {
		haloShader.setUniform('u_numPlanets', 0);
	}
	haloLayer.resetShader();// 停止使用光晕着色器
	blendMode(ADD);
	image(haloLayer, 0, 0);

	/* 太阳存在则绘制太阳 */
	if(sun !== null) sun.draw(selectingSun);
	
	if(selectingPlanet === null && selectingSun === null){//选中状态禁用发射器
		let lt = planets.length;
		/* 更新发射器状态并且绘制发射器 */
		shoot.update(Gravity, sunMass, planetMass, planteID, planets, select, shooting_mode);
		shoot.draw();
		if(lt < planets.length) {
			selectedObject = planets[planets.length - 1];
			select.value(String(selectedObject.ID));
		}
	} 

	/* 显示选中的行星或者太阳的信息 */
	if (selectedObject !== null) {
		selectedObject.displayInfo();
	}

	// 在右上角显示鼠标坐标
	textAlign(RIGHT, TOP);
	textSize(16);
	fill(255); // 设置文本颜色为白色
	text('Mouse: ' + mouseX + ', ' + mouseY, width - 10, 10);

	// 在屏幕右上角显示帧率
	let currentFrameRate = frameRate();
	fill(255);
	textSize(16);
	textAlign(RIGHT, TOP);
	text("Frame Rate: " + currentFrameRate.toFixed(2), width - 10, 30);
}

function keyPressed() {
	if (key === " ") {
	  paused = !paused;//暂停或者停止暂停
	}
}

function mouseClicked() {
	/* 用鼠标选中行星或者太阳 */
	selectingPlanet = null;
	selectingSun = null;
	for (var i = 0; i < planets.length; i++) {
		var d = dist(mouseX, mouseY, planets[i].pos.x, planets[i].pos.y);
		if (d < planets[i].radius) {
			selectingPlanet = planets[i];
			break;
		}
	}
	if(sun !== null) {	
		var d = dist(mouseX, mouseY, sun.pos.x, sun.pos.y);
		if (d < sun.radius) {
			selectingSun = sun;
		} 
	}

	if(selectingPlanet !== null){
		if(selectedObject !== null && selectedObject !== sun){//取消select 选中
			selectedObject.selectDom = false;
		}
		selectedObject = selectingPlanet;
		select.value(selectedObject.ID);

	} else if(selectingSun !== null){
		selectedObject = selectingSun;
		select.value("行星列表");//重置select
	}
}

                                              

/*--------------------------------------DOM 函数------------------------------------ */
function emptyTrack(){
	trailLayer.clear();//清空轨迹图层所有轨迹
}

function deletePlanetSun(){//行星被框选就可以删除
    if (selectedObject !== null) {
		if(selectedObject === sun) {
			sun = null;
        	selectingSun = null;
			selectedObject = null;
		} else {
			let options = select.elt.options;// 获取选项列表
			for (let i = 0; i < options.length; i++) {// 遍历选项列表，找到要删除的选项并移除
				if (options[i].text == selectedObject.ID) {
				options[i].remove();
				break; 
				}
			}

			var selectedIndex = planets.indexOf(selectedObject);
			planets.splice(selectedIndex, 1);
			selectedObject = null;
			selectingPlanet = null;
		}
	}
}

function Pause(){
    paused = !paused
	if(paused){
		$('#pause').text("继续");
	}else{
		$('#pause').text("暂停");
	}
}

function editShowPlanetSun(){//打开编辑框
    if (selectedObject !== null) {
		paused = true;
		$('#pause').text("继续");

		$('#myModal').modal('show');
		if(selectedObject === sun){
			var jsonString = JSON.stringify(selectedObject, null, "\t");
		}else{
			let tem = {};
			let allowedKeys = ["R", "G", "B", "pos", "vel", "mass"];

			for (let key in selectedObject) {
				if (selectedObject.hasOwnProperty(key) && allowedKeys.includes(key)) {
					tem[key] = selectedObject[key];
				}
			}
			if(selectedObject.standardOrbit) tem["e"] = selectedObject.e;
			var jsonString = JSON.stringify(tem, null, "\t");
		}
		$("#simData").val(jsonString)

		// 获取要修改的元素
		var modalTitle = document.getElementById("myModalLabel");
		if(selectedObject === sun) modalTitle.innerHTML = '编辑数据   太阳';
		else modalTitle.innerHTML = '编辑数据   行星'+String(selectedObject.ID);
		modalTitle.style.color = `rgb(${selectedObject.R}, ${selectedObject.G}, ${selectedObject.B})`;
	}
}

function editPlanetSun(){//保存编辑数据
	try{
		if(JSON.parse($("#simData").val())==undefined){
			alert('失败！数据非法')
			return
		}
		var newData = JSON.parse($("#simData").val());
		// $.cookie('sim_data', simData, { expires: 365 });
	} catch (e){
		alert('数据非法')
	}

	if(selectedObject !== null && typeof newData === 'object' && typeof selectedObject === 'object'){
		for (let key in newData) {
			if(key==="e"){
				/* 修改离心率 */
				if(sun && selectedObject && selectedObject!==sun && selectedObject.vel.x==0 && selectedObject.pos.y === sun.pos.y){
					selectedObject.e = newData.e;
					var r0 = abs(selectedObject.pos.x - sun.pos.x);//矢径的模
					var c0_2 = (1 + selectedObject.e) * r0;//圆锥曲线的半正焦弦  若var c0_2 = (1 - selectedObject.e) * r0;时，且0 < e < 1时为小椭圆
					selectedObject.vel = createVector(0,
						sqrt(Gravity*sun.mass* (2/r0 + (sq(selectedObject.e)-1)/c0_2)));
					selectedObject.vel_0 = createVector(selectedObject.vel.x, selectedObject.vel.y);
				} 
			} else {
				selectedObject[key] = newData[key];
			}
		}
		if(selectedObject !== sun){
			selectedObject.pos = createVector(float(selectedObject.pos.x), float(selectedObject.pos.y));
			selectedObject.vel = createVector(float(selectedObject.vel.x), float(selectedObject.vel.y));
		} else {
			sunMass = selectedObject.mass;
		}
	}
}

function updateCheckbox() {
	shoot.shooting = false;

	shooting_mode =!shooting_mode;
}

function handleSelect() {
	let selectedValue = select.value();
	
	for(var i = 0; i < planets.length; i++){
		if(planets[i].ID == selectedValue){
			planets[i].selectDom = true;
			if(selectedObject !== null && selectedObject !== sun){
				selectedObject.selectDom = false;
			}
			selectedObject = planets[i];
			selectingPlanet = planets[i];
		}
	}
	if(selectedValue == "行星列表") {
		if(selectedObject !== null && selectedObject !== sun){
			selectedObject.selectDom = false;
		}
	}
}

function reset (planet) {//重置行星
	if(planet === null) return;
	if(sun !== null && planet === sun) return; 
	
	planet.vel = planet.vel_0.copy();
	planet.pos = planet.pos_0.copy();
	planet.prevPos = createVector(0, 0);
	paused = true;
	$('#pause').text("继续");
}

function resetAll () {//重置所有行星
	for(var i = 0; i < planets.length; i++) {
		reset(planets[i]);
	}
}

function resetPlanet () {
	if(selectedObject !== null && selectedObject !==sun) {
		reset(selectedObject);
	}
}

function updateInit (planet) {//更新行星位置，重置时会回到这个位置
	if(planet === null) return;
	if(sun !== null && planet === sun) return; 
	
	planet.vel_0 = planet.vel.copy();
	planet.pos_0 = planet.pos.copy();
	planet.prevPos = createVector(0, 0);
}

function updateInitAll () {
	for(var i = 0; i < planets.length; i++) {
		updateInit(planets[i]);
	}
}

function updatePlanet () {
	if(selectedObject !== null && selectedObject !==sun) {
		updateInit(selectedObject);
	}
}

function saveModel () {
	let saveData = {
		sun: {},
		planets:{}
	};
	for(var i = 0; i < planets.length; i++) {
		var pla = {}
		pla.R = planets[i].R;
		pla.G = planets[i].G;
		pla.B = planets[i].B;
		pla.mass = planets[i].mass;
		pla.standarOrbit = planets[i].standardOrbit;
		pla.e = planets[i].e;
		pla.posx = planets[i].pos_0.x;
		pla.posy = planets[i].pos_0.y;
		pla.velx = planets[i].vel_0.x;
		pla.vely = planets[i].vel_0.y;
		pla.ID = planets[i].ID;
		saveData.planets[pla.ID] = pla;
	}
	if(sun === null) {
		saveData.sun = null;
	} else {
		saveData.sun.posx = sun.pos.x;
		saveData.sun.posy = sun.pos.y;
		saveData.sun.mass = sun.mass;
	}
	saveData.Gravity = Gravity;
	saveData.epoch = epoch;
	saveData.dt = dt;

	saveJSON(saveData, modelName);//直接将对象转化为JSON文件
}

function LoadModel() {
	loadJSON(loadjsonPath, function(data) {//直接从JSON文件读取对象
		let options = select.elt.options;// 获取选项列表
		for (let i= options.length - 1; i > 0; i--) {// 遍历选项列表，找到要删除的选项并移除
			options[i].remove();
		}

		// console.log(data);
		planets = [];
		sun = null;
		// 使用 for...in 遍历 JSON 对象的属性
		if(data.sun === null){
			sun = null;
		} else{
			sunMass = data.sun.mass;
			sun = new Sun(data.sun.posx, data.sun.posy, sunMass);
		}

		for (var id in data.planets) {
			if (data.planets.hasOwnProperty(id)) {
				append(planets, new Planet(
					data.planets[id].posx,
					data.planets[id].posy,
					data.planets[id].velx,
					data.planets[id].vely,
					data.planets[id].R,
					data.planets[id].G,
					data.planets[id].B,
					data.planets[id].mass,
					data.planets[id].ID,
					data.planets[id].standarOrbit,
					data.planets[id].e
				));
				select.option(int(id));
				const selectElement = select.elt; // 获取 select 元素的底层 HTML 元素
				selectElement.options[selectElement.length - 1].style.color =
				 `rgb(${data.planets[id].R},
					  ${data.planets[id].G},
					  ${data.planets[id].B})`;
				planteID.value = max(planteID.value,int(id));
			}
		}
		planteID.value = planteID.value + 1;

		Gravity = data.Gravity;
		epoch = data.epoch;
		dt = data.dt;
	});
}
/*--------------------------------------DOM 函数------------------------------------ */
