function Shooter() {
	this.x1 = 0;//发射器起点
	this.y1 = 0;
	this.x2 = 0;//发射器终点
	this.y2 = 0;
	this.R = 0;//发射器颜色
	this.G = 0;
	this.B = 0;
	this.vel = 0;//发射器的初速度
	this.vel_x = 0;
	this.vel_y = 0;
	this.shooting=false;//标记是否处于鼠标发射模型
	this.c_shooting=false;//标记是否处于键盘发射模型(o键)
	this.touchKey=false;//用于避免重复触发键盘输入,这种模式常用于检测按键的瞬时触发而不是持续触发

	this.update = function(Gravity, sunMass, planetMass, planteID, planets, select, shooting_mode) {

		/* 标准轨道发射器 */
		if((!this.shooting) && (keyIsPressed) && (key === "o" || key ==='O') && (!this.c_shooting) && (!this.touchKey) && sun !== null) {
			this.c_shooting = true;
			this.touchKey = true;
			this.R = floor(random(255));
			this.G = floor(random(255));
			this.B = floor(random(255));
			this.vel = 0;
			this.vel_x = 0;
			this.vel_y = 0;

	
			this.x1 = mouseX;
			this.x2 = mouseX;
			this.y1 = sun.pos.y;
			this.vel = sqrt(Gravity * sunMass/(abs(sun.pos.x - mouseX)));//sqrt(G*M/R)
			this.vel_y = this.vel;
			this.y2 = this.y1 - (10 * this.vel_y);
		}

		if((!this.shooting) && (keyIsPressed) && (key === "o" || key==='O') && (this.c_shooting) && (!this.touchKey)) {
			this.touchKey = true;
			
			this.vel_y = -this.vel_y;
			this.y2 = this.y1 - (10 * this.vel_y);
		}//微调方向

		if((!this.shooting) && (keyIsPressed)  && (keyCode == ENTER) && (this.c_shooting) && (!this.touchKey)) {
			this.c_shooting = false;
			this.touchKey = true;

			append(planets, new Planet(this.x1, this.y1,this.vel_x,this.vel_y,this.R,this.G,this.B,planetMass,planteID.value,true,0));
			select.option(planteID.value);
			const selectElement = select.elt; // 获取 select 元素的底层 HTML 元素
			selectElement.options[selectElement.length - 1].style.color = `rgb(${this.R}, ${this.G}, ${this.B})`;
			planteID.value = planteID.value + 1;
		}//按下Enter确认行星

		if((!this.shooting) && (keyIsPressed)  && (keyCode == ESCAPE) && (this.c_shooting) && (!this.touchKey)) {
			this.c_shooting = false;
			this.touchKey = true;
		}//按下Esc取消发射器

		if (!keyIsPressed) {
			this.touchKey = false;
		}



		/* 鼠标发射器 */
		if(shooting_mode && (!this.shooting) && (mouseIsPressed) && (mouseButton == LEFT) && (!this.c_shooting)) {
			this.shooting = true;
			this.x1 = mouseX;
			this.y1 = mouseY;
			this.R = floor(random(255));
			this.G = floor(random(255));
			this.B = floor(random(255));
		}

		if (shooting_mode && this.shooting && mouseIsPressed && (mouseButton == LEFT) ) {
			this.x2 = mouseX;
			this.y2 = mouseY;
			this.vel = int(dist(this.x1, this.y1, this.x2, this.y2))/10;
		}

		if (shooting_mode && !mouseIsPressed && this.shooting) {
			var alpha = 0;
			var x_dir = 0;
			var y_dir = 0;

			if (this.vel > 5) {
				if (this.x1 != this.x2) {
					alpha = atan(abs((this.y2 - this.y1)) / abs((this.x2 - this.x1)));
					this.vel_x = this.vel * cos(alpha);
					this.vel_y = this.vel * sin(alpha);
				} else {
					this.vel_x = 0;
					this.vel_y = this.vel;
				}	

				if (this.x2 < this.x1) {
					if(this.y2 < this.y1) {
						x_dir = 1;
						y_dir = 1;
					} else {
						x_dir = 1;
						y_dir = -1;
					}
				} else {
					if(this.y2 < this.y1) {
						x_dir = -1;
						y_dir = 1;
					} else {
						x_dir = -1;
						y_dir = -1;
					}
				}
				append(planets, new Planet(this.x2, this.y2, (x_dir * this.vel_x),(y_dir * this.vel_y),this.R,this.G,this.B,planetMass,planteID.value));
				select.option(planteID.value);
				const selectElement = select.elt; // 获取 select 元素的底层 HTML 元素
				selectElement.options[selectElement.length - 1].style.color = `rgb(${this.R}, ${this.G}, ${this.B})`;
				planteID.value = planteID.value + 1;
			}
			this.shooting = false;
		}
	}

	this.draw = function() {
		textSize(12);
		if ((this.shooting) || (this.c_shooting)) {
			/* Draw the line and the arraow */
			stroke(255);
			line(this.x1-5,this.y1, this.x1+5, this.y1);
			line(this.x1,this.y1-5, this.x1, this.y1+5);
			line(this.x1, this.y1, this.x2, this.y2);

			/* Draw the futur planet */
			noStroke();
			fill(this.R,this.G,this.B);
			ellipse(this.x2, this.y2, 10, 10);

			push();
			fill(255);
			translate( (this.x1+this.x2)/2, (this.y1+this.y2)/2 );
			if (this.x2 > this.x1) {
					rotate( atan2(this.y2-this.y1,this.x2-this.x1) );
			} else {
					rotate( atan2(this.y1-this.y2,this.x1-this.x2) );
			}
			text(nfc(this.vel, 1), 0, -5);
			pop();
		}
	}
}