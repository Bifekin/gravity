class Particle {

    constructor(x, y, R, G, B, r) {
      this.acc = createVector();
      this.vel = createVector()
      this.vel.mult(0.5);
      this.pos = createVector(x, y);
      this.r = r;
      this.R = R;
      this.G = G;
      this.B = B;
    }
  
    run() {
      this.update();
      this.display();
    }
  
    applyForce(force) {
      this.acc.add(force);
    }
  
    // Method to update position
    update() {
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
      this.vel.mult(0.99);
    }
  
    // Method to display
    display(lifespan) {
        push();
        noStroke(); // 不绘制边框
		fill(this.R, this.G, this.B, lifespan); // 使用指定颜色填充，最后一个参数表示透明度
		translate(this.pos.x, this.pos.y); // 将坐标原点移动到行星位置
		ellipse(0, 0, this.r * 2, this.r * 2); // 绘制行星，以当前位置为中心
        pop();
    }
  }


  class ParticleSystem {
    
    constructor(x, y, R, G, B, r) {
      this.particles = [];
      this.lifespan = 255;
      // this.intact = true;
      let rows = 10;
      let cols = 10;
      for (let i = 0; i < rows * cols; i++) {
        this.particles.push(new Particle(x + (i % cols) * r, y + (floor(i / rows)) * r,
            R, G, B, r));
      }
      for (let particle of this.particles) {
        let force = p5.Vector.random2D();
        // force.mult(5);
        particle.applyForce(force);
      }
    }
  
    display() {
      for (let particle of this.particles) {
        particle.display(this.lifespan);
      }
    }
  
    update() {
        this.lifespan = this.lifespan - 4;
        for (let particle of this.particles) {
            particle.update();
        }
    }
  }