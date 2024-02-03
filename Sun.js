function Sun(x,y,mass) {
	this.pos = createVector(x, y);
	this.radius = 10;
	this.mass = mass;
	this.R = 255;
	this.G = 0;
	this.B = 0;

	this.draw = function(selectingSun) {
		fill(255);
		ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2); 

		// 如果sun被选中
		if (selectingSun !== null) {
			/*绘制虚线框*/
			push();
			noFill();
			stroke(255);
			strokeWeight(1);
			ellipse(this.pos.x, this.pos.y, this.radius*2 + 10, this.radius*2 + 10);
			pop();
		}
	}

	this.displayInfo = function () {
		/* Display planet information */
		push(); 
		textSize(16);
		fill(255);
		textAlign(LEFT, TOP);
		text("Sun " , 10, 10);
		text("Mass: " + this.mass, 10, 30);
		text("Position: (" + nfc(this.pos.x, 1) + ", " + nfc(this.pos.y, 1) + ")", 10, 50);
		pop();
	  };
}