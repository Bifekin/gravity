// sketch.js 文件中定义了一些全局变量和函数，其中 setup 和 draw 函数是 p5.js 提供的特殊函数，用于设置初始状态和在每一帧绘制画面。这两个函数的执行由 p5.js 引擎控制，而不是手动调用。

//定义对象
var sun; //不考虑自身运动的特殊“行星”
var planets = [] ;
var shoot; //发射器

//标记运行状态
var paused = true;//是否处于暂停运行状态
var shooting_mode = false;//是否处于可以鼠标发射模型

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
var massInput;
var updateMassButton;
var eccentricityInput;
var updateEccentricityButton;
let checkbox;
let select;

//模型文件位置
modelName = "model_1.json";//保存的模型名称
loadjsonPath =  'model/threeBody_circles.json';//加载的模型位置


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

	/* 更改质量 */
	massInput = createInput(planetMass);// 创建输入框
	massInput.size(50); // 设置输入框的宽度为 50 像素
	massInput.position(windowWidth - 55, height - 30); 
	updateMassButton = createButton('Update Mass');// 创建按钮
	updateMassButton.position(windowWidth - 155, height - 30);
	updateMassButton.mousePressed(updateMass);

	/* 更改离心率 */
	eccentricityInput = createInput('0');
	eccentricityInput.size(50); 
	eccentricityInput.position(windowWidth - 55, height - 55);
	updateEccentricityButton = createButton('Update e');
	updateEccentricityButton.position(windowWidth - 155, height - 55);
	updateEccentricityButton.mousePressed(updateEccentricityInput);0

	/* 更改速度 */
	velxInput = createInput('0');
	velxInput.size(30);
	velxInput.position(windowWidth - 115, height - 80); 
	updateVelxButton = createButton('v_x');
	updateVelxButton.position(windowWidth - 155, height - 80);
	updateVelxButton.mousePressed(updateVelx);
	velyInput = createInput();
	velyInput.size(30); 
	velyInput.position(windowWidth - 35, height - 80); 
	updateVelyButton = createButton('v_y');
	updateVelyButton.position(windowWidth - 75, height - 80);
	updateVelyButton.mousePressed(updateVely);

	/* 更改位置 */
	posxInput = createInput();
	posxInput.size(30); 
	posxInput.position(windowWidth - 115, height - 105); 
	updatePosxButton = createButton('p_x');
	updatePosxButton.position(windowWidth - 155, height - 105);
	updatePosxButton.mousePressed(updatePosx);
	posyInput = createInput(sun.pos.y);
	posyInput.size(30); 
	posyInput.position(windowWidth - 35, height - 105); 
	updatePosyButton = createButton('p_y');
	updatePosyButton.position(windowWidth - 75, height - 105);
	updatePosyButton.mousePressed(updatePosy);

	/* 创建是否为鼠标射击模式 */
	checkbox = createCheckbox('shooting', false);
	checkbox.style('color', '#000000');  // 设置文字颜色
	checkbox.style('background-color', '#ffffff');  // 设置背景颜色
  	checkbox.changed(updateCheckbox);
	checkbox.position(270, height - 30); 

	/* 创建 select 元素 */
	select = createSelect();
	select.position(40, 7);
	select.option('行星列表')
	select.changed(handleSelect);// 添加选择事件

	/* 重置行星为初速度，初始位置 */
	resetButton = createButton('reset');
	resetButton.position(120, 7);
	resetButton.mousePressed(function() {
		reset(selectedObject);
	});
	resetallButton = createButton('reset all');
	resetallButton.position(170, 7);
	resetallButton.mousePressed(resetAll);

	/* 更新行星初速度，初始位置 */
	updateInitButton = createButton('update');
	updateInitButton.position(250, 7);
	updateInitButton.mousePressed(function() {
		updateInit(selectedObject);
	});
	updateInitallButton = createButton('update all');
	updateInitallButton.position(310, 7);
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
		/* 更新发射器状态并且绘制发射器 */
		shoot.update(Gravity, sunMass, planteID, planets, select, shooting_mode);
		shoot.draw();
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
  
	/* 删除 行星或太阳 */
	if (key === "d" || key === "D") {//鼠标选中才能删除
		if (selectingPlanet !== null) {
			//删除select元素
			let options = select.elt.options;// 获取选项列表
			for (let i = 0; i < options.length; i++) {// 遍历选项列表，找到要删除的选项并移除
				if (options[i].text == selectingPlanet.ID) {
					options[i].remove();
					break; 
				}
			}
			//删除行星
			var selectedIndex = planets.indexOf(selectingPlanet);
			planets.splice(selectedIndex, 1);
			selectingPlanet = null;
			selectedObject = null;
		} else if(selectingSun !== null){
			sun = null;
			selectingSun = null;
			selectedObject = null;
		}
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

function deletePlanetSun(){//只要被行星被选择就可以删除，鼠标选择或者select框选择
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
}

function updateMass() {//更新质量
	var newMass = float(massInput.value());// 将输入框的值转换为浮点数
	
	if (!isNaN(newMass) && selectedObject) {// 检查值的有效性，确保它是一个数  
		selectedObject.mass = newMass;
		selectedObject.radius = 2.5 * Math.log10(selectedObject.mass) + 5;
		if(selectedObject.radius <= 0) selectedObject.radius = 0.1
	}
}

function updateEccentricityInput() {//更新离心率
	var newEccentricity = float(eccentricityInput.value());// 将输入框的值转换为浮点数
	
	//满足条件才能更改离心率
	if (sun !== null && !isNaN(newEccentricity) && selectedObject && selectedObject!==sun && selectedObject.vel.x==0 && selectedObject.pos.y === sun.pos.y) {
		selectedObject.e = newEccentricity;
		var r0 = abs(selectedObject.pos.x - sun.pos.x);//矢径的模
		var c0_2 = (1 + selectedObject.e) * r0;//圆锥曲线的半正焦弦  若var c0_2 = (1 - selectedObject.e) * r0;时，且0 < e < 1时为小椭圆
		selectedObject.vel = createVector(0,
			sqrt(Gravity*sun.mass* (2/r0 + (sq(selectedObject.e)-1)/c0_2)));
		selectedObject.vel_0 = createVector(selectedObject.vel.x, selectedObject.vel.y);
	}
}

function updateVelx () {
	var newVelx = float(velxInput.value());
	if (!isNaN(newVelx) && selectedObject && selectedObject !== sun) {
		selectedObject.vel.x = newVelx;
		// if(newVelx !== 0)	selectedObject.standardOrbit = false;
	}
}

function updateVely () {
	var newVely = float(velyInput.value());
	if (!isNaN(newVely) && selectedObject && selectedObject !== sun) {
		selectedObject.vel.y = newVely;
	}
}

function updatePosx () {
	var newPosx = float(posxInput.value());
	if (!isNaN(newPosx) && selectedObject) {
		selectedObject.pos.x = newPosx;
	}
}

function updatePosy () {
	var newPosy = float(posyInput.value());
	if (!isNaN(newPosy) && selectedObject) {
		selectedObject.pos.y = newPosy;
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

function reset (resetPlanet) {//重置行星
	if(resetPlanet === null) return;
	if(sun !== null && resetPlanet === sun) return; 
	
	resetPlanet.vel = resetPlanet.vel_0.copy();
	resetPlanet.pos = resetPlanet.pos_0.copy();
	resetPlanet.prevPos = createVector(0, 0);
	paused = true;
}

function resetAll () {//重置行星
	for(var i = 0; i < planets.length; i++) {
		reset(planets[i]);
	}
}

function updateInit (updateInitPlanet) {//重置行星
	if(updateInitPlanet === null) return;
	if(sun !== null && updateInitPlanet === sun) return; 
	
	updateInitPlanet.vel_0 = updateInitPlanet.vel.copy();
	updateInitPlanet.pos_0 = updateInitPlanet.pos.copy();
	updateInitPlanet.prevPos = createVector(0, 0);
}

function updateInitAll () {
	for(var i = 0; i < planets.length; i++) {
		updateInit(planets[i]);
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

	saveJSON(saveData, modelName);
}

function LoadModel() {
	loadJSON(loadjsonPath, function(data) {
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

function addPlanet(){
	window.alert("还未实现！意义不大")
}
/*--------------------------------------DOM 函数------------------------------------ */
