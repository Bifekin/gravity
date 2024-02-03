function Planet(x,y,velx,vely,R,G,B,mass,ID,standardOrbit=false,e=0) {
	this.R = R || 0;
	this.G = G || 0;
	this.B = B || 0;
	this.pos = createVector(x, y);
	this.pos_0 = createVector(x, y);//初始位置
	this.prevPos = createVector(0, 0);
	this.vel = createVector(velx, vely);
	this.vel_0 = createVector(velx, vely);//初速度
	this.acc = createVector(0, 0);
	this.mass = mass;
	this.radius = 2.5 * Math.log10(this.mass) + 5;
	this.Gravity = Gravity;
	this.ID = ID;
	this.standardOrbit = standardOrbit;//是否为单恒星系统的按键以离心率为e的圆锥曲线标准发射 等价于 初速度满足垂直矢径
	this.e = e;//单恒星系统行星的离心率，单恒星系统才考虑这个参数,否则为无效参数

	this.draw = function(selectingPlanet, trailLayer) {
		/* Draw planet */
		push(); // 保存当前画布状态
		noStroke(); // 不绘制边框
		fill(255, 255, 255, 250); // 使用指定颜色填充，最后一个参数表示透明度
		translate(this.pos.x, this.pos.y); // 将坐标原点移动到行星位置
		rotate(this.vel.heading()); // 根据速度的方向进行旋转
		ellipse(0, 0, this.radius * 2, this.radius * 2); // 绘制行星，以当前位置为中心
		pop(); // 恢复之前保存的画布状态
	
		// 在轨迹图层上绘制轨迹
		trailLayer.stroke(this.R, this.G, this.B);
		if (!this.prevPos.equals(createVector(0, 0))) {
			trailLayer.strokeWeight(this.radius/100 + 0.8);
		  	trailLayer.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
		}
		
		// 如果行星被鼠标选中，或者被select选中
		if (selectingPlanet === this) {
			/* 绘制虚线框 */
			push();
			noFill();
			stroke(255);
			strokeWeight(1);
			ellipse(this.pos.x, this.pos.y, this.radius * 2 + 20, this.radius * 2 + 20);
			pop();
		}

		// 可视化速度箭头
		push();
		translate(this.pos.x, this.pos.y);
		rotate(this.vel.heading());
		let arrowSize = this.vel.mag() * 10; // 箭头的长度等于速度的大小
		stroke(this.R, this.G, this.B); // 使用行星的颜色
		strokeWeight(2);
		fill(this.R, this.G, this.B); // 使用行星的颜色
		line(0, 0, arrowSize, 0);
		line(arrowSize, 0, arrowSize - 3, -3);
		line(arrowSize, 0, arrowSize - 3, 3);
		pop();

		/* //显示行星ID
		fill(255);
        textSize(12);
        textAlign(CENTER, CENTER);
        text(this.ID, this.pos.x, this.pos.y); */
	}

	this.applyForce = function(force) {
		this.acc.add(force.mult(1.0/this.mass));
	}

	this.update = function (dt) {
		this.prevPos = this.pos;
		this.vel.add(p5.Vector.mult(this.acc, dt)); // 积分
		this.pos.add(p5.Vector.mult(this.vel, dt));
		this.acc.mult(0);
	}	

	this.orbit = function(body) {
		var gravity_force = 0; 
		var gravity_force_x = 0; 
		var gravity_force_y = 0; 
		var x_dir = 0;
		var y_dir = 0;
		var alpha =  0;


		/* Gravitational force */
		var g_dist = dist(this.pos.x,this.pos.y,body.pos.x,body.pos.y)
		gravity_force = ((this.Gravity * this.mass * body.mass)/(sq(g_dist)));
		if (body.pos.x != this.pos.x) {
			alpha = atan(abs((body.pos.y - this.pos.y)) / abs((body.pos.x - this.pos.x)));
			gravity_force_x = gravity_force * cos(alpha);
			gravity_force_y = gravity_force * sin(alpha);
		} else {
			gravity_force_x = 0;
			gravity_force_y = gravity_force;
		}	

		/* Gravitational force direction */
		if (this.pos.x < body.pos.x) {
			if(this.pos.y < body.pos.y) {
				x_dir = 1;
				y_dir = 1;
			} else {
				x_dir = 1;
				y_dir = -1;
			}
		} else {
			if(this.pos.y < body.pos.y) {
				x_dir = -1;
				y_dir = 1;
			} else {
				x_dir = -1;
				y_dir = -1;
			}
		}

		/* Apply gravitational force */
		this.applyForce(createVector((x_dir * gravity_force_x), (y_dir * gravity_force_y)));
	}

	this.displayInfo = function () {
		/* Display planet information */
		push(); 
		textSize(16);
		fill(this.R, this.G, this.B, 250);
		textAlign(LEFT, TOP);
		text("ID: ", 10, 10);
		text("Mass: " + this.mass, 10, 50);
		text("Speed: " + nfc(this.vel.mag(), 2), 10, 70);
		text("Velocity: (" + nfc(this.vel.x, 1) + ", " + nfc(this.vel.y, 1) + ")", 10, 90);
		text("Position: (" + nfc(this.pos.x, 1) + ", " + nfc(this.pos.y, 1) + ")", 10, 110);
		text("初始位置: (" + nfc(this.pos_0.x, 1) + ", " + nfc(this.pos_0.y, 1) + ")", 10, 130);
		text("初速度: (" + nfc(this.vel_0.x, 1) + ", " + nfc(this.vel_0.y, 1) + ")", 10, 150);
		if(this.standardOrbit && sun !== null) {
			if(this.e === 0) text("标准轨迹发射: 圆",10,190);
			if(this.e < 1 && this.e > 0) text("标准轨迹发射: 椭圆",10,190);
			if(this.e === 1) text("标准轨迹发射: 抛物线",10,190);
			if(this.e > 1) text("标准轨迹发射: 双曲线",10,190)
			text("离心率: " + nfc(this.e, 1), 10,210);
			var r0 = abs(sun.pos.x - this.pos_0.x);
			var v1 = sqrt(Gravity * sunMass/ r0);
			var v2 = sqrt(2 * Gravity * sunMass / r0);
			text("对于矢径 r0=" + nfc(r0,1) + " 临界初速度: v1=" + nfc(v1, 1) + " & v2="+ nfc(v2, 1), 10, 230);
		}
		pop();
	};
}