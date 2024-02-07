// sketch.js 文件中定义了一些全局变量和函数，其中 setup 和 draw 函数是 p5.js 提供的特殊函数，用于设置初始状态和在每一帧绘制画面。这两个函数的执行由 p5.js 引擎控制，而不是手动调用。

//定义对象
let sun; //不考虑自身运动的特殊“行星”
let planets = [] ;
let shoot; //发射器
let particleSystems = []; // 存储所有粒子系统的数组, 碰撞效果

//标记运行状态
let paused = false;//是否处于暂停运行状态
let shooting_mode = true;//是否处于可以鼠标发射模型

//定义鼠标选中对象
let selectingPlanet = null;//正在选中的行星
let selectingSun = null;//正在选中的太阳
let planteID = 1; //行星编号

//设置背景
let backgroundImage; //设置背景图片
let trailLayer; // 轨迹图层

//设置参数
let sunMass = 100; 
let planetMass = 1; //范围一般为1-1000
let Gravity = 1000;
let epoch = 200; //每次p5.js函数调用draw()函数时，进行引力计算并更新参数的次数
let dt = 0.1/epoch; //微分时间 和epoch对应，dt小==>误差小, epoch大，卡顿

//DOM
let checkbox;
let select;

//模型文件位置
modelName = "model_1.json";//保存的模型名称
loadjsonPath =  'model/threeBody_8.json';//加载的模型位置


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
	checkbox.style('background-color', '#ffffffea');  // 设置背景颜色
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
		for(let i = 0; i < to_splice.length; i++) {
			deletePlanet(planets[to_splice[i]]);
		}

		/* 多次计算行星之间的引力并且更新状态 */
		crash();//是否有行星碰撞
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

		for (let ps of particleSystems.slice()) {//显示碰撞的粒子系统
			  ps.display();
		}	  
	}

	shadeLight();//渲染光晕
	blendMode(ADD);
	image(haloLayer, 0, 0);

	/* 太阳存在则绘制太阳 */
	if(sun !== null) sun.draw(selectingSun);
	
	/* 更新发射器状态并且绘制发射器 */
	let lt = planets.length;
	shoot.update(Gravity, sunMass, shooting_mode);
	shoot.draw();
	if(lt < planets.length) {/* 自动选中新建的行星 */
		selectingPlanet = planets[planets.length - 1];
		selectingSun = null;
		select.value(selectingPlanet.ID);
	}

	displayInfo();	
}

function keyPressed() {
	if (key === " ") {
	  paused = !paused;//暂停或者停止暂停
	}
}

function mouseClicked() {
	/* 用鼠标选中行星或者太阳 */
	for (var i = 0; i < planets.length; i++) {
		var d = dist(mouseX, mouseY, planets[i].pos.x, planets[i].pos.y);
		if (d < planets[i].radius) {
			selectingPlanet = planets[i];
			selectingSun = null;
			break;
		}
	}
	if(sun !== null) {	
		var d = dist(mouseX, mouseY, sun.pos.x, sun.pos.y);
		if (d < sun.radius) {
			selectingSun = sun;
			selectingPlanet = null;
		} 
	}
	/* 点击选中行星后更新select */ 
	if(selectingPlanet !== null){
		select.value(selectingPlanet.ID);
	} else if(selectingSun !== null){
		select.value("行星列表");//重置select
	}
}

function crash () {
	let crashPlanets = [];
	let cnt = planets.length;
	for (var i = 0; i < cnt; i++) {
		for (var j = i + 1; j < cnt; j++) {
			let distance = dist(planets[i].pos.x, planets[i].pos.y, planets[j].pos.x, planets[j].pos.y);
			if(distance <= planets[i].radius + planets[j].radius) {
				crashPlanets.push(planets[i].ID);
				crashPlanets.push(planets[j].ID);
				let newMass = planets[i].mass + planets[j].mass;
				let velx = (planets[i].vel.x * planets[i].mass + planets[j].vel.x * planets[j].mass)/newMass;
				let vely = (planets[i].vel.y * planets[i].mass + planets[j].vel.y * planets[j].mass)/newMass;
				let posx = (planets[i].pos.x+planets[j].pos.x)*0.5;
				let posy = (planets[i].pos.y+planets[j].pos.y)*0.5;
				let R = (planets[i].R + planets[j].R) * 0.5;
				let G = (planets[i].G + planets[j].G) * 0.5;
				let B = (planets[i].B + planets[j].B) * 0.5;
				addNewPlanet(posx, posy, velx, vely, R, G, B,false,0,newMass);
				
				particleSystems.push(new ParticleSystem(posx,posy,R,G,B,1));	
			}
		}
	}
	for (let A in crashPlanets) {
		for(let i = 0; i < planets.length; i++) {
			if(crashPlanets[A] == planets[i].ID){ 
				deletePlanet(planets[i]);
			}
		}
	}
	for (let ps of particleSystems.slice()) {
		if (ps.lifespan < 0) {
		  let index = particleSystems.indexOf(ps);
		  if (index !== -1) {
			particleSystems.splice(index, 1);
		  }
		} else {
		  ps.display();
		  ps.update();
		}
	}	  
}

function shadeLight () {
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
}

function displayInfo () {
	/* 显示选中的行星或者太阳的信息 */
	if (selectingPlanet !== null) {
		selectingPlanet.displayInfo();
	} else if (selectingSun !== null) {
		selectingSun.displayInfo();
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
	text("Frame Rate: " + currentFrameRate.toFixed(0), width - 10, 30);
}

function addNewPlanet (x,y,velx,vely,R,G,B,standardOrbit=false,e=0,newMass=planetMass) {
	append(planets, new Planet(x, y, velx, vely, R, G, B, newMass, planteID, standardOrbit, e));
	select.option(planteID);
	const selectElement = select.elt; // 获取 select 元素的底层 HTML 元素
	selectElement.options[selectElement.length - 1].style.color = `rgb(${this.R}, ${this.G}, ${this.B})`;
	planteID = planteID + 1;
}

function deletePlanet (planet) {
	if(selectingPlanet == planet) {
		selectingPlanet = null
	}

	let options = select.elt.options;// 获取选项列表
	for (let i = 0; i < options.length; i++) {// 遍历选项列表，找到要删除的选项并移除
		if (options[i].text == planet.ID) {
			options[i].remove();
			break; 
		}
	}
	var selectedIndex = planets.indexOf(planet);
	planets.splice(selectedIndex, 1);
}

function showNotification(message, duration) {//显示操作提示
    var notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(function() {
        notification.classList.add('hidden');
    }, duration);
}
                                              

/*--------------------------------------DOM 函数------------------------------------ */
function emptyTrack() {
	trailLayer.clear();//清空轨迹图层所有轨迹
}

function deletePlanetSun(event) {//行星被框选就可以删除
	if(selectingSun !== null) {
		sun = null;
		selectingSun = null;
		showNotification('删除成功', 2000);
	} else if(selectingPlanet !== null) {
		deletePlanet(selectingPlanet);
		showNotification('删除成功', 2000);
	} else {
		showNotification('选择删除对象', 2000);
	}
	updateSubMenu(event);
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
	noLoop();

	if(selectingSun !== null) {
		paused = true;
		$('#pause').text("继续");

		event.stopPropagation();
		$('#myModal').modal('show');
		var jsonString = JSON.stringify(selectingSun, null, "\t");
		$("#simData").val(jsonString);
		let modalTitle = document.getElementById("myModalLabel");
		modalTitle.innerHTML = '编辑数据   太阳';
		modalTitle.style.color = `rgb(${selectingSun.R}, ${selectingSun.G}, ${selectingSun.B})`;
	} else if (selectingPlanet !== null) {
		paused = true;
		$('#pause').text("继续");

		event.stopPropagation();
		$('#myModal').modal('show');
		let tem = {};
		let allowedKeys = ["R", "G", "B", "pos", "vel", "mass"];

		for (let key in selectingPlanet) {
			if (selectingPlanet.hasOwnProperty(key) && allowedKeys.includes(key)) {
				tem[key] = selectingPlanet[key];
			}
		}
		if(selectingPlanet.standardOrbit) tem["e"] = selectingPlanet.e;
		let jsonString = JSON.stringify(tem, null, "\t");
		$("#simData").val(jsonString)
		let modalTitle = document.getElementById("myModalLabel");
		modalTitle.innerHTML = '编辑数据   行星'+String(selectingPlanet.ID);
		modalTitle.style.color = `rgb(${selectingPlanet.R}, ${selectingPlanet.G}, ${selectingPlanet.B})`;
	} else {
		loop();
		showNotification('选择编辑对象', 2000);
	}

	$('#myModal').on('hidden.bs.modal', function () {
		loop();
	});
}

function editPlanetSun(){//保存编辑数据
	try{
		if(JSON.parse($("#simData").val())==undefined){
			showNotification('保存失败，数据非法', 3000);
			return
		}
		var newData = JSON.parse($("#simData").val());
		// $.cookie('sim_data', simData, { expires: 365 });
	} catch (e){
		showNotification('保存失败', 3000); // 在屏幕上显示"..."，3秒后自动消失
		editShowPlanetSun();
	}

	if(selectingSun !== null && typeof newData === 'object' && typeof selectingSun === 'object') {
		for (let key in newData) {
				selectingSun[key] = newData[key];
		}
		sunMass = selectingSun.mass;
		showNotification('保存成功', 3000);
	} else if(selectingPlanet !== null && typeof newData === 'object' && typeof selectingPlanet === 'object') {
		for (let key in newData) {
			if(key==="e"){
				/* 修改离心率 */
				if(sun !== null && selectingPlanet.vel.x==0 && selectingPlanet.pos.y === sun.pos.y){
					selectingPlanet.e = newData.e;
					var r0 = abs(selectingPlanet.pos.x - sun.pos.x);//矢径的模
					var c0_2 = (1 + selectingPlanet.e) * r0;//圆锥曲线的半正焦弦  若var c0_2 = (1 - selectingPlanet.e) * r0;时，且0 < e < 1时为小椭圆
					selectingPlanet.vel = createVector(0,
						sqrt(Gravity*sun.mass* (2/r0 + (sq(selectingPlanet.e)-1)/c0_2)));
					selectingPlanet.vel_0 = createVector(selectingPlanet.vel.x, selectingPlanet.vel.y);
				} 
			} else {
				selectingPlanet[key] = newData[key];
			}
		}
		selectingPlanet.pos = createVector(float(selectingPlanet.pos.x), float(selectingPlanet.pos.y));
		selectingPlanet.vel = createVector(float(selectingPlanet.vel.x), float(selectingPlanet.vel.y));
		showNotification('保存成功', 3000);
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
			selectingPlanet = planets[i];

		}
	}
	if(selectedValue == "行星列表") {
		selectingPlanet = null;
		selectingSun = null;
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
	showNotification('重置成功', 2000);
}

function resetPlanet () {
	if(selectingPlanet !== null) {
		reset(selectingPlanet);
		showNotification('重置成功', 2000);
	} else {
		showNotification('选择重置对象', 2000);
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
	showNotification('更新成功', 2000);
}

function updatePlanet () {
	if(selectingPlanet !== null) {
		updateInit(selectingPlanet);
		showNotification('更新成功', 2000);
	} else {
		showNotification('选择更新对象', 2000);
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
	showNotification('模型成功保存', 2000);
}

function LoadModel() {
	loadJSON(loadjsonPath, function(data) {//直接从JSON文件读取对象
		let options = select.elt.options;// 获取选项列表
		for (let i= options.length - 1; i > 0; i--) {// 遍历选项列表，找到要删除的选项并移除
			options[i].remove();
		}

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
				planteID = max(planteID,int(id));
			}
		}
		planteID = planteID + 1;

		Gravity = data.Gravity;
		epoch = data.epoch;
		dt = data.dt;
	});

	selectingPlanet = null;
	selectingSun = null;
	select.value("行星列表");
	showNotification('模型成功加载', 2000);
}

function updateSubMenu (event) {
	planetSubMenu.innerHTML = ""; // 清空已有的二级菜单项
	for(let i = 0; i < planets.length; i++) {
		const listItem = document.createElement("li");
		listItem.textContent = planets[i].ID;
		listItem.className = "sub-menu-item";
		listItem.style.color = `rgb(${planets[i].R}, ${planets[i].G}, ${planets[i].B})`;
		listItem.onclick = function (event) {
			// 这里添加每个二级菜单项的功能
			selectingPlanet = planets[i];
			selectingSun = null;
			select.value(selectingPlanet.ID);
			event.stopPropagation(); // 阻止事件冒泡，防止点击二级菜单项时触发上下文菜单的隐藏
		};
		planetSubMenu.appendChild(listItem);
	}
}
/*--------------------------------------DOM 函数------------------------------------ */
